/// <reference types="react" />
/// <reference types="react-native" />
/// <reference types="firebase" />

// Type declarations for modules without types
// We're referencing the actual type packages above rather than redeclaring them

// These modules need declarations because they don't have their own @types packages
declare module 'expo-router';
declare module '@react-native-async-storage/async-storage';
declare module 'zustand';
declare module 'zustand/middleware';
declare module '@tanstack/react-query';
declare module 'expo-status-bar';

// Explicitly reference for JSX support
declare module 'react/jsx-runtime';

// Firebase related type declarations
declare module 'firebase/firestore';
declare module 'firebase/app';
declare module 'firebase/storage';
declare module 'firebase/auth';

// Declare a minimal FirebaseError type to use across the app
declare interface FirebaseError {
  code: string;
  message: string;
}

// Add FirestoreError type
declare interface FirestoreError extends FirebaseError {}

// User store types
declare interface UserState {
  profile: UserProfile | null;
  isOnboarded: boolean;
  isDarkMode: boolean;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  toggleDarkMode: () => void;
  calculateGoals: () => void;
  resetState: () => void;
}

// Firebase store types
declare interface FirebaseState {
  user: { uid: string; email: string } | null;
  isAuthenticated: boolean;
  firebaseProfile: FirebaseUserProfile | null;
  profile: UserProfile | null;
  days: Record<string, DaySummary>;
  mealsByDay: Record<string, FirebaseMeal[]>;
  isLoadingProfile: boolean;
  isLoadingDays: boolean;
  hasFirebasePermissionsError: boolean;
  setUser: (user: { uid: string; email: string } | null) => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<FirebaseUserProfile>) => Promise<void>;
  fetchDays: (startDate: string, endDate: string) => Promise<void>;
  fetchMealsForDay: (date: string) => Promise<void>;
  addMeal: (meal: Omit<FirebaseMeal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateMeal: (mealId: string, updates: Partial<FirebaseMeal>) => Promise<void>;
  uploadMealPhoto: (uri: string) => Promise<string>;
  initializeAuthListener: () => (() => void) | undefined;
  cleanup: () => void;
}
