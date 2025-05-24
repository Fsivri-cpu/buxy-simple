import * as React from 'react';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';

// Define a simplified User type to match our custom declaration
type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};
// Göreceli yollarla import işlemleri
import { auth } from '../lib/firebase';
import { useFirebaseStore } from '../store/firebaseStore';

interface AuthContextType {
  user: User | null;
  isInitialized: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isInitialized: false,
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

// Named export
export const FirebaseAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const setFirebaseUser = useFirebaseStore((state: { setUser: (user: User | null) => void }) => state.setUser);

  useEffect(() => {
    console.log('Initializing auth listener');
    
    // Kullanıcı değişikliklerini işleyen fonksiyon
    const handleAuthStateChange = (firebaseUser: FirebaseUser | null) => {
      console.log("Auth state changed:", firebaseUser ? "Signed in" : "Signed out");
      
      // Kullanıcı verilerini basitleştirilmiş User tipine dönüştür
      if (firebaseUser) {
        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        };
        setUser(user);
        setFirebaseUser({
          uid: user.uid,
          email: user.email || ''
        });
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
      
      // Başlatma işleminin tamamlandığını belirt
      setIsInitialized(true);
    };
    
    // Auth durumunu dinleme fonksiyonu
    let unsubscribe: () => void;
    try {
      console.log('Setting up auth state listener');
      
      // Firebase v11.8.0 ile dinamik yaklaşım kullan
      // auth._onAuthStateChanged kullanabiliriz
      if (typeof auth.onAuthStateChanged === 'function') {
        unsubscribe = auth.onAuthStateChanged(handleAuthStateChange);
      } else if (auth._onAuthStateChanged) {
        // Alternatif method
        unsubscribe = auth._onAuthStateChanged(handleAuthStateChange);
      } else {
        // Fallback: auth değişimini izlemek için interval kullan
        console.log('Using interval for auth state detection');
        let lastUser = auth.currentUser;
        const interval = setInterval(() => {
          if (auth.currentUser !== lastUser) {
            lastUser = auth.currentUser;
            handleAuthStateChange(auth.currentUser);
          }
        }, 1000);
        
        unsubscribe = () => clearInterval(interval);
      }
      
      // Başlangıç durumunda auth.currentUser'ı kontrol et
      handleAuthStateChange(auth.currentUser);
    } catch (error) {
      console.error('Failed to set up auth state listener:', error);
      // Hata durumunda bile başlatma işlemini tamamla (yükleme ekranında takılmayı önle)
      setIsInitialized(true);
      // Boş fonksiyon tanımla
      unsubscribe = () => {};
    }

    // Temizleme işlemi
    return () => {
      unsubscribe();
    };
  }, [setFirebaseUser]);

  return <AuthContext.Provider value={{ user, isInitialized, isAuthenticated: !!user }}>{children}</AuthContext.Provider>;
};

// Default export da ekliyoruz, böylece modül importları her iki şekilde de çalışacak
export default FirebaseAuthProvider;
