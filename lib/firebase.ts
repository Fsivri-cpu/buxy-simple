import { initializeApp, getApps, getApp } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import Firebase config
import { firebaseConfig } from '../config/env';

// Initialize Firebase
let app;
try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
  } else {
    app = getApp();
    console.log("Firebase app already initialized");
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
  throw error;
}

// For Firebase v11.8.0, we'll import Firebase services with a try-catch to handle API changes
// This ensures compatibility with the new Firebase v11 module structure

// Initialize Firebase instances
let auth, db, storage;

// Get Firebase Auth
try {
  // Import Firebase Auth dynamically to avoid type issues
  const authModule = require('firebase/auth');
  
  // Create a basic auth instance for Firebase v11.8.0
  // Using a different approach that doesn't rely on specific methods
  try {
    // Try the most compatible approach first
    auth = authModule.Auth ? new authModule.Auth(app) : null;
    
    if (!auth) {
      // Try alternative instantiation methods
      if (typeof authModule.initializeAuth === 'function') {
        const persistence = typeof authModule.getReactNativePersistence === 'function' ?
          authModule.getReactNativePersistence(AsyncStorage) : undefined;
          
        auth = authModule.initializeAuth(app, persistence ? { persistence } : undefined);
      } else if (typeof authModule.getAuth === 'function') {
        auth = authModule.getAuth(app);
      }
    }
    
    // If we still don't have auth, create a stub
    if (!auth) {
      throw new Error('Could not initialize auth with any method');
    }
    
    console.log('Firebase Auth initialized');
  } catch (initError) {
    console.error('Error initializing auth:', initError);
    // Create a fallback auth object
    auth = { 
      currentUser: null,
      onAuthStateChanged: () => () => {} // No-op unsubscribe
    };
    console.warn('Using stub auth object - auth functionality will be limited');
  }
} catch (error) {
  console.error('Failed to import Firebase Auth:', error);
  // Create a placeholder to prevent crashes
  auth = { 
    currentUser: null,
    onAuthStateChanged: () => () => {} // No-op unsubscribe
  };
}

// Get Firestore
try {
  const { getFirestore } = require('firebase/firestore');
  db = getFirestore(app);
  console.log('Firestore initialized');
} catch (error) {
  console.error('Failed to initialize Firestore:', error);
  db = {};
}

// Get Storage
try {
  const { getStorage } = require('firebase/storage');
  storage = getStorage(app);
  console.log('Storage initialized');
} catch (error) {
  console.error('Failed to initialize Storage:', error);
  storage = {};
}

// Log Firebase configuration status (without revealing values)
console.log("Firebase configuration status:", {
  apiKey: firebaseConfig.apiKey ? "Set" : "Not set",
  authDomain: firebaseConfig.authDomain ? "Set" : "Not set",
  projectId: firebaseConfig.projectId ? "Set" : "Not set",
  storageBucket: firebaseConfig.storageBucket ? "Set" : "Not set",
  messagingSenderId: firebaseConfig.messagingSenderId ? "Set" : "Not set",
  appId: firebaseConfig.appId ? "Set" : "Not set",
});

// Export Firebase services
export { app, auth, db, storage };