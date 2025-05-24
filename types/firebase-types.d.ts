// Type definitions for Firebase
import { Timestamp } from 'firebase/firestore';
import { FirebaseUserProfile, DaySummary, FirebaseMeal, Macros } from './firebase-types';

// Re-export types from the main file
export { FirebaseUserProfile, DaySummary, FirebaseMeal, Macros };

// Extended types for Firebase usage
export interface FirebaseTimestamp {
  toDate(): Date;
  seconds: number;
  nanoseconds: number;
}

// Export all types from firebase-types.ts to be properly imported
export * from './firebase-types';
