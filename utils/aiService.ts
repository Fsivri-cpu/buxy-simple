import { Platform } from 'react-native';

interface AIResponse {
  completion: string;
}

export async function analyzeFood(imageBase64: string): Promise<any> {
  try {
    if (Platform.OS === 'web') {
      // Mock response for web since we can't use the camera properly
      return mockAnalysis();
    }
    
    const response = await fetch('https://toolkit.rork.com/text/llm/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a nutrition expert that analyzes food images. Provide detailed nutritional information including calories, protein, carbs, and fat. Format your response as JSON with the following structure: {"name": "Food Name", "calories": number, "protein": number, "carbs": number, "fat": number}. Be precise and accurate.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'What food is in this image? Provide nutritional information.' },
              { type: 'image', image: imageBase64 }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze food image');
    }

    const data: AIResponse = await response.json();
    
    // Parse the JSON from the completion string
    try {
      const nutritionData = JSON.parse(data.completion);
      return nutritionData;
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      return mockAnalysis();
    }
  } catch (error) {
    console.error('Error analyzing food:', error);
    return mockAnalysis();
  }
}

function mockAnalysis() {
  // Return a mock analysis for testing or when the API fails
  return {
    name: 'Chicken Salad',
    calories: 320,
    protein: 25,
    carbs: 15,
    fat: 18
  };
}