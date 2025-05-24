// Type declarations to fix IDE type checking
import 'react-native';

// Extend React Native module declarations
declare module 'react-native' {
  // Re-export components that might be missing in type definitions
  export const StyleSheet: any;
  export const TextInput: any;
  export const Alert: any;
  export const Image: any;
  export const TouchableOpacity: any;
}
