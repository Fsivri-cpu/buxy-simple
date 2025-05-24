import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { colors } from '@/constants/colors';

export default function FirebaseRulesInfo() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Firebase Security Rules</Text>
      
      <Text style={styles.paragraph}>
        Your app is experiencing permission errors when trying to access Firebase. This is because your Firebase security rules are not properly configured.
      </Text>
      
      <Text style={styles.subtitle}>How to Fix</Text>
      
      <Text style={styles.paragraph}>
        1. Go to the Firebase Console (console.firebase.google.com)
      </Text>
      
      <Text style={styles.paragraph}>
        2. Select your project
      </Text>
      
      <Text style={styles.paragraph}>
        3. Navigate to Firestore Database → Rules
      </Text>
      
      <Text style={styles.paragraph}>
        4. Replace the rules with the following:
      </Text>
      
      <View style={styles.codeBlock}>
        <Text style={styles.code}>
          {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}
        </Text>
      </View>
      
      <Text style={styles.paragraph}>
        5. Navigate to Storage → Rules
      </Text>
      
      <Text style={styles.paragraph}>
        6. Replace the rules with the following:
      </Text>
      
      <View style={styles.codeBlock}>
        <Text style={styles.code}>
          {`rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}
        </Text>
      </View>
      
      <Text style={styles.paragraph}>
        7. Click "Publish" for both rule sets
      </Text>
      
      <Text style={styles.subtitle}>What These Rules Do</Text>
      
      <Text style={styles.paragraph}>
        These rules allow users to read and write only their own data. Each user can only access documents where the user ID matches their authentication ID.
      </Text>
      
      <Text style={styles.paragraph}>
        The wildcard pattern {`{document=**}`} is crucial as it allows access to all subcollections under the user document, not just the document itself.
      </Text>
      
      <Text style={styles.paragraph}>
        Without this wildcard, you would only have access to the main user document but not to any subcollections like days or meals.
      </Text>
      
      <Text style={styles.subtitle}>Testing Your Rules</Text>
      
      <Text style={styles.paragraph}>
        After updating your rules, you can test them in the Firebase Console:
      </Text>
      
      <Text style={styles.paragraph}>
        1. Go to Rules → Playground
      </Text>
      
      <Text style={styles.paragraph}>
        2. Select "Authenticated" and enter your user ID
      </Text>
      
      <Text style={styles.paragraph}>
        3. Test a read operation on {`/users/YOUR_USER_ID`}
      </Text>
      
      <Text style={styles.paragraph}>
        4. Also test a read on {`/users/YOUR_USER_ID/days/2023-05-01`}
      </Text>
      
      <Text style={styles.paragraph}>
        Both should show "Allow" if your rules are correctly configured.
      </Text>
      
      <Text style={styles.subtitle}>Common Issues</Text>
      
      <Text style={styles.paragraph}>
        1. <Text style={styles.bold}>Missing wildcard pattern</Text>: If you only have rules for {`/users/{userId}`} without the {`{document=**}`} part, you won't be able to access subcollections.
      </Text>
      
      <Text style={styles.paragraph}>
        2. <Text style={styles.bold}>Timing issues</Text>: If you try to access Firestore before authentication is complete, the request will be denied. Always make sure you're authenticated before making Firestore calls.
      </Text>
      
      <Text style={styles.paragraph}>
        3. <Text style={styles.bold}>Missing user document</Text>: If the document at {`/users/{uid}`} doesn't exist, you'll get a permission error when trying to read it. The app now creates this document automatically during signup.
      </Text>
      
      <Text style={styles.paragraph}>
        4. <Text style={styles.bold}>TypeScript errors</Text>: If there are TypeScript errors in the code that creates the user document, that code might be skipped during compilation, resulting in no document being created.
      </Text>
      
      <Text style={styles.subtitle}>Debugging Steps</Text>
      
      <Text style={styles.paragraph}>
        If you're still experiencing permission errors:
      </Text>
      
      <Text style={styles.paragraph}>
        1. Check the console logs for the exact path that's causing the error
      </Text>
      
      <Text style={styles.paragraph}>
        2. Verify that the user is fully authenticated before any Firestore calls
      </Text>
      
      <Text style={styles.paragraph}>
        3. Confirm that the document at {`/users/{uid}`} exists in the Firebase Console
      </Text>
      
      <Text style={styles.paragraph}>
        4. Test the exact path in the Rules Playground to see if it's allowed
      </Text>
      
      <Text style={styles.paragraph}>
        5. Clear your app cache and restart the app to ensure the latest code is running
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    lineHeight: 22,
  },
  codeBlock: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginVertical: 12,
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    color: '#333',
  },
  bold: {
    fontWeight: '700',
  },
});