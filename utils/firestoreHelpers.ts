// Helper functions for working with Firestore collections and queries

import { 
  collection, 
  doc,
  getDoc,
  getDocs,
  query, 
  where,
  orderBy,
  limit,
  DocumentReference,
  CollectionReference,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';

// Import our Firebase services directly
import { db } from '../lib/firebase';

/**
 * Creates a collection reference with proper typing
 */
export function createCollectionRef(path: string, ...pathSegments: string[]): CollectionReference {
  // Use the db instance imported from firebase.ts
  // For Firebase v11.8.0, collection() expects exactly 2 arguments
  // Handle all cases by concatenating paths into a single string path
  if (pathSegments.length === 0) {
    // Simple case: just the main path
    return collection(db, path);
  } else {
    // For all other cases, join the paths with '/' and pass as a single string
    const fullPath = [path, ...pathSegments].join('/');
    return collection(db, fullPath);
  }
}

/**
 * Creates a document reference with proper typing
 */
export function createDocRef(collectionPath: string, docId: string, ...subPaths: string[]): DocumentReference {
  if (subPaths.length === 0) {
    // Simple document reference
    return doc(db, collectionPath, docId);
  } else {
    // Handle sub-collection document paths with explicit path building
    const pathArray = [collectionPath, docId];
    // Add each subPath explicitly to avoid spread operator type issues
    if (subPaths.length > 0) {
      subPaths.forEach(segment => pathArray.push(segment));
    }
    // Pass the path array using apply to handle the variable arguments
    return doc(db, ...pathArray);
  }
}

/**
 * Gets documents from a collection with proper error handling
 */
export async function getDocsFromCollection(
  collectionPath: string,
  ...pathSegments: string[]
): Promise<QuerySnapshot<DocumentData>> {
  try {
    const collectionRef = createCollectionRef(collectionPath, ...pathSegments);
    return await getDocs(collectionRef);
  } catch (error) {
    console.error(`Error getting documents from ${collectionPath}:`, error);
    throw error;
  }
}

/**
 * Gets a single document by reference with proper error handling
 */
export async function getDocById(
  collectionPath: string,
  docId: string,
  ...subPaths: string[]
): Promise<DocumentData | null> {
  try {
    const docRef = createDocRef(collectionPath, docId, ...subPaths);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log(`Document ${docId} not found in ${collectionPath}`);
      return null;
    }
  } catch (error) {
    console.error(`Error getting document ${docId} from ${collectionPath}:`, error);
    throw error;
  }
}

/**
 * Creates a query on a collection with proper error handling
 */
// Type for query operators
type QueryOperator = '<' | '<=' | '==' | '!=' | '>=' | '>' | 'array-contains' | 'array-contains-any' | 'in' | 'not-in';

/**
 * Creates a Firestore query with proper typing
 */
export function createQuery(
  collectionPath: string,
  conditions: { field: string; operator: QueryOperator; value: any }[],
  sortBy?: { field: string; direction: 'asc' | 'desc' }[],
  limitTo?: number
) {
  try {
    // Create the collection reference
    const collectionRef = createCollectionRef(collectionPath);
    
    // We'll build the query step by step to avoid type issues
    let queryRef = query(collectionRef);
    
    // Add where conditions one by one
    for (const condition of conditions) {
      queryRef = query(queryRef, where(condition.field, condition.operator, condition.value));
    }
    
    // Add orderBy constraints one by one
    if (sortBy && sortBy.length > 0) {
      for (const sort of sortBy) {
        queryRef = query(queryRef, orderBy(sort.field, sort.direction));
      }
    }
    
    // Add limit constraint if specified
    if (limitTo && limitTo > 0) {
      queryRef = query(queryRef, limit(limitTo));
    }
    
    return queryRef;
  } catch (error) {
    console.error(`Error creating query on ${collectionPath}:`, error);
    throw error;
  }
}
