// Custom type declarations for Firebase Firestore
declare module 'firebase/firestore' {
  export type Timestamp = {
    toDate: () => Date;
    seconds: number;
    nanoseconds: number;
  }

  export type DocumentData = {
    [field: string]: any;
  }
  
  export type QuerySnapshot<T = DocumentData> = {
    docs: QueryDocumentSnapshot<T>[];
    empty: boolean;
    size: number;
    forEach: (callback: (doc: QueryDocumentSnapshot<T>) => void) => void;
  }
  
  export type QueryDocumentSnapshot<T = DocumentData> = {
    id: string;
    data: () => T;
    exists: () => boolean;
    ref: DocumentReference<T>;
  }
  
  export type DocumentSnapshot<T = DocumentData> = {
    id: string;
    data: () => T | undefined;
    exists: () => boolean;
    ref: DocumentReference<T>;
  }
  
  export type DocumentReference<T = DocumentData> = {
    id: string;
    path: string;
    collection: (collectionPath: string) => CollectionReference<T>;
  }
  
  export type CollectionReference<T = DocumentData> = {
    id: string;
    path: string;
    doc: (documentPath?: string) => DocumentReference<T>;
  }

  export function collection(firestore: any, path: string): CollectionReference;
  export function doc(firestore: any, path: string, ...pathSegments: string[]): DocumentReference;
  export function doc(reference: CollectionReference, path?: string): DocumentReference;
  
  export function getDoc<T>(docRef: DocumentReference<T>): Promise<DocumentSnapshot<T>>;
  export function getDocs<T>(query: any): Promise<QuerySnapshot<T>>;
  
  export function setDoc<T>(docRef: DocumentReference<T>, data: T): Promise<void>;
  export function updateDoc<T>(docRef: DocumentReference<T>, data: Partial<T>): Promise<void>;
  
  export function serverTimestamp(): Timestamp;
  export function query(collectionRef: CollectionReference, ...queryConstraints: any[]): any;
  export function where(field: string, opStr: string, value: any): any;
  export function orderBy(field: string, directionStr?: 'asc' | 'desc'): any;
  export function limit(limit: number): any;
}
