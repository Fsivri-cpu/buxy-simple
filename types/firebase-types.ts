import { Timestamp } from 'firebase/firestore';

// User profile types
export interface UserProfile {
  id: string;
  displayName: string;
  gender: 'male' | 'female' | 'other';
  heightCm: number;
  weightKg: number;
  goal: 'lose' | 'maintain' | 'gain';
  dailyCalorieGoal: number;
  dailyProteinGoal: number;
  dailyCarbsGoal: number;
  dailyFatGoal: number;
}

export interface FirebaseUserProfile {
  displayName: string;
  gender: 'male' | 'female' | 'other';
  heightCm: number;
  weightKg: number;
  goal: 'lose' | 'maintain' | 'gain';
  theme: 'light' | 'dark';
  tdee: number;
  targets: {
    calories: number;
    protein: number;
    carb: number;
    fat: number;
  };
  onboardingCompleted: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Meal types
export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FirebaseMeal {
  id: string;
  userId: string;
  name: string;
  description?: string;
  date: string; // ISO date string YYYY-MM-DD
  timeOfDay: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  imageUrl?: string;
  macros: Macros;
  foodItems?: Array<{
    name: string;
    quantity: number;
    unit: string;
    macros: Macros;
  }>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DaySummary {
  date: string;
  totalMacros: Macros;
  mealCount: number;
}
