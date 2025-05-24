import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

interface MacroCircleProps {
  current: number;
  goal: number;
  label: string;
  color: string;
  size?: number;
}

export default function MacroCircle({
  current,
  goal,
  label,
  color,
  size = 100,
}: MacroCircleProps) {
  const percentage = Math.min(current / goal, 1) * 100;
  const strokeWidth = size * 0.1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={styles.svgContainer}>
        {/* Background Circle */}
        <View
          style={[
            styles.circle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: colors.card,
            },
          ]}
        />
        
        {/* Progress Circle */}
        <View
          style={[
            styles.progressCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: color,
              borderTopColor: 'transparent',
              borderRightColor: percentage > 25 ? color : 'transparent',
              borderBottomColor: percentage > 50 ? color : 'transparent',
              borderLeftColor: percentage > 75 ? color : 'transparent',
              transform: [{ rotate: `${percentage * 3.6}deg` }],
            },
          ]}
        />
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.valueText}>{current}</Text>
        <Text style={styles.labelText}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
  },
  svgContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
  },
  progressCircle: {
    position: 'absolute',
    borderTopColor: 'transparent',
    transform: [{ rotate: '0deg' }],
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  labelText: {
    fontSize: 12,
    color: colors.secondary,
    marginTop: 2,
  },
});