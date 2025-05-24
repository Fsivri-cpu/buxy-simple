import { UserProfile } from '@/types/meal';
import { FirebaseUserProfile } from '@/types/firebase';

// Convert Firebase profile to app profile
export function firebaseToAppProfile(firebaseProfile: FirebaseUserProfile, uid: string): UserProfile {
  return {
    id: uid,
    name: firebaseProfile.displayName,
    age: firebaseProfile.birthday ? calculateAge(firebaseProfile.birthday) : undefined,
    weight: firebaseProfile.weightKg,
    height: firebaseProfile.heightCm,
    gender: firebaseProfile.gender,
    goal: firebaseProfile.goal,
    activityLevel: mapActivityLevel(firebaseProfile.tdee, firebaseProfile.weightKg),
    dailyCalorieGoal: firebaseProfile.targets.calories,
    dailyProteinGoal: firebaseProfile.targets.protein,
    dailyCarbsGoal: firebaseProfile.targets.carb,
    dailyFatGoal: firebaseProfile.targets.fat,
  };
}

// Convert app profile to Firebase profile
export function appToFirebaseProfile(appProfile: UserProfile): Omit<FirebaseUserProfile, 'createdAt' | 'updatedAt'> {
  return {
    displayName: appProfile.name,
    gender: appProfile.gender || 'other',
    birthday: appProfile.age ? calculateBirthYear(appProfile.age) : undefined,
    heightCm: appProfile.height || 170,
    weightKg: appProfile.weight || 70,
    goal: appProfile.goal || 'maintain',
    theme: 'light',
    tdee: appProfile.dailyCalorieGoal ? appProfile.dailyCalorieGoal + 500 : 2000, // Rough estimate
    targets: {
      calories: appProfile.dailyCalorieGoal || 2000,
      protein: appProfile.dailyProteinGoal || 150,
      carb: appProfile.dailyCarbsGoal || 200,
      fat: appProfile.dailyFatGoal || 65,
    }
  };
}

// Helper functions
function calculateAge(birthday: string): number {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function calculateBirthYear(age: number): string {
  const today = new Date();
  const birthYear = today.getFullYear() - age;
  return `${birthYear}-01-01`; // Default to January 1st
}

function mapActivityLevel(tdee: number, weight: number): 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' {
  // Rough estimate based on TDEE to weight ratio
  const ratio = tdee / weight;
  
  if (ratio < 24) return 'sedentary';
  if (ratio < 28) return 'light';
  if (ratio < 32) return 'moderate';
  if (ratio < 36) return 'active';
  return 'very_active';
}