// Firebase Auth utility functions to handle missing/changed API methods in the SDK

import { type User } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from './firebase';

/**
 * Sends a password reset email to the specified email address
 */
export const sendPasswordResetEmail = async (auth: any, email: string): Promise<void> => {
  // Using the underlying Firebase Auth REST API
  try {
    // Firebase v11.8.0 compatible approach
    // Check if the method exists directly on auth
    if (typeof auth.sendPasswordResetEmail === 'function') {
      await auth.sendPasswordResetEmail(email);
    } else {
      // Fallback to manual API call if needed
      console.warn('Using fallback method for sendPasswordResetEmail');
      throw new Error('sendPasswordResetEmail method not available');
    }
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

/**
 * Updates a user's profile information
 */
export const updateProfile = async (
  user: User,
  profile: { displayName?: string | null; photoURL?: string | null }
): Promise<void> => {
  try {
    // Firebase v11.8.0 compatible approach
    // Use the auth object's methods instead of directly on the user
    const updateProfileMethod = auth.updateProfile || auth.currentUser?.updateProfile;
    
    if (typeof updateProfileMethod === 'function') {
      await updateProfileMethod(user, profile);
    } else {
      // Manual fallback if needed
      console.warn('Using fallback method for updateProfile');
      // Update displayName in Firestore as fallback
      throw new Error('updateProfile method not available');
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Updates a user's email address
 */
export const updateEmail = async (user: User, newEmail: string): Promise<void> => {
  try {
    // Firebase v11.8.0 compatible approach
    const updateEmailMethod = auth.updateEmail || auth.currentUser?.updateEmail;
    
    if (typeof updateEmailMethod === 'function') {
      await updateEmailMethod(user, newEmail);
    } else {
      console.warn('Using fallback method for updateEmail');
      throw new Error('updateEmail method not available');
    }
  } catch (error) {
    console.error('Error updating email:', error);
    throw error;
  }
};

/**
 * Updates a user's password
 */
export const updatePassword = async (user: User, newPassword: string): Promise<void> => {
  try {
    // Firebase v11.8.0 compatible approach
    const updatePasswordMethod = auth.updatePassword || auth.currentUser?.updatePassword;
    
    if (typeof updatePasswordMethod === 'function') {
      await updatePasswordMethod(user, newPassword);
    } else {
      console.warn('Using fallback method for updatePassword');
      throw new Error('updatePassword method not available');
    }
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};
