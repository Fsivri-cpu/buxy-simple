import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { signUp } from '@/lib/auth';
import Button from '@/components/Button';
import { colors } from '@/constants/colors';
import { FirebaseError } from 'firebase/app';
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { FirebaseUserProfile } from '@/types/firebase';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSignup = async () => {
    // Validate inputs
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create user with Firebase Auth
      console.log('Attempting to sign up with:', email);
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created with UID:', cred.user.uid);
      
      // Create user document in Firestore - CRITICAL STEP
      const userRef = doc(db, 'users', cred.user.uid);
      try {
        // Create a complete profile document
        const newProfile: FirebaseUserProfile = {
          displayName: name,
          gender: 'other',
          heightCm: 0,
          weightKg: 0,
          goal: 'maintain',
          theme: 'system',
          tdee: 0,
          targets: {
            calories: 0,
            protein: 0,
            carb: 0,
            fat: 0
          },
          onboardingCompleted: false,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        
        await setDoc(userRef, {
          ...newProfile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        console.log('Profile created at', userRef.path);
      } catch (error: unknown) {
        const firebaseError = error as FirebaseError;
        const msg = firebaseError.message;
        const code = firebaseError.code;
        console.error('Profile write error:', code, msg);
        
        // Try a simpler document as fallback
        try {
          await setDoc(userRef, {
            displayName: name,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          console.log('Created minimal profile as fallback');
        } catch (fallbackError: unknown) {
          console.error('Even fallback profile creation failed:', (fallbackError as FirebaseError).message);
        }
      }
      
      console.log('Sign up successful - user document created');
      // Auth state listener in _layout.tsx will handle navigation
    } catch (error: unknown) {
      console.error('Sign up error:', error);
      const firebaseError = error as FirebaseError;
      console.log('Firebase error code:', firebaseError.code);
      
      let errorMessage = 'Failed to create account';
      
      if (firebaseError.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use';
      } else if (firebaseError.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (firebaseError.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (firebaseError.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?q=80&w=200&auto=format&fit=crop' }} 
            style={styles.logo} 
          />
          <Text style={styles.appName}>NutritionTracker</Text>
        </View>
        
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to start tracking your nutrition</Text>
        
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              secureTextEntry
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry
            />
          </View>
          
          <Button
            title="Create Account"
            onPress={handleSignup}
            loading={isLoading}
            style={styles.signupButton}
          />
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
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
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.secondary,
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  signupButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginText: {
    color: colors.secondary,
    fontSize: 14,
  },
  loginLink: {
    color: colors.highlight,
    fontSize: 14,
    fontWeight: '600',
  },
});