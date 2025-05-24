import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/userStore';
import { useMealStore } from '@/store/mealStore';
import { useFirebaseStore } from '@/store/firebaseStore';
import { logOut } from '@/lib/auth';
import Button from '@/components/Button';
import { colors } from '@/constants/colors';
import { Moon, Sun, Trash2, LogOut, AlertTriangle } from 'lucide-react-native';
import FirebaseRulesInfo from '@/components/FirebaseRulesInfo';

export default function ProfileScreen() {
  const { profile, updateProfile, toggleDarkMode, isDarkMode, calculateGoals } = useUserStore();
  const { clearAllMeals } = useMealStore();
  const hasFirebasePermissionsError = useFirebaseStore((state) => state.hasFirebasePermissionsError);
  
  const [name, setName] = useState(profile?.name || '');
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [weight, setWeight] = useState(profile?.weight?.toString() || '');
  const [height, setHeight] = useState(profile?.height?.toString() || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(profile?.gender || 'male');
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>(profile?.goal || 'maintain');
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'>(
    profile?.activityLevel || 'moderate'
  );
  const [showFirebaseRules, setShowFirebaseRules] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleSaveProfile = async () => {
    if (!profile) return;
    
    setIsUpdating(true);
    
    try {
      updateProfile({
        name,
        age: parseInt(age, 10),
        weight: parseFloat(weight),
        height: parseFloat(height),
        gender,
        goal,
        activityLevel,
      });
      
      calculateGoals();
      
      Alert.alert('Profile Updated', 'Your profile has been updated successfully.');
    } catch (error) {
      console.error('Error updating profile:', error);
      
      if (hasFirebasePermissionsError) {
        Alert.alert(
          'Firebase Permissions Error',
          'Your profile was updated locally, but could not be saved to Firebase due to missing permissions.',
          [
            { text: 'View Firebase Rules', onPress: () => setShowFirebaseRules(true) },
            { text: 'OK', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to update your profile. Please try again.');
      }
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all your meal data? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearAllMeals();
            Alert.alert('Data Cleared', 'All your meal data has been cleared.');
          },
        },
      ]
    );
  };
  
  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logOut();
              // Auth state listener will handle navigation
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ]
    );
  };
  
  if (showFirebaseRules) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Firebase Rules</Text>
          <Button
            title="Back to Profile"
            onPress={() => setShowFirebaseRules(false)}
            style={{ marginTop: 8 }}
          />
        </View>
        <FirebaseRulesInfo />
      </SafeAreaView>
    );
  }
  
  if (!profile) {
    return (
      <View style={styles.container}>
        <Text>Profile not found</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Profile</Text>
        
        {hasFirebasePermissionsError && (
          <View style={styles.permissionsWarning}>
            <AlertTriangle size={24} color={colors.warning} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.permissionsWarningTitle}>Firebase Permissions Error</Text>
              <Text style={styles.permissionsWarningText}>
                Your data is only saved locally and not synced to Firebase.
              </Text>
              <Button
                title="View Firebase Rules"
                variant="outline"
                size="small"
                onPress={() => setShowFirebaseRules(true)}
                style={{ marginTop: 8 }}
              />
            </View>
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="Years"
              keyboardType="number-pad"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Weight</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              placeholder="kg"
              keyboardType="decimal-pad"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Height</Text>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              placeholder="cm"
              keyboardType="decimal-pad"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.optionsContainer}>
              <Button
                title="Male"
                variant={gender === 'male' ? 'primary' : 'outline'}
                size="small"
                onPress={() => setGender('male')}
                style={styles.optionButton}
              />
              <Button
                title="Female"
                variant={gender === 'female' ? 'primary' : 'outline'}
                size="small"
                onPress={() => setGender('female')}
                style={styles.optionButton}
              />
              <Button
                title="Other"
                variant={gender === 'other' ? 'primary' : 'outline'}
                size="small"
                onPress={() => setGender('other')}
                style={styles.optionButton}
              />
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fitness Goals</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Goal</Text>
            <View style={styles.optionsContainer}>
              <Button
                title="Lose Weight"
                variant={goal === 'lose' ? 'primary' : 'outline'}
                size="small"
                onPress={() => setGoal('lose')}
                style={styles.optionButton}
              />
              <Button
                title="Maintain"
                variant={goal === 'maintain' ? 'primary' : 'outline'}
                size="small"
                onPress={() => setGoal('maintain')}
                style={styles.optionButton}
              />
              <Button
                title="Gain Weight"
                variant={goal === 'gain' ? 'primary' : 'outline'}
                size="small"
                onPress={() => setGoal('gain')}
                style={styles.optionButton}
              />
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Activity Level</Text>
            <View style={styles.activityContainer}>
              <Button
                title="Sedentary"
                variant={activityLevel === 'sedentary' ? 'primary' : 'outline'}
                size="small"
                onPress={() => setActivityLevel('sedentary')}
                style={styles.activityButton}
              />
              <Button
                title="Light"
                variant={activityLevel === 'light' ? 'primary' : 'outline'}
                size="small"
                onPress={() => setActivityLevel('light')}
                style={styles.activityButton}
              />
              <Button
                title="Moderate"
                variant={activityLevel === 'moderate' ? 'primary' : 'outline'}
                size="small"
                onPress={() => setActivityLevel('moderate')}
                style={styles.activityButton}
              />
              <Button
                title="Active"
                variant={activityLevel === 'active' ? 'primary' : 'outline'}
                size="small"
                onPress={() => setActivityLevel('active')}
                style={styles.activityButton}
              />
              <Button
                title="Very Active"
                variant={activityLevel === 'very_active' ? 'primary' : 'outline'}
                size="small"
                onPress={() => setActivityLevel('very_active')}
                style={styles.activityButton}
              />
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Dark Mode</Text>
              <Text style={styles.settingDescription}>Switch between light and dark theme</Text>
            </View>
            <View style={styles.themeToggle}>
              <Sun size={20} color={isDarkMode ? colors.secondary : colors.text} />
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: colors.card, true: colors.primary }}
                thumbColor={colors.background}
                style={styles.switch}
              />
              <Moon size={20} color={isDarkMode ? colors.text : colors.secondary} />
            </View>
          </View>
          
          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            <Button
              title="Clear All Data"
              variant="outline"
              onPress={handleClearData}
              icon={<Trash2 size={20} color={colors.error} />}
              textStyle={{ color: colors.error }}
              style={styles.dangerButton}
            />
            
            <Button
              title="Log Out"
              variant="outline"
              onPress={handleLogout}
              icon={<LogOut size={20} color={colors.error} />}
              textStyle={{ color: colors.error }}
              style={[styles.dangerButton, { marginTop: 12 }]}
            />
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Button
          title="Save Changes"
          onPress={handleSaveProfile}
          loading={isUpdating}
          style={styles.saveButton}
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
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
  },
  permissionsWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: 'rgba(255, 204, 0, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning,
    marginBottom: 24,
  },
  permissionsWarningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning,
    marginBottom: 4,
  },
  permissionsWarningText: {
    fontSize: 14,
    color: colors.text,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
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
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  activityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  activityButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.secondary,
    marginTop: 2,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switch: {
    marginHorizontal: 8,
  },
  dangerZone: {
    marginTop: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginBottom: 16,
  },
  dangerButton: {
    borderColor: colors.error,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  saveButton: {
    width: '100%',
  },
});