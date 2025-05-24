// Önce temel paketleri import et
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Firebase importları
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
  orderBy,
  limit,
  DocumentData,
  type Timestamp
} from 'firebase/firestore';

// Import missing firestore functionality through our custom wrapper
import { addDoc, deleteDoc, runTransaction, documentId } from '../utils/firestoreUtils';
import { createCollectionRef, createDocRef, getDocsFromCollection, getDocById } from '../utils/firestoreHelpers';
import { createServerTimestamp, createClientTimestamp, dateToTimestamp, timestampToDate } from '../utils/timestampUtils';
import { 
  onAuthStateChanged,
  signOut,
  type User as FirebaseUser 
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Proje dosyalarını import et
import { FirebaseUserProfile, DaySummary, FirebaseMeal, Macros } from '../types/firebase';
import { UserProfile } from '../types/meal';
import { firebaseToAppProfile } from '../utils/profileConverter';
import { useUserStore } from './userStore';

// Firebase servislerini en son import et
import { db, storage, auth } from '../lib/firebase';

export interface FirebaseState {
  // Auth
  user: { uid: string; email: string } | null;
  isAuthenticated: boolean;
  
  // Data
  firebaseProfile: FirebaseUserProfile | null;
  profile: UserProfile | null;
  days: Record<string, DaySummary>;
  mealsByDay: Record<string, FirebaseMeal[]>;
  
  // Loading states
  isLoadingProfile: boolean;
  isLoadingDays: boolean;
  
  // Error states
  hasFirebasePermissionsError: boolean;
  
  // Actions
  setUser: (user: { uid: string; email: string } | null) => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<FirebaseUserProfile>) => Promise<void>;
  fetchDays: (startDate: string, endDate: string) => Promise<void>;
  fetchMealsForDay: (date: string) => Promise<void>;
  addMeal: (meal: Omit<FirebaseMeal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateMeal: (mealId: string, updates: Partial<FirebaseMeal>) => Promise<void>;
  uploadMealPhoto: (uri: string) => Promise<string>;
  
  // Auth listener
  initializeAuthListener: () => (() => void) | undefined;
  
  // Cleanup
  cleanup: () => void;
}

const initialState = {
  user: null,
  isAuthenticated: false,
  firebaseProfile: null,
  profile: null,
  days: {},
  mealsByDay: {},
  isLoadingProfile: false,
  isLoadingDays: false,
  hasFirebasePermissionsError: false,
};

// Helper function to create a minimal profile
const createMinimalProfile = (displayName: string = 'User'): FirebaseUserProfile => {
  console.log("Creating minimal profile with displayName:", displayName);
  return {
    displayName,
    gender: 'other',
    heightCm: 0,
    weightKg: 0,
    goal: 'maintain',
    theme: 'light',
    tdee: 0,
    targets: {
      calories: 0,
      protein: 0,
      carb: 0,
      fat: 0
    },
    onboardingCompleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
};

// Create a properly typed Zustand store with persist middleware
// This follows the Zustand 5.x pattern for TypeScript
export const useFirebaseStore = create(
  persist(
    (set: (state: Partial<FirebaseState> | ((state: FirebaseState) => FirebaseState), replace?: boolean) => void, get: () => FirebaseState) => ({
      ...initialState,
      
      // Auth actions
      setUser: (user: { uid: string; email: string } | null) => {
        console.log("Setting user:", user);
        set({ 
          user, 
          isAuthenticated: !!user 
        });
      },
      
      // Auth listener
      initializeAuthListener: () => {
        console.log("Setting up auth state listener");
        set({ isLoadingProfile: true });
        
        const unsubscribe = onAuthStateChanged(auth, async (fbUser: { uid: string; email: string | null; displayName: string | null; photoURL: string | null } | null) => {
          console.log("Auth state changed:", fbUser ? "Signed in" : "Signed out");
          
          if (!fbUser) {
            // User is signed out
            console.log("User is signed out, resetting state");
            set({
              ...initialState,
              isLoadingProfile: false
            });
            
            // Reset user store state
            useUserStore.getState().resetState();
            return;
          }
          
          // User is signed in
          set({
            user: {
              uid: fbUser.uid,
              email: fbUser.email || ''
            },
            isAuthenticated: true
          });
          
          // Fetch user profile
          try {
            console.log("Fetching profile for user:", fbUser.uid);
            const userRef = doc(db, 'users', fbUser.uid);
            
            // CRITICAL: Create a minimal profile document if it doesn't exist
            // This ensures we always have a document to read
            try {
              console.log("Checking if profile exists at path:", userRef.path);
              const profileDoc = await getDoc(userRef);
              
              if (!profileDoc.exists()) {
                console.log("No profile found, creating minimal profile");
                const minimalProfile = createMinimalProfile(fbUser.displayName || 'User');
                
                try {
                  await setDoc(userRef, {
                    ...minimalProfile,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                  });
                  
                  console.log("Created minimal profile at", userRef.path);
                  
                  // Fetch the newly created profile
                  const newProfileDoc = await getDoc(userRef);
                  if (newProfileDoc.exists()) {
                    const firebaseProfile = newProfileDoc.data() as FirebaseUserProfile;
                    const appProfile = firebaseToAppProfile(firebaseProfile, fbUser.uid);
                    
                    set({ 
                      firebaseProfile,
                      profile: appProfile,
                      isLoadingProfile: false,
                      hasFirebasePermissionsError: false
                    });
                    
                    // Also update the user store
                    useUserStore.getState().setProfile(appProfile);
                  } else {
                    console.error("Failed to fetch newly created profile");
                    set({ 
                      isLoadingProfile: false,
                      hasFirebasePermissionsError: true
                    });
                  }
                } catch (error: unknown) {
                  const firebaseError = error as FirebaseError;
                  const msg = firebaseError.message;
                  const code = firebaseError.code;
                  console.error("[firestore] Error creating profile:", code, msg);
                  
                  if (code === 'permission-denied') {
                    console.error('[firestore] Firebase permission denied. Check your Firestore security rules.');
                    
                    // Even though we couldn't save to Firebase, we'll create a local profile
                    // so the app can continue to function
                    const localProfile = createMinimalProfile(fbUser.displayName || 'User');
                    const appProfile = firebaseToAppProfile(localProfile, fbUser.uid);
                    
                    set({ 
                      firebaseProfile: localProfile,
                      profile: appProfile,
                      isLoadingProfile: false,
                      hasFirebasePermissionsError: true
                    });
                    
                    // Also update the user store
                    useUserStore.getState().setProfile(appProfile);
                  } else {
                    set({ 
                      isLoadingProfile: false,
                      hasFirebasePermissionsError: false
                    });
                  }
                }
              } else {
                console.log("Profile found");
                const firebaseProfile = profileDoc.data() as FirebaseUserProfile;
                const appProfile = firebaseToAppProfile(firebaseProfile, fbUser.uid);
                
                set({ 
                  firebaseProfile,
                  profile: appProfile,
                  isLoadingProfile: false,
                  hasFirebasePermissionsError: false
                });
                
                // Also update the user store
                useUserStore.getState().setProfile(appProfile);
                
                // Check if onboarding is completed
                if (firebaseProfile.onboardingCompleted) {
                  useUserStore.getState().completeOnboarding();
                }
              }
            } catch (error: unknown) {
              const firebaseError = error as FirebaseError;
              const msg = firebaseError.message;
              const code = firebaseError.code;
              console.error("[firestore] Error fetching/creating profile:", code, msg);
              
              if (code === 'permission-denied') {
                console.error('[firestore] Firebase permission denied. Check your Firestore security rules.');
                
                // Create a local profile so the app can continue to function
                const localProfile = createMinimalProfile(fbUser.displayName || 'User');
                const appProfile = firebaseToAppProfile(localProfile, fbUser.uid);
                
                set({ 
                  firebaseProfile: localProfile,
                  profile: appProfile,
                  isLoadingProfile: false,
                  hasFirebasePermissionsError: true
                });
                
                // Also update the user store
                useUserStore.getState().setProfile(appProfile);
              } else {
                set({ 
                  isLoadingProfile: false,
                  hasFirebasePermissionsError: false
                });
              }
            }
          } catch (error: unknown) {
            const firebaseError = error as FirebaseError;
            const msg = firebaseError.message;
            const code = firebaseError.code;
            console.error('[firestore] Error in auth state change handler:', code, msg);
            
            // Create a local profile so the app can continue to function
            const localProfile = createMinimalProfile(fbUser.displayName || 'User');
            const appProfile = firebaseToAppProfile(localProfile, fbUser.uid);
            
            set({ 
              firebaseProfile: localProfile,
              profile: appProfile,
              isLoadingProfile: false,
              hasFirebasePermissionsError: code === 'permission-denied'
            });
            
            // Also update the user store
            useUserStore.getState().setProfile(appProfile);
          }
        });
        
        return unsubscribe;
      },
      
      // Profile actions
      fetchProfile: async () => {
        const { user } = get();
        if (!user) {
          console.log("Cannot fetch profile: No user");
          return;
        }
        
        set({ isLoadingProfile: true });
        
        try {
          console.log("Fetching profile for user:", user.uid);
          const userRef = doc(db, 'users', user.uid);
          
          // First, check if the document exists and create it if it doesn't
          try {
            const profileDoc = await getDoc(userRef);
            
            if (!profileDoc.exists()) {
              console.log("No profile found, creating minimal profile");
              const minimalProfile = createMinimalProfile(auth.currentUser?.displayName || 'User');
              
              try {
                await setDoc(userRef, {
                  ...minimalProfile,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                });
                
                console.log("Created minimal profile at", userRef.path);
                
                // Fetch the newly created profile
                const newProfileDoc = await getDoc(userRef);
                if (newProfileDoc.exists()) {
                  const firebaseProfile = newProfileDoc.data() as FirebaseUserProfile;
                  const appProfile = firebaseToAppProfile(firebaseProfile, user.uid);
                  
                  set({ 
                    firebaseProfile,
                    profile: appProfile,
                    isLoadingProfile: false,
                    hasFirebasePermissionsError: false
                  });
                  
                  // Also update the user store
                  useUserStore.getState().setProfile(appProfile);
                }
              } catch (error: unknown) {
                const firebaseError = error as FirebaseError;
                const msg = firebaseError.message;
                const code = firebaseError.code;
                console.error("[firestore] Error creating profile:", code, msg);
                
                if (code === 'permission-denied') {
                  console.error('[firestore] Firebase permission denied. Check your Firestore security rules.');
                  
                  // Even though we couldn't save to Firebase, we'll create a local profile
                  // so the app can continue to function
                  const localProfile = createMinimalProfile(auth.currentUser?.displayName || 'User');
                  const appProfile = firebaseToAppProfile(localProfile, user.uid);
                  
                  set({ 
                    firebaseProfile: localProfile,
                    profile: appProfile,
                    isLoadingProfile: false,
                    hasFirebasePermissionsError: true
                  });
                  
                  // Also update the user store
                  useUserStore.getState().setProfile(appProfile);
                } else {
                  set({ 
                    isLoadingProfile: false,
                    hasFirebasePermissionsError: false
                  });
                }
              }
            } else {
              console.log("Profile found");
              const firebaseProfile = profileDoc.data() as FirebaseUserProfile;
              const appProfile = firebaseToAppProfile(firebaseProfile, user.uid);
              
              set({ 
                firebaseProfile,
                profile: appProfile,
                isLoadingProfile: false,
                hasFirebasePermissionsError: false
              });
              
              // Also update the user store
              useUserStore.getState().setProfile(appProfile);
              
              // Check if onboarding is completed
              if (firebaseProfile.onboardingCompleted) {
                useUserStore.getState().completeOnboarding();
              }
            }
          } catch (error: unknown) {
            const firebaseError = error as FirebaseError;
            const msg = firebaseError.message;
            const code = firebaseError.code;
            console.error("[firestore] Error fetching/creating profile:", code, msg);
            
            if (code === 'permission-denied') {
              console.error('[firestore] Firebase permission denied. Check your Firestore security rules.');
              
              // Create a local profile so the app can continue to function
              const localProfile = createMinimalProfile(auth.currentUser?.displayName || 'User');
              const appProfile = firebaseToAppProfile(localProfile, user.uid);
              
              set({ 
                firebaseProfile: localProfile,
                profile: appProfile,
                isLoadingProfile: false,
                hasFirebasePermissionsError: true
              });
              
              // Also update the user store
              useUserStore.getState().setProfile(appProfile);
            } else {
              set({ 
                isLoadingProfile: false,
                hasFirebasePermissionsError: false
              });
            }
          }
        } catch (error: unknown) {
          const firebaseError = error as FirebaseError;
          const msg = firebaseError.message;
          const code = firebaseError.code;
          console.error('[firestore] Error in fetchProfile:', code, msg);
          
          // Create a local profile so the app can continue to function
          const localProfile = createMinimalProfile(auth.currentUser?.displayName || 'User');
          const appProfile = firebaseToAppProfile(localProfile, user.uid);
          
          set({ 
            firebaseProfile: localProfile,
            profile: appProfile,
            isLoadingProfile: false,
            hasFirebasePermissionsError: code === 'permission-denied'
          });
          
          // Also update the user store
          useUserStore.getState().setProfile(appProfile);
        }
      },
      
      updateProfile: async (updates: Partial<FirebaseUserProfile>) => {
        const { user, firebaseProfile } = get();
        if (!user) return;
        
        try {
          const userRef = doc(db, 'users', user.uid);
          
          // If no profile exists yet, create one with the updates
          if (!firebaseProfile) {
            const newProfile = {
              displayName: updates.displayName || '',
              gender: updates.gender || 'other',
              heightCm: updates.heightCm || 170,
              weightKg: updates.weightKg || 70,
              goal: updates.goal || 'maintain',
              theme: updates.theme || 'light',
              tdee: updates.tdee || 2000,
              targets: updates.targets || {
                calories: 2000,
                protein: 150,
                carb: 200,
                fat: 65
              },
              onboardingCompleted: updates.onboardingCompleted || false,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            } as FirebaseUserProfile;
            
            try {
              await setDoc(userRef, {
                ...newProfile,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
              
              console.log("Created profile at", userRef.path);
              
              // Update local state
              set({ 
                firebaseProfile: newProfile,
                profile: firebaseToAppProfile(newProfile, user.uid),
                hasFirebasePermissionsError: false
              });
            } catch (error: unknown) {
              const firebaseError = error as FirebaseError;
              const msg = firebaseError.message;
              const code = firebaseError.code;
              console.error('[firestore] Error creating profile:', code, msg);
              
              if (code === 'permission-denied') {
                console.error('[firestore] Firebase permission denied when creating profile. Check your Firestore security rules.');
                set({ hasFirebasePermissionsError: true });
                
                // Even though we couldn't save to Firebase, we'll update the local state
                // so the app can continue to function
                const localProfile = {
                  ...newProfile,
                  // Add any fields from updates
                  ...updates
                };
                
                set({ 
                  firebaseProfile: localProfile,
                  profile: firebaseToAppProfile(localProfile, user.uid)
                });
                
                // Also update the user store
                useUserStore.getState().setProfile(firebaseToAppProfile(localProfile, user.uid));
                
                // If onboarding is completed, update that too
                if (updates.onboardingCompleted) {
                  useUserStore.getState().completeOnboarding();
                }
                
                // Show a warning but don't throw - let the app continue
                console.warn('Profile saved locally but not to Firebase due to permissions');
              } else {
                throw error;
              }
            }
            
            return;
          }
          
          // Otherwise, update existing profile
          try {
            await updateDoc(userRef, {
              ...updates,
              updatedAt: serverTimestamp()
            });
            
            console.log("Updated profile at", userRef.path);
            
            // Update local state
            const updatedFirebaseProfile = {
              ...firebaseProfile,
              ...updates,
              updatedAt: serverTimestamp()
            };
            
            set({ 
              firebaseProfile: updatedFirebaseProfile,
              profile: firebaseToAppProfile(updatedFirebaseProfile, user.uid),
              hasFirebasePermissionsError: false
            });
            
            // Also update the user store
            useUserStore.getState().setProfile(firebaseToAppProfile(updatedFirebaseProfile, user.uid));
            
            // If onboarding is completed, update that too
            if (updates.onboardingCompleted) {
              useUserStore.getState().completeOnboarding();
            }
          } catch (error: unknown) {
            const firebaseError = error as FirebaseError;
            const msg = firebaseError.message;
            const code = firebaseError.code;
            console.error('[firestore] Error updating profile:', code, msg);
            
            if (code === 'permission-denied') {
              console.error('[firestore] Firebase permission denied when updating profile. Check your Firestore security rules.');
              set({ hasFirebasePermissionsError: true });
              
              // Even though we couldn't save to Firebase, we'll update the local state
              // so the app can continue to function
              const updatedFirebaseProfile = {
                ...firebaseProfile,
                ...updates,
                updatedAt: serverTimestamp()
              };
              
              set({ 
                firebaseProfile: updatedFirebaseProfile,
                profile: firebaseToAppProfile(updatedFirebaseProfile, user.uid)
              });
              
              // Also update the user store
              useUserStore.getState().setProfile(firebaseToAppProfile(updatedFirebaseProfile, user.uid));
              
              // If onboarding is completed, update that too
              if (updates.onboardingCompleted) {
                useUserStore.getState().completeOnboarding();
              }
              
              // Show a warning but don't throw - let the app continue
              console.warn('Profile updated locally but not in Firebase due to permissions');
            } else {
              throw error;
            }
          }
        } catch (error: unknown) {
          const firebaseError = error as FirebaseError;
          const msg = firebaseError.message;
          const code = firebaseError.code;
          console.error('[firestore] Error in updateProfile:', code, msg);
          
          // If this is not a permissions error that we've already handled, rethrow
          if (code !== 'permission-denied') {
            throw error;
          }
        }
      },
      
      // Days actions
      fetchDays: async (startDate: string, endDate: string) => {
        const { user } = get();
        if (!user) return;
        
        set({ isLoadingDays: true });
        
        try {
          // In a real implementation, you'd use a query with date range
          // For now, we'll just get all days for the user
          // Use our helper function to handle nested collections properly
          const daysSnapshot = await getDocsFromCollection('users', user.uid, 'days');
          
          const days: Record<string, DaySummary> = {};
          
          daysSnapshot.forEach((doc: any) => {
            const dayData = doc.data() as DaySummary;
            days[doc.id] = dayData;
          });
          
          set({ days, isLoadingDays: false });
        } catch (error: unknown) {
          const firebaseError = error as FirebaseError;
          const msg = firebaseError.message;
          const code = firebaseError.code;
          console.error('[firestore] Error fetching days:', code, msg);
          set({ isLoadingDays: false });
          
          // If this is a permissions error, handle it gracefully
          if (code === 'permission-denied') {
            console.error('[firestore] Firebase permission denied when fetching days. Check your Firestore security rules.');
            set({ hasFirebasePermissionsError: true });
          }
        }
      },
      
      // Meals actions
      fetchMealsForDay: async (date: string) => {
        const { user, mealsByDay } = get();
        if (!user) return;
        
        try {
          // Use our helper function to properly handle the nested collection path
          const mealsSnapshot = await getDocsFromCollection('users', user.uid, 'days', date, 'meals');
          
          const meals: FirebaseMeal[] = [];
          
          mealsSnapshot.forEach((doc: any) => {
            const mealData = doc.data();
            meals.push({
              ...mealData,
              id: doc.id,
              date
            });
          });
          
          set({ 
            mealsByDay: {
              ...mealsByDay,
              [date]: meals
            }
          });
        } catch (error: unknown) {
          const firebaseError = error as FirebaseError;
          const msg = firebaseError.message;
          const code = firebaseError.code;
          console.error('[firestore] Error fetching meals for day:', code, msg);
          
          // If this is a permissions error, handle it gracefully
          if (code === 'permission-denied') {
            console.error('[firestore] Firebase permission denied when fetching meals. Check your Firestore security rules.');
            set({ hasFirebasePermissionsError: true });
          }
        }
      },
      
      addMeal: async (mealData: Omit<FirebaseMeal, 'id' | 'createdAt' | 'updatedAt'>) => {
        const { user, mealsByDay } = get();
        if (!user) throw new Error('User not authenticated');
        
        const { date } = mealData;
        
        try {
          // First, ensure the day document exists
          const dayRef = doc(db, 'users', user.uid, 'days', date);
          const dayDoc = await getDoc(dayRef);
          
          if (!dayDoc.exists()) {
            // Create the day document if it doesn't exist
            try {
              await setDoc(dayRef, {
                date,
                totals: { calories: 0, protein: 0, carb: 0, fat: 0 },
                goalAchieved: false,
                mealCount: 0,
                updatedAt: serverTimestamp()
              });
              console.log("Created day document at", dayRef.path);
            } catch (error: unknown) {
              const firebaseError = error as FirebaseError;
              const msg = firebaseError.message;
              const code = firebaseError.code;
              console.error('[firestore] Error creating day document:', code, msg);
              
              if (code === 'permission-denied') {
                console.error('[firestore] Firebase permission denied when creating day. Check your Firestore security rules.');
                set({ hasFirebasePermissionsError: true });
                // Continue with local updates only
              } else {
                throw error;
              }
            }
          }
          
          // Add the meal
          let newMealId = '';
          try {
            // Create a collection reference for the nested path using our helper
            const mealRef = createCollectionRef('users', user.uid, 'days', date, 'meals');
            // Using the updated addDoc function with correct parameters
            const newMealDoc = await addDoc(mealRef, {
              ...mealData,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            newMealId = newMealDoc.id;
            console.log("Created meal document at", newMealDoc.path);
          } catch (error: unknown) {
            const firebaseError = error as FirebaseError;
            const msg = firebaseError.message;
            const code = firebaseError.code;
            console.error('[firestore] Error adding meal document:', code, msg);
            
            if (code === 'permission-denied') {
              console.error('[firestore] Firebase permission denied when adding meal. Check your Firestore security rules.');
              set({ hasFirebasePermissionsError: true });
              // Generate a local ID for the meal
              newMealId = 'local_' + Date.now().toString();
              // Continue with local updates only
            } else {
              throw error;
            }
          }
          
          // Update the day totals (in a real app, this would be done by a Cloud Function)
          const dayData = dayDoc.exists() ? dayDoc.data() as DaySummary : {
            date,
            totals: { calories: 0, protein: 0, carb: 0, fat: 0 },
            goalAchieved: false,
            mealCount: 0,
            updatedAt: serverTimestamp()
          };
          
          const updatedTotals: Macros = {
            calories: dayData.totals.calories + mealData.finalMacros.calories,
            protein: dayData.totals.protein + mealData.finalMacros.protein,
            carb: dayData.totals.carb + mealData.finalMacros.carb,
            fat: dayData.totals.fat + mealData.finalMacros.fat
          };
          
          try {
            await updateDoc(dayRef, {
              totals: updatedTotals,
              mealCount: dayData.mealCount + 1,
              updatedAt: serverTimestamp()
            });
            console.log("Updated day totals at", dayRef.path);
          } catch (error: unknown) {
            const firebaseError = error as FirebaseError;
            const msg = firebaseError.message;
            const code = firebaseError.code;
            console.error('[firestore] Error updating day totals:', code, msg);
            
            if (code === 'permission-denied') {
              console.error('[firestore] Firebase permission denied when updating day totals. Check your Firestore security rules.');
              set({ hasFirebasePermissionsError: true });
              // Continue with local updates only
            } else {
              throw error;
            }
          }
          
          // Update local state
          const newMeal: FirebaseMeal = {
            ...mealData,
            id: newMealId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          const existingMeals = mealsByDay[date] || [];
          
          set({
            mealsByDay: {
              ...mealsByDay,
              [date]: [...existingMeals, newMeal]
            },
            days: {
              ...get().days,
              [date]: {
                ...dayData,
                totals: updatedTotals,
                mealCount: dayData.mealCount + 1,
                updatedAt: serverTimestamp()
              }
            }
          });
          
          return newMealId;
        } catch (error: unknown) {
          const firebaseError = error as FirebaseError;
          const msg = firebaseError.message;
          const code = firebaseError.code;
          console.error('[firestore] Error adding meal:', code, msg);
          throw error;
        }
      },
      
      updateMeal: async (mealId: string, updates: Partial<FirebaseMeal>) => {
        const { user, mealsByDay } = get();
        if (!user) throw new Error('User not authenticated');
        
        // Find the meal in local state to get its date
        let mealDate: string | undefined;
        let existingMeal: FirebaseMeal | undefined;
        
        // Search through all days to find the meal
        for (const [date, meals] of Object.entries(mealsByDay)) {
          const meal = meals.find((m: FirebaseMeal) => m.id === mealId);
          if (meal) {
            mealDate = date;
            existingMeal = meal;
            break;
          }
        }
        
        if (!mealDate || !existingMeal) {
          throw new Error('Meal not found in local state');
        }
        
        try {
          const mealRef = doc(db, 'users', user.uid, 'days', mealDate, 'meals', mealId);
          
          try {
            await updateDoc(mealRef, {
              ...updates,
              updatedAt: serverTimestamp()
            });
            console.log("Updated meal document at", mealRef.path);
          } catch (error: unknown) {
            const firebaseError = error as FirebaseError;
            const msg = firebaseError.message;
            const code = firebaseError.code;
            console.error('[firestore] Error updating meal document:', code, msg);
            
            if (code === 'permission-denied') {
              console.error('[firestore] Firebase permission denied when updating meal. Check your Firestore security rules.');
              set({ hasFirebasePermissionsError: true });
              // Continue with local updates only
            } else {
              throw error;
            }
          }
          
          // If macros changed, update day totals
          if (updates.finalMacros && existingMeal.finalMacros) {
            const dayRef = doc(db, 'users', user.uid, 'days', mealDate);
            const dayDoc = await getDoc(dayRef);
            
            if (dayDoc.exists()) {
              const dayData = dayDoc.data() as DaySummary;
              
              // Calculate the difference in macros
              const macroDiff: Macros = {
                calories: (updates.finalMacros.calories || 0) - existingMeal.finalMacros.calories,
                protein: (updates.finalMacros.protein || 0) - existingMeal.finalMacros.protein,
                carb: (updates.finalMacros.carb || 0) - existingMeal.finalMacros.carb,
                fat: (updates.finalMacros.fat || 0) - existingMeal.finalMacros.fat
              };
              
              // Update day totals
              const updatedTotals: Macros = {
                calories: dayData.totals.calories + macroDiff.calories,
                protein: dayData.totals.protein + macroDiff.protein,
                carb: dayData.totals.carb + macroDiff.carb,
                fat: dayData.totals.fat + macroDiff.fat
              };
              
              try {
                await updateDoc(dayRef, {
                  totals: updatedTotals,
                  updatedAt: serverTimestamp()
                });
                console.log("Updated day totals at", dayRef.path);
              } catch (error: unknown) {
                const firebaseError = error as FirebaseError;
                const msg = firebaseError.message;
                const code = firebaseError.code;
                console.error('[firestore] Error updating day totals:', code, msg);
                
                if (code === 'permission-denied') {
                  console.error('[firestore] Firebase permission denied when updating day totals. Check your Firestore security rules.');
                  set({ hasFirebasePermissionsError: true });
                  // Continue with local updates only
                } else {
                  throw error;
                }
              }
              
              // Update local state for day
              set({
                days: {
                  ...get().days,
                  [mealDate]: {
                    ...dayData,
                    totals: updatedTotals,
                    updatedAt: serverTimestamp()
                  }
                }
              });
            }
          }
          
          // Update local state for meal
          const updatedMeals = [...mealsByDay[mealDate]];
          const mealIndex = updatedMeals.findIndex((m: FirebaseMeal) => m.id === mealId);
          
          if (mealIndex !== -1) {
            updatedMeals[mealIndex] = {
              ...updatedMeals[mealIndex],
              ...updates,
              updatedAt: serverTimestamp()
            };
            
            set({
              mealsByDay: {
                ...mealsByDay,
                [mealDate]: updatedMeals
              }
            });
          }
        } catch (error: unknown) {
          const firebaseError = error as FirebaseError;
          const msg = firebaseError.message;
          const code = firebaseError.code;
          console.error('[firestore] Error updating meal:', code, msg);
          throw error;
        }
      },
      
      uploadMealPhoto: async (uri: string) => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');
        
        try {
          // Create a reference to the file in Firebase Storage
          const date = new Date().toISOString();
          const storageRef = ref(storage, `users/${user.uid}/meals/${date}.jpg`);
          
          // Fetch the image data
          const response = await fetch(uri);
          const blob = await response.blob();
          
          // Upload the file
          try {
            await uploadBytes(storageRef, blob);
            console.log("Uploaded photo to", storageRef.fullPath);
            
            // Get the download URL
            const downloadURL = await getDownloadURL(storageRef);
            
            return downloadURL;
          } catch (error: unknown) {
            const firebaseError = error as FirebaseError;
            const msg = firebaseError.message;
            const code = firebaseError.code;
            console.error('[firestore] Error uploading to Firebase Storage:', code, msg);
            
            if (code === 'storage/unauthorized') {
              console.error('[firestore] Firebase Storage permission denied. Check your Storage security rules.');
              set({ hasFirebasePermissionsError: true });
              // Return the local URI as fallback
              return uri;
            } else {
              throw error;
            }
          }
        } catch (error: unknown) {
          const firebaseError = error as FirebaseError;
          const msg = firebaseError.message;
          const code = firebaseError.code;
          console.error('[firestore] Error uploading photo:', code, msg);
          throw error;
        }
      },
      
      // Cleanup
      cleanup: () => {
        console.log("Cleaning up Firebase store");
        set(initialState);
      }
    }),
    {
      name: 'firebase-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state: FirebaseState) => ({
        // Only persist these fields
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);