import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../utils/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';

interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: string[];
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthorized: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Admin permissions
const PERMISSIONS = {
  SUPER_ADMIN: ['*'], // All permissions
  ADMIN: [
    'users.read',
    'users.write',
    'users.delete',
    'guilds.read',
    'guilds.write',
    'jobs.read',
    'jobs.write',
    'jobs.delete',
    'analytics.read',
    'reports.read',
    'system.read',
  ],
  MODERATOR: [
    'users.view',
    'users.ban',
    'guilds.view',
    'jobs.view',
    'jobs.edit',
    'reports.view',
  ],
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for dev bypass - ONLY in development mode
    const isDevelopment = process.env.NODE_ENV === 'development' && 
                          process.env.REACT_APP_ENABLE_DEV_MODE === 'true';
    const devBypass = localStorage.getItem('devBypass') === 'true';
    
    if (devBypass && isDevelopment) {
      // Dev bypass - create mock super admin user
      console.warn('⚠️ DEV BYPASS ACTIVE: Using mock super admin user');
      console.warn('⚠️ This should NEVER be enabled in production!');
      setUser({
        uid: 'dev-bypass-user',
        email: 'dev@guild.admin',
        displayName: 'Dev Admin (Bypass)',
        role: 'super_admin',
        permissions: PERMISSIONS.SUPER_ADMIN,
      });
      setLoading(false);
      return;
    } else if (devBypass && !isDevelopment) {
      // Clear dev bypass if not in development mode
      console.error('🔒 Dev bypass attempted in non-development mode. Clearing...');
      localStorage.removeItem('devBypass');
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Check if user is admin
          const idTokenResult = await firebaseUser.getIdTokenResult();
          const role = (idTokenResult.claims.role as string) || 'moderator';
          
          // Only allow admin users
          if (['super_admin', 'admin', 'moderator'].includes(role)) {
            const normalizedRole = role.toUpperCase() as keyof typeof PERMISSIONS;
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || null,
              displayName: firebaseUser.displayName || null,
              role: role as AdminUser['role'],
              permissions: PERMISSIONS[normalizedRole] || PERMISSIONS.MODERATOR, // Default to moderator permissions
            });
          } else {
            // Not an admin, sign them out
            await firebaseSignOut(auth);
            setUser(null);
          }
        } catch (error) {
          console.error('Error checking user role:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Check admin claims
      const idTokenResult = await result.user.getIdTokenResult();
      const role = idTokenResult.claims.role as string;
      
      if (!role || !['super_admin', 'admin', 'moderator'].includes(role)) {
        await firebaseSignOut(auth);
        setLoading(false);
        throw new Error('🔒 Access denied. Admin privileges required.');
      }
      
      // User will be set by onAuthStateChanged listener
    } catch (error: any) {
      console.error('Sign in error:', error);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clear dev bypass
      localStorage.removeItem('devBypass');
      
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      localStorage.removeItem('devBypass');
      setUser(null);
    }
  };

  const isAuthorized = (permission: string): boolean => {
    if (!user) return false;
    if (user.permissions.includes('*')) return true; // Super admin
    return user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, isAuthorized }}>
      {children}
    </AuthContext.Provider>
  );
};

