import React from 'react';
import { Stack } from 'expo-router';
import { useUserStore } from '@/store/userStore';

export default function AuthLayout() {
  const isDarkMode = useUserStore((state) => state.isDarkMode);
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDarkMode ? '#000' : '#fff',
        },
        headerTintColor: isDarkMode ? '#fff' : '#000',
        contentStyle: {
          backgroundColor: isDarkMode ? '#000' : '#fff',
        },
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: 'Login',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: 'Sign Up',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          title: 'Reset Password',
        }}
      />
    </Stack>
  );
}