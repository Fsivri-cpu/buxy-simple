import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DailyNutrients } from '@/types/meal';
import { useUserStore } from '@/store/userStore';
import MacroCircle from './MacroCircle';
import { colors } from '@/constants/colors';

interface NutritionSummaryProps {
  nutrients: DailyNutrients;
}

export default function NutritionSummary({ nutrients }: NutritionSummaryProps) {
  // Use primitive selectors to prevent infinite loops
  const profile = useUserStore((state) => state.profile);
  
  if (!profile) {
    return null;
  }
  
  const calorieGoal = profile.dailyCalorieGoal || 2000;
  const proteinGoal = profile.dailyProteinGoal || 150;
  const carbsGoal = profile.dailyCarbsGoal || 200;
  const fatGoal = profile.dailyFatGoal || 65;
  
  const caloriePercentage = Math.min((nutrients.calories / calorieGoal) * 100, 100);
  
  return (
    <View style={styles.container}>
      <View style={styles.calorieContainer}>
        <View style={styles.calorieTextContainer}>
          <Text style={styles.calorieValue}>{nutrients.calories}</Text>
          <Text style={styles.calorieLabel}>calories</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${caloriePercentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.goalText}>
            Goal: {calorieGoal}
          </Text>
        </View>
      </View>
      
      <View style={styles.macrosContainer}>
        <MacroCircle
          current={nutrients.protein}
          goal={proteinGoal}
          label="Protein"
          color={colors.highlight}
          size={80}
        />
        <MacroCircle
          current={nutrients.carbs}
          goal={carbsGoal}
          label="Carbs"
          color={colors.success}
          size={80}
        />
        <MacroCircle
          current={nutrients.fat}
          goal={fatGoal}
          label="Fat"
          color={colors.warning}
          size={80}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  calorieContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  calorieTextContainer: {
    width: 100,
  },
  calorieValue: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
  },
  calorieLabel: {
    fontSize: 14,
    color: colors.secondary,
  },
  progressBarContainer: {
    flex: 1,
    marginLeft: 16,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.card,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.highlight,
    borderRadius: 4,
  },
  goalText: {
    fontSize: 12,
    color: colors.secondary,
    marginTop: 4,
    textAlign: 'right',
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
});