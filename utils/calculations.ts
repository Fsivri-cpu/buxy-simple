import { UserProfile } from '@/types/meal';

// Calculate BMR using Mifflin-St Jeor Equation
export function calculateBMR(profile: UserProfile): number {
  if (!profile.weight || !profile.height || !profile.age || !profile.gender) {
    return 0;
  }

  if (profile.gender === 'male') {
    return 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
  } else {
    return 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
  }
}

// Calculate TDEE (Total Daily Energy Expenditure)
export function calculateTDEE(profile: UserProfile): number {
  const bmr = calculateBMR(profile);
  
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  
  const multiplier = profile.activityLevel 
    ? activityMultipliers[profile.activityLevel] 
    : 1.2;
  
  return bmr * multiplier;
}

// Calculate daily calorie goal based on user's goal
export function calculateCalorieGoal(profile: UserProfile): number {
  const tdee = calculateTDEE(profile);
  
  switch (profile.goal) {
    case 'lose':
      return tdee - 500; // 500 calorie deficit for weight loss
    case 'gain':
      return tdee + 500; // 500 calorie surplus for weight gain
    case 'maintain':
    default:
      return tdee;
  }
}

// Calculate macro goals based on calorie goal
export function calculateMacroGoals(profile: UserProfile) {
  const calorieGoal = profile.dailyCalorieGoal || calculateCalorieGoal(profile);
  
  // Default macro split (40% carbs, 30% protein, 30% fat)
  const proteinPercentage = 0.3;
  const carbsPercentage = 0.4;
  const fatPercentage = 0.3;
  
  const proteinCalories = calorieGoal * proteinPercentage;
  const carbsCalories = calorieGoal * carbsPercentage;
  const fatCalories = calorieGoal * fatPercentage;
  
  // Convert to grams (4 cal/g for protein and carbs, 9 cal/g for fat)
  const proteinGrams = Math.round(proteinCalories / 4);
  const carbsGrams = Math.round(carbsCalories / 4);
  const fatGrams = Math.round(fatCalories / 9);
  
  return {
    protein: proteinGrams,
    carbs: carbsGrams,
    fat: fatGrams,
  };
}