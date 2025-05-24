import { Timestamp, FieldValue } from 'firebase/firestore';

// User profile
export interface FirebaseUserProfile {
  displayName: string;
  gender: 'male' | 'female' | 'other';
  birthday?: string;
  heightCm: number;
  weightKg: number;
  goal: 'lose' | 'maintain' | 'gain';
  theme: 'light' | 'dark' | 'system';
  tdee: number;
  targets: {
    calories: number;
    protein: number;
    carb: number;
    fat: number;
  };
  onboardingCompleted?: boolean;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

// Macros interface for reuse
export interface Macros {
  calories: number;
  protein: number;
  carb: number;
  fat: number;
}

// Day summary
export interface DaySummary {
  date: string;
  totals: Macros;
  goalAchieved: boolean;
  mealCount: number;
  updatedAt: Timestamp;
}

// Meal
export interface FirestoreMeal {
  title: string;
  photoUrl?: string;
  aiAnalysis?: {
    foodNames: string[];
    calories: number;
    macros: Macros;
    confidence: number;
  };
  finalMacros: Macros;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  source: 'photo' | 'manual';
}

// With ID for client use
export interface FirebaseMeal extends FirestoreMeal {
  id: string;
  date: string; // YYYY-MM-DD format
}