// Custom type declarations for Firebase Auth
declare module 'firebase/auth' {
  export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  }

  export function onAuthStateChanged(
    auth: any,
    callback: (user: User | null) => void
  ): () => void;

  export function signOut(auth: any): Promise<void>;
  export function signInWithEmailAndPassword(auth: any, email: string, password: string): Promise<any>;
  export function createUserWithEmailAndPassword(auth: any, email: string, password: string): Promise<any>;
}
