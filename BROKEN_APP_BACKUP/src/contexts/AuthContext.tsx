import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { auth } from '@/config/firebase';
import { User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
  onReady?: () => void;
}

export default function AuthProvider({ children, onReady }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle null auth (when Firebase is bypassed on Android)
    if (!auth) {
      console.log('🔥 AuthProvider: Auth is null, setting anonymous user');
      setUser(null);
      setLoading(false);
      if (onReady) {
        onReady();
      }
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (onReady) {
        onReady();
      }
    });

    return unsubscribe;
  }, [onReady]);

  const signIn = async () => {
    if (!auth) {
      console.log('🔥 AuthProvider: Auth is null, cannot sign in');
      return;
    }
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const signOut = async () => {
    if (!auth) {
      console.log('🔥 AuthProvider: Auth is null, cannot sign out');
      return;
    }
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

