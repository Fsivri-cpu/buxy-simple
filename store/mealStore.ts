import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Meal, DailyNutrients, Nutrient } from '@/types/meal';

export interface MealState {
  meals: Meal[];
  addMeal: (meal: Meal) => void;
  updateMeal: (id: string, updates: Partial<Meal>) => void;
  deleteMeal: (id: string) => void;
  getMealsByDate: (date: string) => Meal[];
  getDailyNutrients: (date: string) => DailyNutrients;
  clearAllMeals: () => void;
}

export const useMealStore = create<MealState>()(
  persist(
    (set, get) => ({
      meals: [],
      
      addMeal: (meal) => set((state) => ({ 
        meals: [...state.meals, meal] 
      })),
      
      updateMeal: (id, updates) => set((state) => ({
        meals: state.meals.map((meal) => 
          meal.id === id ? { ...meal, ...updates } : meal
        )
      })),
      
      deleteMeal: (id) => set((state) => ({
        meals: state.meals.filter((meal) => meal.id !== id)
      })),
      
      getMealsByDate: (date) => {
        return get().meals.filter((meal) => {
          // Compare only the date part (YYYY-MM-DD)
          return meal.date.split('T')[0] === date.split('T')[0];
        });
      },
      
      getDailyNutrients: (date) => {
        const mealsForDate = get().getMealsByDate(date);
        
        const dailyNutrients = mealsForDate.reduce(
          (acc, meal) => {
            return {
              calories: acc.calories + meal.nutrients.calories,
              protein: acc.protein + meal.nutrients.protein,
              carbs: acc.carbs + meal.nutrients.carbs,
              fat: acc.fat + meal.nutrients.fat,
              date,
            };
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0, date }
        );
        
        return dailyNutrients;
      },
      
      clearAllMeals: () => set({ meals: [] }),
    }),
    {
      name: 'meals-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);