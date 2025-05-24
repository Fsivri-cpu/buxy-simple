import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMealStore } from '@/store/mealStore';
import { useUserStore } from '@/store/userStore';
import MealCard from '@/components/MealCard';
import EmptyState from '@/components/EmptyState';
import { colors } from '@/constants/colors';
import { Calendar as CalendarIcon } from 'lucide-react-native';

// Mock calendar component - in a real app, you'd use a library like react-native-calendars
function CalendarView({ onSelectDate, selectedDate }: { onSelectDate: (date: string) => void, selectedDate: string }) {
  const today = new Date().toISOString().split('T')[0];
  const dates = [];
  
  // Generate dates for the current month
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    const dateString = date.toISOString().split('T')[0];
    dates.push(dateString);
  }
  
  return (
    <View style={styles.calendarContainer}>
      <Text style={styles.calendarTitle}>
        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysContainer}>
        {dates.map((date) => {
          const day = new Date(date).getDate();
          const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
          const isSelected = date === selectedDate;
          const isToday = date === today;
          
          return (
            <View 
              key={date}
              style={[
                styles.dayItem,
                isSelected && styles.selectedDay,
                isToday && styles.today,
              ]}
              onTouchEnd={() => onSelectDate(date)}
            >
              <Text style={[styles.dayName, isSelected && styles.selectedText]}>{dayName}</Text>
              <Text style={[styles.dayNumber, isSelected && styles.selectedText]}>{day}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const { getMealsByDate, getDailyNutrients, deleteMeal } = useMealStore();
  const profile = useUserStore((state) => state.profile);
  
  const selectedDateMeals = getMealsByDate(selectedDate);
  const dailyNutrients = getDailyNutrients(selectedDate);
  
  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
  };
  
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
      <CalendarView onSelectDate={handleSelectDate} selectedDate={selectedDate} />
      
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Daily Summary</Text>
        <View style={styles.nutrientSummary}>
          <View style={styles.nutrientItem}>
            <Text style={styles.nutrientValue}>{dailyNutrients.calories}</Text>
            <Text style={styles.nutrientLabel}>Calories</Text>
          </View>
          <View style={styles.nutrientItem}>
            <Text style={styles.nutrientValue}>{dailyNutrients.protein}g</Text>
            <Text style={styles.nutrientLabel}>Protein</Text>
          </View>
          <View style={styles.nutrientItem}>
            <Text style={styles.nutrientValue}>{dailyNutrients.carbs}g</Text>
            <Text style={styles.nutrientLabel}>Carbs</Text>
          </View>
          <View style={styles.nutrientItem}>
            <Text style={styles.nutrientValue}>{dailyNutrients.fat}g</Text>
            <Text style={styles.nutrientLabel}>Fat</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.mealsContainer}>
        <Text style={styles.mealsTitle}>Meals</Text>
        
        <ScrollView contentContainerStyle={styles.mealsList}>
          {selectedDateMeals.length === 0 ? (
            <EmptyState
              title="No Meals"
              message={`You haven't added any meals for ${new Date(selectedDate).toLocaleDateString()}.`}
              icon={<CalendarIcon size={48} color={colors.secondary} />}
            />
          ) : (
            selectedDateMeals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                onDelete={() => handleDeleteMeal(meal.id)}
              />
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  calendarContainer: {
    backgroundColor: colors.background,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  daysContainer: {
    paddingHorizontal: 12,
  },
  dayItem: {
    width: 60,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    borderRadius: 12,
    backgroundColor: colors.card,
  },
  selectedDay: {
    backgroundColor: colors.primary,
  },
  today: {
    borderWidth: 2,
    borderColor: colors.highlight,
  },
  dayName: {
    fontSize: 14,
    color: colors.secondary,
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  selectedText: {
    color: colors.background,
  },
  summaryContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  nutrientSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutrientItem: {
    alignItems: 'center',
  },
  nutrientValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  nutrientLabel: {
    fontSize: 14,
    color: colors.secondary,
    marginTop: 4,
  },
  mealsContainer: {
    flex: 1,
    padding: 20,
    paddingBottom: 0,
  },
  mealsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  mealsList: {
    paddingBottom: 20,
  },
});