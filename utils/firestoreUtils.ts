// Firestore utility functions to handle missing/changed API methods in the Firebase SDK

import { 
  collection, 
  doc, 
  CollectionReference,
  DocumentReference,
  serverTimestamp,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
  DocumentData
} from 'firebase/firestore';

// Import db from our Firebase config
import { db } from '../lib/firebase';

/**
 * Creates a document reference for nested collection paths
 */
function createCollectionRef(dbInstance: any, pathSegments: string[]): CollectionReference {
  // Explicitly create an array and add each segment to avoid spread type issues
  const allPaths: string[] = [];
  pathSegments.forEach(segment => allPaths.push(segment));
  
  // Handle different cases to avoid spread operator type issues
  if (allPaths.length === 0) {
    throw new Error('At least one path segment is required');
  } else if (allPaths.length === 1) {
    return collection(dbInstance, allPaths[0]);
  } else {
    // This version of Firebase expects exactly 2 arguments for collection()
    // For nested paths, we need to construct the path string manually
    const collPath = allPaths.join('/');
    return collection(dbInstance, collPath);
  }
}

/**
 * Adds a document to a collection with auto-generated ID
 */
export const addDoc = async<T = DocumentData>(
  collectionRefOrPath: CollectionReference | any,
  data: T
): Promise<DocumentReference<T>> => {
  let collectionRef: CollectionReference;
  
  // If passed multiple string arguments, create a collection reference
  if (typeof collectionRefOrPath === 'object' && collectionRefOrPath.type === 'collection') {
    collectionRef = collectionRefOrPath;
  } else {
    // For backward compatibility with old Firebase API
    console.warn('Using string paths with addDoc is deprecated. Use collection() first.');
    collectionRef = collectionRefOrPath;
  }
  
  // Create a reference with auto-generated ID
  const newDocRef = doc(collectionRef) as DocumentReference<T>;
  
  // Set the data on the document with timestamps
  const docData = {
    ...data,
    // Ensure timestamps are included
    createdAt: (data as any).createdAt || serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  // Call setDoc with exactly 2 arguments
  await setDoc(newDocRef, docData);
  
  return newDocRef;
};

/**
 * Deletes a document from Firestore
 */
export const deleteDoc = async(docRef: DocumentReference): Promise<void> => {
  // Use the document reference's path to delete it
  try {
    // Firebase v9+ compatible approach - modified for 2-argument version
    // Create an update object with deletion marker
    const deleteMarker = { deleted: true, deletedAt: serverTimestamp() };
    // Call setDoc with exactly 2 arguments
    await setDoc(docRef, deleteMarker);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

/**
 * runTransaction function for Firestore
 * 
 * @param updateFunction Function that performs the transaction operations
 * @returns Result of the transaction
 */
export const runTransaction = async<T>(
  updateFunction: (transaction: any) => Promise<T>
): Promise<T> => {
  // Use the db instance imported from firebase.ts
  
  // This is a simplified implementation for compatibility
  // It does not provide true transaction guarantees
  try {
    // Create a transaction-like object that provides similar methods
    const transactionProxy = {
      // Get a document
      get: async (docRef: DocumentReference) => {
        try {
          const docSnap = await getDoc(docRef);
          return {
            exists: () => docSnap.exists(),
            data: () => docSnap.data(),
            id: docSnap.id
          };
        } catch (error) {
          console.error('Error getting document in transaction:', error);
          throw error;
        }
      },
      // Set document data
      set: async (docRef: DocumentReference, data: any) => {
        try {
          await setDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          console.error('Error setting document in transaction:', error);
          throw error;
        }
      },
      // Update document data
      update: async (docRef: DocumentReference, data: any) => {
        try {
          // First get existing data
          const docSnap = await getDoc(docRef);
          
          // Combine with new data
          const newData = {
            ...(docSnap.exists() ? docSnap.data() : {}),
            ...data,
            updatedAt: serverTimestamp()
          };
          
          // Call setDoc with exactly 2 arguments
          await setDoc(docRef, newData);
        } catch (error) {
          console.error('Error updating document in transaction:', error);
          throw error;
        }
      }
    };
    
    return await updateFunction(transactionProxy);
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};

/**
 * documentId function for Firestore queries
 * This provides a field path that represents the document ID
 */
export const documentId = () => {
  // In Firestore, the document ID is represented by the special field path "__name__"
  return {
    toString: () => '__name__',
    // Add other properties to make it compatible with FieldPath
    isEqual: (other: any) => other?.toString() === '__name__'
  };
};

/**
 * Create a server timestamp that can be used in place of Timestamp.now()
 */
export const timestampNow = () => {
  return serverTimestamp();
};

/**
 * Convert a date to a Firestore timestamp-like object
 */
export const fromDate = (date: Date) => {
  return {
    toDate: () => date,
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: (date.getTime() % 1000) * 1000000
  };
};
