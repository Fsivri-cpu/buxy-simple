import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Meal } from '@/types/meal';
import { colors } from '@/constants/colors';
import { Trash2 } from 'lucide-react-native';

interface MealCardProps {
  meal: Meal;
  onPress?: () => void;
  onDelete?: () => void;
}

export default function MealCard({ meal, onPress, onDelete }: MealCardProps) {
  const mealTypeLabels = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack',
  };
  
  return (
    <Pressable 
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.content}>
        {meal.imageUrl ? (
          <Image source={{ uri: meal.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}
        
        <View style={styles.details}>
          <Text style={styles.name}>{meal.name}</Text>
          <Text style={styles.mealType}>{mealTypeLabels[meal.mealType]}</Text>
          
          <View style={styles.nutrients}>
            <Text style={styles.calories}>{meal.nutrients.calories} cal</Text>
            <View style={styles.macros}>
              <Text style={styles.macro}>P: {meal.nutrients.protein}g</Text>
              <Text style={styles.macro}>C: {meal.nutrients.carbs}g</Text>
              <Text style={styles.macro}>F: {meal.nutrients.fat}g</Text>
            </View>
          </View>
        </View>
        
        {onDelete && (
          <Pressable 
            style={styles.deleteButton}
            onPress={onDelete}
            hitSlop={10}
          >
            <Trash2 size={20} color={colors.error} />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  content: {
    flexDirection: 'row',
    padding: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  details: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  mealType: {
    fontSize: 14,
    color: colors.secondary,
    marginTop: 2,
  },
  nutrients: {
    marginTop: 8,
  },
  calories: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  macros: {
    flexDirection: 'row',
    marginTop: 4,
  },
  macro: {
    fontSize: 12,
    color: colors.secondary,
    marginRight: 8,
  },
  deleteButton: {
    justifyContent: 'center',
    padding: 4,
  },
});