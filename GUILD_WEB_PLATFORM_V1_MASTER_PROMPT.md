# 🌐 GUILD v1.0 WEB PLATFORM - MASTER PROMPT

**Project:** Guild v1.0 Web Platform  
**Description:** A full-scale React + Node.js web version of the Guild ecosystem  
**Status:** 🚀 Ready to Build  
**Date:** November 9, 2025

---

## 🎯 PROJECT OVERVIEW

**Goal:** Build the Guild v1.0 Web Platform — a web-based version of the Guild mobile app — fully connected to the existing backend (Node.js + Firebase + PostgreSQL) hosted on Render.

**Role:** Senior Full-Stack Engineer / CTO Assistant  
**Priority:** Accuracy, maintainability, and complete backend integration.

---

## 📋 MASTER RULES

### ✅ DO:
1. ✅ Use **real connections** with existing APIs
2. ✅ **No dummy shells** or placeholder logic
3. ✅ All features must **compile, run, and sync** with backend data
4. ✅ Reuse the same **service layer and naming conventions** from mobile app
5. ✅ **Test each major function** before moving to the next
6. ✅ Keep everything **modular and scalable** for Guild v2.0
7. ✅ **Document every function** in JSDoc style
8. ✅ **Commit each task** in separate branches (`feature/auth`, `feature/chat`, etc.)

### ❌ DON'T:
1. ❌ No temporary variables or placeholders
2. ❌ No unfinished code
3. ❌ No hardcoded data
4. ❌ No skipping tests
5. ❌ No breaking existing backend APIs

---

## 🏗️ ARCHITECTURE OVERVIEW

### Tech Stack:
- **Frontend:** Next.js 15 (App Router) + TypeScript + TailwindCSS + Shadcn UI
- **Backend:** Existing Node.js/Express + Firebase + PostgreSQL (Render)
- **Real-time:** Socket.IO
- **Auth:** Firebase Auth + JWT
- **Payments:** Sadad WebCheckout
- **Deployment:** Vercel (Frontend) + Render (Backend)
- **Domain:** guildapp.net

### Existing Backend:
- **API URL:** `https://guild-yf7q.onrender.com/api`
- **Socket URL:** `https://guild-yf7q.onrender.com`
- **Firebase Project:** `guild-4f46b`

---

## 📦 TASK 1 — PROJECT SETUP

### 1.1 Create Next.js Project
```bash
npx create-next-app@latest guild-web-platform --typescript --tailwind --app --src-dir
cd guild-web-platform
```

### 1.2 Install Dependencies
```bash
npm install \
  axios \
  firebase \
  socket.io-client \
  @prisma/client \
  lucide-react \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-toast \
  next-themes \
  i18next \
  react-i18next \
  next-i18next \
  zod \
  react-hook-form \
  @hookform/resolvers \
  date-fns \
  clsx \
  tailwind-merge
```

### 1.3 Install Dev Dependencies
```bash
npm install -D \
  @types/node \
  @types/react \
  @types/react-dom \
  eslint \
  prettier \
  eslint-config-prettier \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser
```

### 1.4 Configure Environment Variables
Create `.env.local`:
```bash
# Backend API
NEXT_PUBLIC_API_URL=https://guild-yf7q.onrender.com/api
NEXT_PUBLIC_SOCKET_URL=https://guild-yf7q.onrender.com

# Firebase Configuration (from existing mobile app)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD5i6jUePndKyW1AYI0ANrizNpNzGJ6d3w
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=guild-4f46b.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=guild-4f46b
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=guild-4f46b.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=654144998705
NEXT_PUBLIC_FIREBASE_APP_ID=1:654144998705:web:880f16df9efe0ad4853410
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-3F86RQH389

# Sadad Payment
NEXT_PUBLIC_SADAD_MERCHANT_ID=your-merchant-id
NEXT_PUBLIC_SADAD_BASE_URL=https://api.sadad.qa

# Sentry (Error Tracking)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# Environment
NEXT_PUBLIC_ENV=development
```

### 1.5 Configure ESLint + Prettier
Create `.eslintrc.json`:
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "no-console": ["error", { "allow": ["warn", "error"] }],
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

Create `.prettierrc`:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### 1.6 Configure TailwindCSS
Update `tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Guild Brand Colors
        primary: '#BCFF31', // Guild Green
        'primary-dark': '#9FD929',
        'primary-light': '#D4FF6B',
        background: '#000000',
        surface: '#1A1A1A',
        'surface-light': '#2D2D2D',
        border: '#404040',
        'text-primary': '#FFFFFF',
        'text-secondary': '#CCCCCC',
        'text-tertiary': '#808080',
      },
      fontFamily: {
        sans: ['Inter', 'Tajawal', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### ✅ Task 1 Completion Criteria:
- [ ] Next.js project created with TypeScript
- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] ESLint + Prettier configured
- [ ] TailwindCSS configured with Guild theme
- [ ] Dark/Light theme support ready
- [ ] Project compiles without errors

---

## 🧩 TASK 2 — CORE ARCHITECTURE

### 2.1 Create Folder Structure
```bash
mkdir -p src/app/{(auth),(dashboard),(public)}
mkdir -p src/{components,hooks,lib,services,types}
mkdir -p src/locales/{en,ar}
```

### 2.2 Implement API Layer
Create `src/lib/api.ts`:
```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';
import { auth } from './firebase';

/**
 * Axios instance configured for Guild API
 * Automatically adds Firebase Auth token to all requests
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor: Add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const user = auth.currentUser;
        if (user) {
          const token = await user.getIdToken();
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor: Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Redirect to login
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  public get instance(): AxiosInstance {
    return this.client;
  }
}

export const api = new ApiClient().instance;
```

### 2.3 Implement Firebase Configuration
Create `src/lib/firebase.ts`:
```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (only once)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);
export default app;
```

### 2.4 Define Core Types
Create `src/types/index.ts`:
```typescript
/**
 * Core type definitions for Guild Web Platform
 * These types mirror the mobile app and backend schemas
 */

export interface User {
  uid: string;
  email: string;
  name: string;
  phoneNumber?: string;
  avatar?: string;
  bio?: string;
  role: 'freelancer' | 'client' | 'admin';
  rating?: number;
  verified: boolean;
  nationality?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Job {
  id: string;
  clientId: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  currency: 'QAR' | 'USD';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  location?: string;
  skills: string[];
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Wallet {
  userId: string;
  balance: number;
  currency: 'QAR';
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  reason: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  imageUrl?: string;
  fileUrl?: string;
  createdAt: Date;
  read: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: string[];
  supporters: string[];
  stats: {
    matches: number;
    wins: number;
    losses: number;
  };
  funding: number;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'MESSAGE' | 'JOB' | 'PAYMENT' | 'SYSTEM';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}
```

### 2.5 Implement Service Layer
Create `src/services/AuthService.ts`:
```typescript
import { auth } from '@/lib/firebase';
import { api } from '@/lib/api';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { User } from '@/types';

/**
 * Authentication Service
 * Handles login, signup, and session management
 */
export class AuthService {
  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();

    // Verify with backend
    const response = await api.post('/auth/firebase', { token });
    return response.data.user;
  }

  /**
   * Sign up with email and password
   */
  static async signUp(email: string, password: string, name: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();

    // Create user in backend
    const response = await api.post('/auth/signup', {
      token,
      name,
      email,
    });

    return response.data.user;
  }

  /**
   * Sign out
   */
  static async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }

  /**
   * Get current user
   */
  static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  /**
   * Get current user token
   */
  static async getCurrentToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  }
}
```

Create `src/services/UserService.ts`:
```typescript
import { api } from '@/lib/api';
import { User } from '@/types';

/**
 * User Service
 * Handles user profile operations
 */
export class UserService {
  /**
   * Get user profile by ID
   */
  static async getProfile(userId: string): Promise<User> {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    const response = await api.put(`/users/${userId}`, data);
    return response.data;
  }

  /**
   * Search users
   */
  static async searchUsers(query: string): Promise<User[]> {
    const response = await api.get('/users/search', { params: { q: query } });
    return response.data;
  }
}
```

Create `src/services/JobService.ts`:
```typescript
import { api } from '@/lib/api';
import { Job } from '@/types';

/**
 * Job Service
 * Handles job-related operations
 */
export class JobService {
  /**
   * Get all jobs
   */
  static async getJobs(filters?: {
    category?: string;
    status?: string;
    minBudget?: number;
    maxBudget?: number;
  }): Promise<Job[]> {
    const response = await api.get('/jobs', { params: filters });
    return response.data;
  }

  /**
   * Get job by ID
   */
  static async getJob(jobId: string): Promise<Job> {
    const response = await api.get(`/jobs/${jobId}`);
    return response.data;
  }

  /**
   * Create new job
   */
  static async createJob(data: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job> {
    const response = await api.post('/jobs', data);
    return response.data;
  }

  /**
   * Update job
   */
  static async updateJob(jobId: string, data: Partial<Job>): Promise<Job> {
    const response = await api.put(`/jobs/${jobId}`, data);
    return response.data;
  }

  /**
   * Delete job
   */
  static async deleteJob(jobId: string): Promise<void> {
    await api.delete(`/jobs/${jobId}`);
  }
}
```

Create `src/services/WalletService.ts`:
```typescript
import { api } from '@/lib/api';
import { Wallet, Transaction } from '@/types';

/**
 * Wallet Service
 * Handles wallet and payment operations
 */
export class WalletService {
  /**
   * Get wallet balance
   */
  static async getBalance(userId: string): Promise<Wallet> {
    const response = await api.get(`/wallet/balance/${userId}`);
    return response.data;
  }

  /**
   * Get transaction history
   */
  static async getTransactions(userId: string): Promise<Transaction[]> {
    const response = await api.get(`/wallet/history/${userId}`);
    return response.data;
  }

  /**
   * Initiate wallet top-up
   */
  static async initiateTopUp(amount: number): Promise<{ paymentUrl: string }> {
    const response = await api.post('/wallet/topup', { amount });
    return response.data;
  }
}
```

Create `src/services/ChatService.ts`:
```typescript
import { api } from '@/lib/api';
import { Chat, Message } from '@/types';
import { io, Socket } from 'socket.io-client';

/**
 * Chat Service
 * Handles real-time chat operations
 */
export class ChatService {
  private static socket: Socket | null = null;

  /**
   * Initialize Socket.IO connection
   */
  static initSocket(token: string): Socket {
    if (this.socket) return this.socket;

    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: { token },
      transports: ['websocket'],
    });

    return this.socket;
  }

  /**
   * Get user chats
   */
  static async getChats(userId: string): Promise<Chat[]> {
    const response = await api.get(`/chats/user/${userId}`);
    return response.data;
  }

  /**
   * Get chat messages
   */
  static async getMessages(chatId: string): Promise<Message[]> {
    const response = await api.get(`/chats/${chatId}/messages`);
    return response.data;
  }

  /**
   * Send message
   */
  static async sendMessage(chatId: string, text: string): Promise<Message> {
    const response = await api.post(`/chats/${chatId}/messages`, { text });
    return response.data;
  }

  /**
   * Disconnect socket
   */
  static disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
```

### ✅ Task 2 Completion Criteria:
- [ ] Folder structure created
- [ ] API client with JWT interceptor implemented
- [ ] Firebase configuration complete
- [ ] Core types defined
- [ ] All service classes implemented
- [ ] Services mirror mobile app logic
- [ ] No compilation errors

---

## 🔐 TASK 3 — AUTHENTICATION SYSTEM

### 3.1 Create Auth Context
Create `src/contexts/AuthContext.tsx`:
```typescript
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { User } from '@/types';
import { AuthService } from '@/services/AuthService';
import { UserService } from '@/services/UserService';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        try {
          const userData = await UserService.getProfile(firebaseUser.uid);
          setUser(userData);
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const userData = await AuthService.signIn(email, password);
    setUser(userData);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const userData = await AuthService.signUp(email, password, name);
    setUser(userData);
  };

  const signOut = async () => {
    await AuthService.signOut();
    setUser(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### 3.2 Create Protected Route Middleware
Create `src/middleware.ts`:
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if user is authenticated (you can implement your own logic)
  const isAuthenticated = request.cookies.has('auth-token');

  // Protected routes
  const protectedRoutes = ['/dashboard', '/chat', '/wallet', '/teams', '/profile'];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### 3.3 Create Login Page
Create `src/app/(auth)/login/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8 bg-surface rounded-lg">
        <div>
          <h2 className="text-3xl font-bold text-center text-primary">Guild</h2>
          <p className="mt-2 text-center text-text-secondary">Sign in to your account</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="text-center">
            <Link href="/register" className="text-primary hover:text-primary-light">
              Don't have an account? Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 3.4 Create Register Page
Create `src/app/(auth)/register/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, name);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8 bg-surface rounded-lg">
        <div>
          <h2 className="text-3xl font-bold text-center text-primary">Guild</h2>
          <p className="mt-2 text-center text-text-secondary">Create your account</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-primary">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-text-primary"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>

          <div className="text-center">
            <Link href="/login" className="text-primary hover:text-primary-light">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### ✅ Task 3 Completion Criteria:
- [ ] Auth context implemented
- [ ] Protected route middleware configured
- [ ] Login page created and functional
- [ ] Register page created and functional
- [ ] Session persistence working
- [ ] Redirect to /dashboard after login
- [ ] Redirect to /login if unauthenticated
- [ ] Firebase Auth tokens verified with backend

---

## 🧭 TASK 4 — ROUTING & NAVIGATION

### 4.1 Create Root Layout
Create `src/app/layout.tsx`:
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from 'next-themes';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Guild - Freelance Marketplace',
  description: 'Connect with freelancers and clients in Qatar and GCC',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 4.2 Create Dashboard Layout
Create `src/app/(dashboard)/layout.tsx`:
```typescript
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-primary text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
```

### 4.3 Create Sidebar Component
Create `src/components/Sidebar.tsx`:
```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Briefcase,
  MessageSquare,
  Wallet,
  Users,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/teams', label: 'Teams', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <aside className="w-64 bg-surface border-r border-border min-h-screen p-4">
      <div className="flex items-center gap-2 mb-8">
        <div className="text-2xl font-bold text-primary">Guild</div>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-black'
                  : 'text-text-secondary hover:bg-surface-light hover:text-text-primary'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-text-secondary hover:bg-surface-light hover:text-text-primary w-full"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </nav>
    </aside>
  );
}
```

### 4.4 Create Navbar Component
Create `src/components/Navbar.tsx`:
```typescript
'use client';

import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="bg-surface border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary" size={20} />
            <input
              type="text"
              placeholder="Search jobs, users, teams..."
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 hover:bg-surface-light rounded-lg transition-colors">
            <Bell size={20} className="text-text-secondary" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-black font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-text-primary">{user?.name}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
```

### ✅ Task 4 Completion Criteria:
- [ ] Root layout with providers configured
- [ ] Dashboard layout with sidebar and navbar
- [ ] Sidebar component with navigation
- [ ] Navbar component with search and notifications
- [ ] Responsive design (sidebar collapses on mobile)
- [ ] Active route highlighting
- [ ] All routes accessible

---

## 📝 REMAINING TASKS (5-13)

Due to length constraints, the remaining tasks (5-13) follow the same detailed structure:

- **TASK 5:** Feed System (Main Dashboard)
- **TASK 6:** Profiles & Teams
- **TASK 7:** Wallet & Coins System
- **TASK 8:** Chat & Notifications
- **TASK 9:** Global Notifications & Settings
- **TASK 10:** Internationalization (Arabic/English)
- **TASK 11:** SEO & Performance
- **TASK 12:** Security & Production Setup
- **TASK 13:** Testing & QA

Each task includes:
- Detailed implementation steps
- Code examples
- Completion criteria
- Testing requirements

---

## 🎯 FINAL REQUIREMENTS

### Code Quality:
- ✅ **JSDoc comments** for all functions
- ✅ **TypeScript strict mode** enabled
- ✅ **ESLint** passing with no warnings
- ✅ **Prettier** formatted code
- ✅ **No console.log** in production

### Architecture:
- ✅ **Modular and scalable** for Guild v2.0
- ✅ **Reusable components**
- ✅ **Service layer** mirrors mobile app
- ✅ **Type-safe** throughout

### Testing:
- ✅ **Unit tests** for services (Jest)
- ✅ **Integration tests** for critical flows
- ✅ **E2E tests** for user journeys
- ✅ **CI/CD** with GitHub Actions

### Deployment:
- ✅ **Frontend:** Vercel
- ✅ **Backend:** Render (existing)
- ✅ **Domain:** guildapp.net
- ✅ **SSL:** Enabled

### Git Workflow:
- ✅ **Feature branches** for each task
- ✅ **Pull requests** for code review
- ✅ **Conventional commits**
- ✅ **Protected main branch**

---

## 📊 PROJECT TIMELINE

### Phase 1: Foundation (Week 1-2)
- Tasks 1-4: Setup, Architecture, Auth, Routing

### Phase 2: Core Features (Week 3-4)
- Tasks 5-7: Feed, Profiles, Wallet

### Phase 3: Communication (Week 5)
- Tasks 8-9: Chat, Notifications

### Phase 4: Polish (Week 6)
- Tasks 10-11: i18n, SEO, Performance

### Phase 5: Launch (Week 7-8)
- Tasks 12-13: Security, Testing, Deployment

---

## ✅ SUCCESS CRITERIA

### Before Launch:
- [ ] All 13 tasks completed
- [ ] All tests passing
- [ ] Lighthouse score ≥ 90
- [ ] Security audit passed
- [ ] Load testing passed
- [ ] Mobile responsive
- [ ] RTL support working
- [ ] Backend fully integrated
- [ ] No console errors
- [ ] Production deployed

---

**Project Status:** 🚀 Ready to Build  
**Last Updated:** November 9, 2025  
**Version:** 1.0  
**Maintainer:** Guild Engineering Team


