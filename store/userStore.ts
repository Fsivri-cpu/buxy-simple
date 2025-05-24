import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserProfile } from '@/types/meal';
import { calculateCalorieGoal, calculateMacroGoals } from '@/utils/calculations';

export interface UserState {
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

const initialState = {
  profile: null,
  isOnboarded: false,
  isDarkMode: false,
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setProfile: (profile) => {
        console.log("Setting profile:", profile);
        set({ profile });
      },
      
      updateProfile: (updates) => {
        const currentProfile = get().profile;
        if (!currentProfile) return;
        
        console.log("Updating profile with:", updates);
        set({ 
          profile: { 
            ...currentProfile, 
            ...updates 
          } 
        });
      },
      
      completeOnboarding: () => {
        console.log("Completing onboarding");
        set({ isOnboarded: true });
      },
      
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      
      calculateGoals: () => {
        const profile = get().profile;
        if (!profile) return;
        
        const calorieGoal = calculateCalorieGoal(profile);
        const { protein, carbs, fat } = calculateMacroGoals({
          ...profile,
          dailyCalorieGoal: calorieGoal
        });
        
        console.log("Calculated goals:", { calorieGoal, protein, carbs, fat });
        
        set({
          profile: {
            ...profile,
            dailyCalorieGoal: calorieGoal,
            dailyProteinGoal: protein,
            dailyCarbsGoal: carbs,
            dailyFatGoal: fat,
          }
        });
      },
      
      resetState: () => {
        console.log("Resetting user store state");
        set(initialState);
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);