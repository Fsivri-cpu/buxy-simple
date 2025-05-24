import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { FirebaseUserProfile } from '../types/firebase-types';

/**
 * Ensures a user's profile document exists in Firestore
 * This should be called after successful authentication
 */
export async function ensureUserProfileExists(uid: string, displayName: string = 'User'): Promise<boolean> {
  try {
    // Check if profile already exists
    const userRef = doc(db, 'users', uid);
    const profileDoc = await getDoc(userRef);
    
    // If profile exists, return true
    if (profileDoc.exists()) {
      console.log('User profile already exists');
      return true;
    }
    
    // Create a minimal profile
    const minimalProfile: FirebaseUserProfile = {
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
    
    // Save to Firestore
    await setDoc(userRef, minimalProfile);
    console.log('Created new user profile');
    return true;
  } catch (error) {
    console.error('Error ensuring user profile exists:', error);
    return false;
  }
}

/**
 * Returns a promise that resolves when the user is authenticated
 * Useful for ensuring operations happen only after authentication
 */
export function waitForAuthentication(): Promise<string> {
  return new Promise((resolve, reject) => {
    // Listener timeout - reject after 10 seconds
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error('Authentication timeout'));
    }, 10000);
    
    // Set up auth listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        clearTimeout(timeout);
        unsubscribe();
        resolve(user.uid);
      }
    });
  });
}

/**
 * Use this to wrap Firestore operations that require authentication
 * @param operation Function that performs the Firestore operation
 */
export async function withAuthentication<T>(operation: (uid: string) => Promise<T>): Promise<T> {
  // Check if already authenticated
  if (auth.currentUser) {
    return operation(auth.currentUser.uid);
  }
  
  // Wait for authentication
  const uid = await waitForAuthentication();
  return operation(uid);
}
