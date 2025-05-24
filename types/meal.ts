export interface Nutrient {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  id: string;
  name: string;
  imageUrl?: string;
  nutrients: Nutrient;
  date: string; // ISO string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  createdAt: string; // ISO string
}

export interface DailyNutrients extends Nutrient {
  date: string;
}

export interface UserProfile {
  id: string;
  name: string;
  age?: number;
  weight?: number; // kg
  height?: number; // cm
  gender?: 'male' | 'female' | 'other';
  goal?: 'lose' | 'maintain' | 'gain';
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  dailyCalorieGoal?: number;
  dailyProteinGoal?: number;
  dailyCarbsGoal?: number;
  dailyFatGoal?: number;
}