import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Image, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useMealStore } from '@/store/mealStore';
import Button from '@/components/Button';
import { colors } from '@/constants/colors';
import { Camera, Plus, X } from 'lucide-react-native';
import { analyzeFood } from '@/utils/aiService';

export default function AddMealScreen() {
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [image, setImage] = useState<string | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { addMeal } = useMealStore();
  
  const handleTakePicture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera permissions to take a picture.');
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });
    
    if (!result.canceled && result.assets && result.assets[0]) {
      const selectedImage = result.assets[0];
      setImage(selectedImage.uri);
      
      if (selectedImage.base64) {
        analyzeImageWithAI(selectedImage.base64);
      }
    }
  };
  
  const handleSelectImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need media library permissions to select an image.');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });
    
    if (!result.canceled && result.assets && result.assets[0]) {
      const selectedImage = result.assets[0];
      setImage(selectedImage.uri);
      
      if (selectedImage.base64) {
        analyzeImageWithAI(selectedImage.base64);
      }
    }
  };
  
  const analyzeImageWithAI = async (base64Image: string) => {
    try {
      setIsAnalyzing(true);
      
      const result = await analyzeFood(base64Image);
      
      if (result) {
        setMealName(result.name || '');
        setCalories(result.calories?.toString() || '');
        setProtein(result.protein?.toString() || '');
        setCarbs(result.carbs?.toString() || '');
        setFat(result.fat?.toString() || '');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert('Analysis Failed', 'Could not analyze the image. Please enter details manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const clearImage = () => {
    setImage(undefined);
  };
  
  const handleSaveMeal = () => {
    if (!mealName || !calories) {
      Alert.alert('Missing Information', 'Please provide at least a meal name and calories.');
      return;
    }
    
    const newMeal = {
      id: Date.now().toString(),
      name: mealName,
      imageUrl: image,
      nutrients: {
        calories: parseInt(calories, 10) || 0,
        protein: parseInt(protein, 10) || 0,
        carbs: parseInt(carbs, 10) || 0,
        fat: parseInt(fat, 10) || 0,
      },
      date: new Date().toISOString(),
      mealType,
      createdAt: new Date().toISOString(),
    };
    
    addMeal(newMeal);
    
    // Navigate back to home
    router.push('/(tabs)');
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Add Meal</Text>
        
        <View style={styles.imageSection}>
          {image ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.image} />
              <Button
                title=""
                icon={<X size={20} color={colors.text} />}
                variant="outline"
                size="small"
                onPress={clearImage}
                style={styles.clearImageButton}
              />
            </View>
          ) : (
            <View style={styles.imageButtons}>
              <Button
                title="Take Photo"
                icon={<Camera size={20} color={colors.background} />}
                onPress={handleTakePicture}
                style={styles.imageButton}
              />
              <Button
                title="Choose Photo"
                icon={<Plus size={20} color={colors.text} />}
                variant="outline"
                onPress={handleSelectImage}
                style={styles.imageButton}
              />
            </View>
          )}
        </View>
        
        {isAnalyzing && (
          <View style={styles.analyzingContainer}>
            <Text style={styles.analyzingText}>Analyzing your meal...</Text>
          </View>
        )}
        
        <View style={styles.formSection}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Meal Name</Text>
            <TextInput
              style={styles.input}
              value={mealName}
              onChangeText={setMealName}
              placeholder="e.g., Chicken Salad"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Meal Type</Text>
            <View style={styles.mealTypeContainer}>
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                <Button
                  key={type}
                  title={type.charAt(0).toUpperCase() + type.slice(1)}
                  variant={mealType === type ? 'primary' : 'outline'}
                  size="small"
                  onPress={() => setMealType(type)}
                  style={styles.mealTypeButton}
                />
              ))}
            </View>
          </View>
          
          <View style={styles.nutrientsContainer}>
            <Text style={styles.label}>Nutrition Information</Text>
            
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientInput}>
                <Text style={styles.nutrientLabel}>Calories</Text>
                <TextInput
                  style={styles.nutrientInputField}
                  value={calories}
                  onChangeText={setCalories}
                  placeholder="0"
                  keyboardType="number-pad"
                />
              </View>
              
              <View style={styles.nutrientInput}>
                <Text style={styles.nutrientLabel}>Protein (g)</Text>
                <TextInput
                  style={styles.nutrientInputField}
                  value={protein}
                  onChangeText={setProtein}
                  placeholder="0"
                  keyboardType="number-pad"
                />
              </View>
            </View>
            
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientInput}>
                <Text style={styles.nutrientLabel}>Carbs (g)</Text>
                <TextInput
                  style={styles.nutrientInputField}
                  value={carbs}
                  onChangeText={setCarbs}
                  placeholder="0"
                  keyboardType="number-pad"
                />
              </View>
              
              <View style={styles.nutrientInput}>
                <Text style={styles.nutrientLabel}>Fat (g)</Text>
                <TextInput
                  style={styles.nutrientInputField}
                  value={fat}
                  onChangeText={setFat}
                  placeholder="0"
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Button
          title="Save Meal"
          onPress={handleSaveMeal}
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
  imageSection: {
    marginBottom: 24,
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.card,
  },
  clearImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    padding: 0,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  analyzingContainer: {
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  analyzingText: {
    color: colors.text,
    fontWeight: '500',
  },
  formSection: {
    flex: 1,
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
  mealTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  mealTypeButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  nutrientsContainer: {
    marginBottom: 20,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  nutrientInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  nutrientLabel: {
    fontSize: 14,
    color: colors.secondary,
    marginBottom: 4,
  },
  nutrientInputField: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
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