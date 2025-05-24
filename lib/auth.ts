// Firebase Authentication User tipini tanımlama
type AuthUser = any; // Geliştirme aşamasında tip hatalarını önlemek için

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  type User
} from 'firebase/auth';
import { 
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword
} from './authUtils';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { FirebaseUserProfile } from '../types/firebase-types';
import { UserProfile } from '../types/meal';
import { appToFirebaseProfile } from '../utils/profileConverter';
import { calculateTDEE, calculateCalorieGoal, calculateMacroGoals } from '../utils/calculations';
import { useFirebaseStore } from '../store/firebaseStore';
import { useUserStore } from '../store/userStore';

// Sign up with email and password
export const signUp = async (
  email: string, 
  password: string, 
  profileData: Omit<FirebaseUserProfile, 'createdAt' | 'updatedAt' | 'tdee' | 'targets'>
): Promise<AuthUser> => {
  try {
    console.log("Creating user with email:", email);
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log("User created:", user.uid);
    
    // Calculate TDEE and targets
    const appProfileForCalc: UserProfile = {
      id: user.uid,
      name: profileData.displayName,
      height: profileData.heightCm,
      weight: profileData.weightKg,
      gender: profileData.gender,
      goal: profileData.goal,
      activityLevel: 'moderate', // Default
    };
    
    const tdee = calculateTDEE(appProfileForCalc);
    const calorieGoal = calculateCalorieGoal(appProfileForCalc);
    
    const { protein, carbs, fat } = calculateMacroGoals({
      ...appProfileForCalc,
      dailyCalorieGoal: calorieGoal
    });
    
    console.log("Calculated goals:", { tdee, calorieGoal, protein, carbs, fat });
    
    // Create user profile in Firestore
    const userProfile: FirebaseUserProfile = {
      ...profileData,
      tdee,
      targets: {
        calories: calorieGoal,
        protein,
        carb: carbs,
        fat
      },
      onboardingCompleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    console.log("Creating user profile in Firestore");
    
    // IMPORTANT: Create the user document with the user's UID as the document ID
    try {
      // Use serverTimestamp for better consistency with Firestore rules
      await setDoc(doc(db, 'users', user.uid), {
        ...userProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log("User profile created successfully in Firestore");
    } catch (error) {
      console.error("Error creating user profile in Firestore:", error);
      
      // Try a simpler document with just the essential fields
      // This is a fallback in case the full profile creation fails
      try {
        await setDoc(doc(db, 'users', user.uid), {
          displayName: profileData.displayName,
          createdAt: serverTimestamp(),
        });
        console.log("Created minimal user profile in Firestore as fallback");
      } catch (fallbackError) {
        console.error("Even fallback profile creation failed:", fallbackError);
        // Continue anyway - we don't want to block the signup process
      }
    }
    
    // Update display name in Auth profile
    await updateProfile(user as User, {
      displayName: profileData.displayName
    });
    
    // Update the store directly - IMPORTANT: This ensures the UI updates
    useFirebaseStore.getState().setUser({
      uid: user.uid,
      email: user.email || ''
    });
    
    // Convert to app profile and set in user store
    const appProfile: UserProfile = {
      id: user.uid,
      name: profileData.displayName,
      gender: profileData.gender,
      height: profileData.heightCm,
      weight: profileData.weightKg,
      goal: profileData.goal,
      activityLevel: 'moderate',
      dailyCalorieGoal: calorieGoal,
      dailyProteinGoal: protein,
      dailyCarbsGoal: carbs,
      dailyFatGoal: fat
    };
    
    useUserStore.getState().setProfile(appProfile);
    
    return user;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// Sign out
export const logOut = async () => {
  try {
    console.log("Signing out");
    await signOut(auth);
    
    // Clear store state on logout
    useFirebaseStore.getState().cleanup();
    useUserStore.getState().resetState();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Send password reset email
export const resetPassword = async (email: string) => {
  try {
    // Pass only email to match the expected signature
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// Update user email
export const updateUserEmail = async (newEmail: string) => {
  try {
    const user = auth.currentUser;
    if (user) {
      await updateEmail(user as User, newEmail);
    } else {
      throw new Error('No authenticated user');
    }
  } catch (error) {
    console.error('Error updating email:', error);
    throw error;
  }
};

// Update user password
export const updateUserPassword = async (newPassword: string) => {
  try {
    const user = auth.currentUser;
    if (user) {
      await updatePassword(user as User, newPassword);
    } else {
      throw new Error('No authenticated user');
    }
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};