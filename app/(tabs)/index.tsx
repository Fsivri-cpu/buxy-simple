import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMealStore } from '@/store/mealStore';
import { useUserStore } from '@/store/userStore';
import NutritionSummary from '@/components/NutritionSummary';
import MealCard from '@/components/MealCard';
import EmptyState from '@/components/EmptyState';
import { colors } from '@/constants/colors';
import { UtensilsCrossed } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import { Meal } from '@/types/meal';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [today] = useState(new Date().toISOString().split('T')[0]);
  
  // Use primitive selectors to prevent infinite loops
  const profile = useUserStore((state) => state.profile);
  
  // Use individual function selectors
  const getMealsByDate = useMealStore((state) => state.getMealsByDate);
  const getDailyNutrients = useMealStore((state) => state.getDailyNutrients);
  const deleteMeal = useMealStore((state) => state.deleteMeal);
  
  const todayMeals = getMealsByDate(today);
  const dailyNutrients = getDailyNutrients(today);
  
  // Example tRPC query - not used in the UI yet, just demonstrating it works
  const hiQuery = trpc.example.hi.useQuery({ name: profile?.name || "User" });
  
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate a refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);
  
  const handleDeleteMeal = (id: string) => {
    deleteMeal(id);
  };
  
  if (!profile) {
    return (
      <EmptyState
        title="Profile Not Found"
        message="Please complete the onboarding process to set up your profile."
      />
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {profile.name}</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        
        <NutritionSummary nutrients={dailyNutrients} />
        
        <View style={styles.mealsSection}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          
          {todayMeals.length === 0 ? (
            <EmptyState
              title="No Meals Yet"
              message="Add your first meal by tapping the + button below."
              icon={<UtensilsCrossed size={48} color={colors.secondary} />}
            />
          ) : (
            todayMeals.map((meal: Meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                onDelete={() => handleDeleteMeal(meal.id)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  header: {
    padding: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  date: {
    fontSize: 16,
    color: colors.secondary,
    marginTop: 4,
  },
  mealsSection: {
    marginTop: 24,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: 20,
    marginBottom: 12,
  },
});