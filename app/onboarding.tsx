import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { useFirebaseStore } from '@/store/firebaseStore';
import Button from '@/components/Button';
import { colors } from '@/constants/colors';
import * as Notifications from 'expo-notifications';
import { Calendar, Activity, User, Bell, Moon, Sun } from 'lucide-react-native';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, // Added for iOS 15 banner notifications
    shouldShowList: true,   // Added for iOS 15 Notification Summary
  }),
});

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'>('moderate');
  const [allowNotifications, setAllowNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use individual primitive selectors
  const setProfile = useUserStore((state) => state.setProfile);
  const completeOnboarding = useUserStore((state) => state.completeOnboarding);
  const calculateGoals = useUserStore((state) => state.calculateGoals);
  const toggleDarkMode = useUserStore((state) => state.toggleDarkMode);
  const isDarkMode = useUserStore((state) => state.isDarkMode);
  
  // Use individual primitive selectors
  const user = useFirebaseStore((state) => state.user);
  const updateProfile = useFirebaseStore((state) => state.updateProfile);
  const hasFirebasePermissionsError = useFirebaseStore((state) => state.hasFirebasePermissionsError);
  
  // Set dark mode from store on initial load
  useEffect(() => {
    setDarkMode(isDarkMode);
  }, [isDarkMode]);
  
  const handleNext = async () => {
    if (step < 8) {
      setStep(step + 1);
    } else {
      // Save user profile
      if (!user) {
        Alert.alert("Error", "User not found. Please log in again.");
        return;
      }
      
      setIsSubmitting(true);
      
      const profile = {
        id: user.uid,
        name,
        age: parseInt(age, 10),
        weight: parseFloat(weight),
        height: parseFloat(height),
        gender,
        goal,
        activityLevel,
      };
      
      console.log("Creating profile:", profile);
      
      // Set profile in store
      setProfile(profile);
      
      // Calculate nutrition goals
      calculateGoals();
      
      // Set dark mode if selected
      if (darkMode !== isDarkMode) {
        toggleDarkMode();
      }
      
      // Request notification permissions if allowed
      if (allowNotifications) {
        try {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status !== 'granted') {
            console.log('Notification permission not granted');
          }
        } catch (error) {
          console.error('Error requesting notification permissions:', error);
        }
      }
      
      // Update Firebase profile
      try {
        await updateProfile({
          displayName: name,
          gender,
          heightCm: parseFloat(height),
          weightKg: parseFloat(weight),
          goal,
          theme: darkMode ? 'dark' : 'light',
          onboardingCompleted: true,
        });
        
        // Complete onboarding
        completeOnboarding();
        
        // Navigate to main app
        router.replace('/(tabs)');
      } catch (error) {
        console.error('Error updating profile:', error);
        
        if (hasFirebasePermissionsError) {
          // If we have a permissions error, show a specific message
          Alert.alert(
            'Firebase Permissions Error',
            'Your profile was saved locally, but could not be saved to Firebase due to missing permissions. The app will continue to work, but your data will not be synced to the cloud.\n\nTo fix this, please update your Firebase security rules.',
            [
              { 
                text: 'Continue Anyway', 
                onPress: () => {
                  // Complete onboarding anyway
                  completeOnboarding();
                  router.replace('/(tabs)');
                }
              }
            ]
          );
        } else {
          // For other errors, show a generic message
          Alert.alert('Error', 'Failed to save your profile. Please try again.');
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  const isNextDisabled = () => {
    switch (step) {
      case 1:
        return !name;
      case 2:
        return !gender;
      case 3:
        return !age || isNaN(parseInt(age, 10));
      case 4:
        return !weight || isNaN(parseFloat(weight)) || !height || isNaN(parseFloat(height));
      default:
        return false;
    }
  };
  
  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicator}>
        {Array.from({ length: 8 }).map((_, index) => (
          <View 
            key={index} 
            style={[
              styles.stepDot, 
              index + 1 === step ? styles.activeStepDot : null,
              index + 1 < step ? styles.completedStepDot : null
            ]} 
          />
        ))}
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {renderStepIndicator()}
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {step === 1 && "What's your name?"}
            {step === 2 && "Select your gender"}
            {step === 3 && "How old are you?"}
            {step === 4 && "Your height & weight"}
            {step === 5 && "What's your goal?"}
            {step === 6 && "Activity level"}
            {step === 7 && "Notifications"}
            {step === 8 && "Choose your theme"}
          </Text>
          <Text style={styles.subtitle}>
            {step === 1 && "We'll use this to personalize your experience"}
            {step === 2 && "This helps us calculate your metabolic rate"}
            {step === 3 && "Age is a key factor in determining your nutritional needs"}
            {step === 4 && "We'll use this to calculate your daily calorie needs"}
            {step === 5 && "Tell us what you want to achieve"}
            {step === 6 && "How active are you on a typical day?"}
            {step === 7 && "Would you like to receive reminders to log your meals?"}
            {step === 8 && "Choose your preferred app appearance"}
          </Text>
        </View>
        
        <View style={styles.content}>
          {step === 1 && (
            <View style={styles.inputContainer}>
              <View style={styles.iconContainer}>
                <User size={32} color={colors.primary} />
              </View>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                autoFocus
              />
            </View>
          )}
          
          {step === 2 && (
            <View style={styles.optionsGrid}>
              <Button
                title="Male"
                variant={gender === 'male' ? 'primary' : 'outline'}
                onPress={() => setGender('male')}
                style={styles.genderButton}
              />
              <Button
                title="Female"
                variant={gender === 'female' ? 'primary' : 'outline'}
                onPress={() => setGender('female')}
                style={styles.genderButton}
              />
              <Button
                title="Other"
                variant={gender === 'other' ? 'primary' : 'outline'}
                onPress={() => setGender('other')}
                style={styles.genderButton}
              />
            </View>
          )}
          
          {step === 3 && (
            <View style={styles.inputContainer}>
              <View style={styles.iconContainer}>
                <Calendar size={32} color={colors.primary} />
              </View>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                placeholder="Your age in years"
                keyboardType="number-pad"
                autoFocus
              />
            </View>
          )}
          
          {step === 4 && (
            <View>
              <View style={styles.measurementContainer}>
                <Text style={styles.measurementLabel}>Height (cm)</Text>
                <TextInput
                  style={styles.measurementInput}
                  value={height}
                  onChangeText={setHeight}
                  placeholder="175"
                  keyboardType="decimal-pad"
                  autoFocus
                />
              </View>
              
              <View style={styles.measurementContainer}>
                <Text style={styles.measurementLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.measurementInput}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="70"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          )}
          
          {step === 5 && (
            <View style={styles.goalContainer}>
              <Button
                title="Lose Weight"
                variant={goal === 'lose' ? 'primary' : 'outline'}
                onPress={() => setGoal('lose')}
                style={styles.goalButton}
              />
              <Text style={styles.goalDescription}>
                We'll create a calorie deficit to help you lose weight safely
              </Text>
              
              <Button
                title="Maintain Weight"
                variant={goal === 'maintain' ? 'primary' : 'outline'}
                onPress={() => setGoal('maintain')}
                style={styles.goalButton}
              />
              <Text style={styles.goalDescription}>
                We'll help you maintain your current weight with balanced nutrition
              </Text>
              
              <Button
                title="Gain Weight"
                variant={goal === 'gain' ? 'primary' : 'outline'}
                onPress={() => setGoal('gain')}
                style={styles.goalButton}
              />
              <Text style={styles.goalDescription}>
                We'll create a calorie surplus to help you build muscle and gain weight
              </Text>
            </View>
          )}
          
          {step === 6 && (
            <View style={styles.activityContainer}>
              <View style={styles.iconContainer}>
                <Activity size={32} color={colors.primary} />
              </View>
              
              <Button
                title="Sedentary"
                variant={activityLevel === 'sedentary' ? 'primary' : 'outline'}
                onPress={() => setActivityLevel('sedentary')}
                style={styles.activityButton}
              />
              <Text style={styles.activityDescription}>
                Little or no exercise, desk job (less than 5,000 steps/day)
              </Text>
              
              <Button
                title="Lightly Active"
                variant={activityLevel === 'light' ? 'primary' : 'outline'}
                onPress={() => setActivityLevel('light')}
                style={styles.activityButton}
              />
              <Text style={styles.activityDescription}>
                Light exercise 1-3 days/week (5,000-7,500 steps/day)
              </Text>
              
              <Button
                title="Moderately Active"
                variant={activityLevel === 'moderate' ? 'primary' : 'outline'}
                onPress={() => setActivityLevel('moderate')}
                style={styles.activityButton}
              />
              <Text style={styles.activityDescription}>
                Moderate exercise 3-5 days/week (7,500-10,000 steps/day)
              </Text>
              
              <Button
                title="Very Active"
                variant={activityLevel === 'active' ? 'primary' : 'outline'}
                onPress={() => setActivityLevel('active')}
                style={styles.activityButton}
              />
              <Text style={styles.activityDescription}>
                Hard exercise 6-7 days/week (10,000-12,500 steps/day)
              </Text>
              
              <Button
                title="Extra Active"
                variant={activityLevel === 'very_active' ? 'primary' : 'outline'}
                onPress={() => setActivityLevel('very_active')}
                style={styles.activityButton}
              />
              <Text style={styles.activityDescription}>
                Very hard exercise, physical job or training twice a day (12,500+ steps/day)
              </Text>
            </View>
          )}
          
          {step === 7 && (
            <View style={styles.notificationContainer}>
              <View style={styles.iconContainer}>
                <Bell size={32} color={colors.primary} />
              </View>
              
              <Text style={styles.notificationTitle}>
                Stay on track with reminders
              </Text>
              
              <Text style={styles.notificationDescription}>
                We can send you friendly reminders to log your meals and stay consistent with your nutrition goals.
              </Text>
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Enable notifications</Text>
                <Switch
                  value={allowNotifications}
                  onValueChange={setAllowNotifications}
                  trackColor={{ false: colors.inactive, true: colors.primary }}
                  thumbColor={colors.background}
                />
              </View>
              
              <Text style={styles.notificationNote}>
                You can change this later in your profile settings
              </Text>
            </View>
          )}
          
          {step === 8 && (
            <View style={styles.themeContainer}>
              <Text style={styles.themeTitle}>Choose your theme</Text>
              
              <View style={styles.themeOptions}>
                <View style={[styles.themeOption, !darkMode && styles.selectedThemeOption]}>
                  <View style={styles.themePreview}>
                    <View style={styles.lightThemePreview}>
                      <Sun size={24} color="#000" />
                    </View>
                  </View>
                  <Text style={styles.themeLabel}>Light</Text>
                </View>
                
                <View style={[styles.themeOption, darkMode && styles.selectedThemeOption]}>
                  <View style={styles.themePreview}>
                    <View style={styles.darkThemePreview}>
                      <Moon size={24} color="#fff" />
                    </View>
                  </View>
                  <Text style={styles.themeLabel}>Dark</Text>
                </View>
              </View>
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Dark mode</Text>
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: colors.inactive, true: colors.primary }}
                  thumbColor={colors.background}
                />
              </View>
              
              {hasFirebasePermissionsError && (
                <View style={styles.permissionsWarning}>
                  <Text style={styles.permissionsWarningTitle}>Firebase Permissions Warning</Text>
                  <Text style={styles.permissionsWarningText}>
                    Your app is having trouble connecting to Firebase due to missing permissions. Your data will be saved locally, but not synced to the cloud.
                  </Text>
                  <Text style={styles.permissionsWarningText}>
                    To fix this, update your Firebase security rules to allow read/write access to your user data.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        {step > 1 && (
          <Button
            title="Back"
            variant="outline"
            onPress={handleBack}
            style={styles.backButton}
          />
        )}
        <Button
          title={step < 8 ? "Next" : "Get Started"}
          onPress={handleNext}
          disabled={isNextDisabled() || isSubmitting}
          loading={isSubmitting}
          style={styles.nextButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.inactive,
    marginHorizontal: 4,
  },
  activeStepDot: {
    backgroundColor: colors.primary,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  completedStepDot: {
    backgroundColor: colors.success,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 32,
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
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  genderButton: {
    width: '100%',
    marginBottom: 16,
  },
  measurementContainer: {
    marginBottom: 24,
  },
  measurementLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  measurementInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  goalContainer: {
    marginTop: 16,
  },
  goalButton: {
    marginBottom: 8,
  },
  goalDescription: {
    fontSize: 14,
    color: colors.secondary,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  activityContainer: {
    marginTop: 16,
  },
  activityButton: {
    marginBottom: 8,
  },
  activityDescription: {
    fontSize: 14,
    color: colors.secondary,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  notificationContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  notificationTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  notificationDescription: {
    fontSize: 16,
    color: colors.secondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  notificationNote: {
    fontSize: 14,
    color: colors.secondary,
    marginTop: 16,
    textAlign: 'center',
  },
  themeContainer: {
    marginTop: 16,
  },
  themeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  themeOption: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedThemeOption: {
    borderColor: colors.primary,
  },
  themePreview: {
    width: 100,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  lightThemePreview: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  darkThemePreview: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  permissionsWarning: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(255, 204, 0, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  permissionsWarningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning,
    marginBottom: 8,
  },
  permissionsWarningText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  backButton: {
    flex: 1,
    marginRight: 12,
  },
  nextButton: {
    flex: 2,
  },
});