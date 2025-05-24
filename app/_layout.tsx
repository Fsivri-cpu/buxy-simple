// Importing React with proper types
import * as React from 'react';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
// Importing React Native components with proper types
import { View, Text, ActivityIndicator } from 'react-native';

// Göreceli yollarla import işlemleri
import { colors } from '../constants/colors';
import { useUserStore } from '../store/userStore';
import { useFirebaseStore } from '../store/firebaseStore';
import { FirebaseAuthProvider } from '../components/FirebaseAuthProvider';

// Firebase tabanlı uygulamaya geçtiğimiz için TRPC istemcisini kaldırdık
// const queryClient = new QueryClient();

export default function RootLayout() {
  // Use primitive selectors to prevent infinite loops
  const isDarkMode = useUserStore((state: any) => state.isDarkMode);
  const isOnboarded = useUserStore((state: any) => state.isOnboarded);
  
  const isAuthenticated = useFirebaseStore((state: any) => state.isAuthenticated);
  const isLoadingProfile = useFirebaseStore((state: any) => state.isLoadingProfile);
  const hasFirebasePermissionsError = useFirebaseStore((state: any) => state.hasFirebasePermissionsError);
  
  const initializeAuthListener = useFirebaseStore((state: any) => state.initializeAuthListener);
  
  // Initialize Firebase auth listener
  useEffect(() => {
    console.log("Initializing auth listener");
    const unsubscribe = initializeAuthListener();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [initializeAuthListener]);
  
  // Debug logs
  useEffect(() => {
    console.log("Auth state:", { 
      isAuthenticated, 
      isOnboarded,
      hasFirebasePermissionsError
    });
  }, [isAuthenticated, isOnboarded, hasFirebasePermissionsError]);
  
  // Show loading screen while checking auth state - but with a timeout to prevent getting stuck
  const [timeoutExpired, setTimeoutExpired] = React.useState(false);
  
  React.useEffect(() => {
    // Add a safety timeout to prevent getting stuck in loading state
    const timer = setTimeout(() => {
      if (isLoadingProfile) {
        console.log('Loading timeout expired, forcing app to continue');
        setTimeoutExpired(true);
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timer);
  }, [isLoadingProfile]);
  
  if (isLoadingProfile && !timeoutExpired) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDarkMode ? '#000' : '#fff' }}>
        <ActivityIndicator size="large" color={colors.highlight} />
        <Text style={{ marginTop: 16, color: isDarkMode ? '#fff' : '#000' }}>Loading your profile...</Text>
      </View>
    );
  }
  
  return (
    <FirebaseAuthProvider>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      {/* TRPC Provider'ı kaldırıldı, doğrudan Firebase ile çalışıyoruz */}
      <Stack screenOptions={{ headerShown: false }}>
        {!isAuthenticated && (
          <Stack.Screen 
            name="auth-screens" 
            options={{ 
              headerShown: false,
              animation: 'fade'
            }} 
          />
        )}
        
        {isAuthenticated && !isOnboarded && (
          <Stack.Screen 
            name="onboarding" 
            options={{ 
              headerShown: false,
              animation: 'fade'
            }} 
          />
        )}
        
        {isAuthenticated && isOnboarded && (
          <Stack.Screen 
            name="(tabs)" 
            options={{ 
              headerShown: false,
              animation: 'fade'
            }} 
          />
        )}
      </Stack>
      
      {hasFirebasePermissionsError && (
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(255, 204, 0, 0.9)',
          padding: 12,
        }}>
          <Text style={{ color: '#000', fontWeight: '600', textAlign: 'center' }}>
            Firebase Permissions Error: Data is saved locally only
          </Text>
        </View>
      )}
    </FirebaseAuthProvider>
  );
}