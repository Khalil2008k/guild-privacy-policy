# 🏗️ GUILD - COMPLETE SYSTEM ARCHITECTURE DOCUMENTATION

**Document Version:** 1.0.0  
**Generated:** October 2025  
**Status:** Production-Ready System  
**Purpose:** Complete architectural reference for full-stack development

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [UI/UX System](#3-uiux-system)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Database & Storage](#6-database--storage)
7. [Payment & Wallet System](#7-payment--wallet-system)
8. [Security & Access Control](#8-security--access-control)
9. [Real-time Features](#9-real-time-features)
10. [AI & Automation](#10-ai--automation)
11. [Scalability & DevOps](#11-scalability--devops)
12. [API Structure](#12-api-structure)
13. [User Journeys](#13-user-journeys)

---

## 1. EXECUTIVE SUMMARY

### 1.1 What is GUILD?

**GUILD** is a full-scale freelance and micro-job marketplace platform designed specifically for the Qatar market, featuring:

- **Freelance Marketplace**: Job posting, matching, and completion system (like Fiverr/Freelancer)
- **Guild System**: Team collaboration with hierarchical roles (Guild Master, Vice Master, Members)
- **Coin-Based Economy**: Internal currency (Guild Coins) for all transactions
- **Qatar Payment Integration**: Fatora PSP integration for local payments
- **AI-Powered Features**: Job matching, proposal generation, fraud detection
- **Full RTL Support**: Arabic/English bilingual interface

### 1.2 Business Model

```
Job Payment Flow:
├── Client pays: 105% upfront (100% + 5% platform buffer)
├── PSP fee: 2.5% (deducted from platform revenue)
├── Platform gross: 12.5% (success) / 5% (failure)
├── Platform net: ~10% (after PSP deduction)
├── Freelancer: 90% (success) / 0% (failure)
└── Client refund: 0% (success) / 100% (failure)

Optional Features:
├── Zakat: 2.5% from freelancer's earnings (Qatar compliance)
└── Job promotions: Featured (50 coins), Boost (100 coins)
```

### 1.3 Technology Stack Summary

```
Frontend:
├── React Native (Expo SDK 54)
├── TypeScript 5.9.2
├── Expo Router (file-based routing)
├── NativeWind 4.2.1 (Tailwind CSS)
└── React Context API (state management)

Backend:
├── Node.js 20.19.4 + Express
├── TypeScript 5.3.3
├── Firebase Admin SDK
└── Socket.IO (real-time)

Database:
├── Firebase Firestore (primary - real-time data)
├── Firebase Storage (files, images)
└── Firebase Auth (authentication)

Cloud Services:
├── Firebase (Auth, Firestore, Storage, Functions)
├── Render.com (backend hosting)
├── EAS Build (mobile app builds)
└── App Store Connect / Google Play Console
```

---

## 2. SYSTEM OVERVIEW

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GUILD PLATFORM ECOSYSTEM                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐    ┌──────────────────┐                │
│  │   MOBILE APP    │───▶│  BACKEND API    │                │
│  │  (React Native) │    │  (Node.js/Expr) │                │
│  │                  │◀───│                  │                │
│  │  iOS / Android  │    │  Render.com     │                │
│  └──────────────────┘    └────────┬─────────┘                │
│         │                         │                          │
│         │ Socket.IO               │ REST/GraphQL            │
│         │                         │                          │
│         ▼                         ▼                          │
│  ┌──────────────────┐    ┌──────────────────┐               │
│  │   FIREBASE       │    │   PSP (Fatora)   │               │
│  │                  │    │                  │               │
│  │ • Auth           │    │ • Payments       │               │
│  │ • Firestore      │    │ • Webhooks       │               │
│  │ • Storage        │    │ • Refunds        │               │
│  │ • Functions     │    └──────────────────┘               │
│  │ • Messaging      │                                         │
│  └──────────────────┘                                         │
│                                                               │
│  ┌──────────────────┐                                         │
│  │  ADMIN PORTAL    │  (Future: React Web)                   │
│  │  (Web Interface) │                                         │
│  └──────────────────┘                                         │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Component Architecture

```
GUILD Platform
│
├── Mobile App (React Native/Expo)
│   ├── Screens (100+ screens)
│   ├── Components (40+ reusable components)
│   ├── Contexts (8 context providers)
│   ├── Services (30+ business logic services)
│   └── Utils (20+ utility modules)
│
├── Backend API (Node.js/Express)
│   ├── Routes (40+ route modules)
│   ├── Services (90+ business logic services)
│   ├── Middleware (15+ middleware modules)
│   ├── Sockets (real-time handlers)
│   └── Utils (10+ utility modules)
│
├── Firebase Services
│   ├── Authentication
│   ├── Firestore (real-time database)
│   ├── Storage (file uploads)
│   ├── Functions (scheduled tasks)
│   └── Messaging (push notifications)
│
└── Admin Portal (Future)
    └── Web Dashboard (React)
```

---

## 3. UI/UX SYSTEM

### 3.1 Design Philosophy

**Core Principles:**
- **Dark-first design**: Primary theme is dark mode with black (#000000) backgrounds
- **Neon Green Accent**: Brand color #BCFF31 (neon green) for CTAs and highlights
- **Minimal & Modern**: Clean interfaces with focus on content
- **Accessibility**: WCAG 2.1 AA compliance, screen reader support
- **RTL Support**: Full Arabic/English bidirectional support

### 3.2 Color Palette

#### Dark Mode (Primary)
```typescript
{
  background: '#000000',           // Pure black - main screens
  surface: '#1A1A1A',             // Dark gray - cards, modals
  surfaceSecondary: '#2D2D2D',    // Lighter gray - elevated surfaces
  textPrimary: '#FFFFFF',         // Pure white - primary text
  textSecondary: '#999999',       // Gray - secondary text
  border: '#333333',              // Subtle borders
  primary: '#BCFF31',             // Neon green - brand color
  success: '#10B981',             // Green
  warning: '#F59E0B',             // Orange
  error: '#EF4444',               // Red
  info: '#3B82F6'                // Blue
}
```

#### Light Mode (Secondary)
```typescript
{
  background: '#FAFAFA',          // Soft off-white
  surface: '#FFFFFF',             // Pure white
  surfaceSecondary: '#F5F5F5',     // Light gray
  textPrimary: '#1C1B1F',         // Near black (soft)
  textSecondary: '#49454F',       // Medium gray
  border: '#E6E1E5',              // Soft border
  primary: '#BCFF31',             // Same neon green
  // Status colors are darker for contrast
}
```

### 3.3 Typography

**Font Family:** Signika Negative SC
- **Primary Font**: Signika Negative (Google Fonts)
- **Fallback**: System fonts (San Francisco, Roboto)

**Font Scale:**
```
Display: 32px / 2rem (large headings)
H1: 24px / 1.5rem (page titles)
H2: 20px / 1.25rem (section titles)
H3: 18px / 1.125rem (subsection)
Body: 16px / 1rem (primary text)
Small: 14px / 0.875rem (secondary text)
Caption: 12px / 0.75rem (labels)
```

### 3.4 Spacing & Layout

**Spacing Scale:**
```
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 20px
xxl: 24px
xxxl: 32px
```

**Border Radius:**
```
sm: 8px
md: 12px
lg: 16px
xl: 20px
xxl: 24px
round: 9999px (pill shape)
```

### 3.5 Screen Inventory

#### Authentication Flow (21 screens)
```
splash.tsx → onboarding/1-3.tsx → welcome.tsx
  → sign-in.tsx / sign-up.tsx
  → phone-verification.tsx / email-verification.tsx
  → two-factor-setup.tsx / biometric-setup.tsx
  → profile-completion.tsx
  → welcome-tutorial.tsx
```

#### Main App Screens (7 screens)
```
(main)/
  ├── home.tsx        # Main dashboard
  ├── jobs.tsx        # Job listings
  ├── profile.tsx     # User profile
  ├── chat.tsx        # Chat/messaging
  ├── map.tsx         # Map view
  ├── post.tsx        # Post/explore
  └── search.tsx      # Search functionality
```

#### Modal Screens (89+ screens)
```
(modals)/
  ├── Job Management (19 screens)
  │   ├── add-job.tsx
  │   ├── job/[id].tsx
  │   ├── my-jobs.tsx
  │   └── ...
  │
  ├── Guild System (12 screens)
  │   ├── guild-map.tsx
  │   ├── create-guild.tsx
  │   ├── guild/[id].tsx
  │   └── ...
  │
  ├── Wallet & Payments (15 screens)
  │   ├── wallet.tsx
  │   ├── coin-store.tsx
  │   ├── payment-methods.tsx
  │   └── ...
  │
  ├── Chat & Communication (8 screens)
  │   ├── chat/[jobId].tsx
  │   ├── chat-list.tsx
  │   └── ...
  │
  ├── Profile & Settings (20 screens)
  │   ├── profile-edit.tsx
  │   ├── settings.tsx
  │   ├── security-center.tsx
  │   └── ...
  │
  └── Admin & System (15 screens)
      ├── admin-dashboard.tsx
      ├── diagnostics.tsx
      └── ...
```

### 3.6 Navigation Flow

```
Bottom Tab Navigation (Always Visible):
├── Home (/(main)/home)
├── Jobs (/(main)/jobs)
├── Post (/(main)/post)
├── Profile (/(main)/profile)
└── Chat (/(main)/chat)

Modal Stack:
├── Job Details → chat/[jobId]
├── Profile → profile-edit
├── Wallet → coin-store → payment-methods
└── Settings → security-center → identity-verification
```

### 3.7 Interaction Patterns

**Gestures:**
- **Swipe**: Delete messages, archive items
- **Pull to Refresh**: Lists, feeds
- **Long Press**: Context menus
- **Double Tap**: Quick actions

**Animations:**
- **Page Transitions**: 300ms slide animations
- **Modal**: 250ms fade + slide
- **Buttons**: 150ms scale feedback
- **Loading**: Skeleton screens + spinners

---

## 4. FRONTEND ARCHITECTURE

### 4.1 Technology Stack

```
React Native (Expo SDK 54)
├── Core Framework
│   ├── React 19.1.0
│   ├── React Native 0.81.5
│   └── TypeScript 5.9.2
│
├── Navigation
│   ├── Expo Router 6.0.14 (file-based)
│   └── React Navigation 7.1.6
│
├── Styling
│   ├── NativeWind 4.2.1 (Tailwind CSS)
│   └── React Native StyleSheet
│
├── State Management
│   ├── React Context API (8 contexts)
│   ├── React Query (@tanstack/react-query)
│   └── AsyncStorage (persistence)
│
├── Real-time
│   ├── Firebase 12.3.0 (Firestore listeners)
│   └── Socket.IO Client 4.8.1
│
└── Utilities
    ├── i18next (internationalization)
    ├── Expo Secure Store (secure storage)
    └── Expo Notifications (push notifications)
```

### 4.2 Project Structure

```
GUILD-3/src/
├── app/                          # Expo Router screens
│   ├── (auth)/                   # Authentication screens
│   ├── (main)/                   # Main app screens (tabs)
│   ├── (modals)/                 # Modal screens
│   └── screens/                 # Additional screens
│
├── components/                   # Reusable UI components
│   ├── Button.tsx
│   ├── ChatMessage.tsx
│   ├── JobCard.tsx
│   ├── CustomAlert.tsx
│   └── ...
│
├── contexts/                     # State management
│   ├── AuthContext.tsx           # Authentication state
│   ├── UserProfileContext.tsx    # User profile data
│   ├── ChatContext.tsx           # Chat state
│   ├── GuildContext.tsx          # Guild state
│   ├── ThemeContext.tsx          # Theme (dark/light)
│   ├── I18nProvider.tsx          # Internationalization
│   └── ...
│
├── services/                      # Business logic
│   ├── jobService.ts             # Job operations
│   ├── chatService.ts            # Chat operations
│   ├── walletService.ts          # Wallet operations
│   ├── guildService.ts           # Guild operations
│   ├── firebaseSMSService.ts     # SMS authentication
│   └── ...
│
├── config/                        # Configuration
│   ├── firebase.tsx              # Firebase setup
│   ├── backend.ts                # Backend API client
│   └── environment.ts            # Environment variables
│
├── utils/                         # Utilities
│   ├── globalStyles.ts          # Global styles
│   ├── validation.ts             # Form validation
│   ├── timeFormatter.ts          # Date/time formatting
│   └── ...
│
└── locales/                       # Translations
    ├── en.json                    # English
    └── ar.json                    # Arabic
```

### 4.3 State Management Architecture

```
Context Layer:
├── AuthContext
│   ├── user: User | null
│   ├── loading: boolean
│   ├── signIn(email, password)
│   ├── signOut()
│   └── sendPhoneVerification(phone)
│
├── UserProfileContext
│   ├── profile: UserProfile
│   ├── updateProfile(data)
│   └── refreshProfile()
│
├── ChatContext
│   ├── chats: Chat[]
│   ├── messages: Map<chatId, Message[]>
│   ├── sendMessage(chatId, text)
│   └── markAsRead(chatId)
│
├── GuildContext
│   ├── guilds: Guild[]
│   ├── currentGuild: Guild | null
│   ├── createGuild(data)
│   └── joinGuild(guildId)
│
└── ThemeContext
    ├── isDarkMode: boolean
    ├── theme: ThemeColors
    └── toggleTheme()
```

### 4.4 Component Architecture

**Component Hierarchy:**
```
App
├── _layout.tsx (Root Layout)
│   ├── AuthProvider
│   ├── ThemeProvider
│   ├── I18nProvider
│   └── NavigationContainer
│
├── (auth)/_layout.tsx
│   └── Auth screens stack
│
├── (main)/_layout.tsx
│   └── Tab Navigator
│       ├── Home
│       ├── Jobs
│       ├── Post
│       ├── Profile
│       └── Chat
│
└── (modals)/_layout.tsx
    └── Modal Stack Navigator
```

**Reusable Components:**
- **Button**: Primary, Secondary, Text variants
- **Input**: Text, Password, Search with validation
- **Card**: JobCard, GuildCard, UserCard
- **Alert**: CustomAlert (replaces system alerts)
- **Modal**: SafeModal with keyboard handling
- **Loading**: LoadingSpinner, SkeletonScreen
- **Chat**: ChatMessage, ChatInput, ChatBubble

### 4.5 Routing System

**File-based Routing (Expo Router):**
```
app/
├── index.tsx              → / (root - redirects)
├── (auth)/
│   └── splash.tsx        → /splash
├── (main)/
│   ├── home.tsx          → /home
│   └── jobs.tsx          → /jobs
└── (modals)/
    ├── add-job.tsx       → /add-job (modal)
    └── job/
        └── [id].tsx      → /job/:id (dynamic)
```

**Navigation Patterns:**
```typescript
// Push to stack
router.push('/job/123');

// Replace current
router.replace('/home');

// Open modal
router.push('/(modals)/add-job');

// Go back
router.back();
```

---

## 5. BACKEND ARCHITECTURE

### 5.1 Technology Stack

```
Node.js 20.19.4 + Express
├── Language: TypeScript 5.3.3
├── Framework: Express 4.18.2
├── Database: Firebase Admin SDK
├── Real-time: Socket.IO 4.7.4
├── Validation: Zod 3.25.76
├── Authentication: Firebase Admin Auth
└── Logging: Winston 3.11.0
```

### 5.2 Project Structure

```
backend/src/
├── server.ts                    # Express app entry
├── routes/                      # API route handlers
│   ├── auth.ts                 # Authentication
│   ├── jobs.ts                  # Job management
│   ├── users.ts                 # User management
│   ├── guilds.ts                # Guild operations
│   ├── payments.ts              # Payment endpoints
│   ├── chat.ts                  # Chat endpoints
│   ├── notifications.ts        # Push notifications
│   ├── coin.routes.ts           # Coin system
│   └── ...
│
├── services/                     # Business logic
│   ├── JobService.ts
│   ├── UserService.ts
│   ├── GuildService.ts
│   ├── PaymentService.ts
│   ├── CoinService.ts
│   ├── CoinJobService.ts
│   ├── CoinPurchaseService.ts
│   ├── ChatService.ts
│   ├── NotificationService.ts
│   ├── EnhancedJobEvaluationService.ts (AI)
│   └── ...
│
├── middleware/                   # Request middleware
│   ├── auth.ts                  # JWT validation
│   ├── firebaseAuth.ts          # Firebase token verify
│   ├── adminAuth.ts             # Admin access
│   ├── rateLimiting.ts          # Rate limiting
│   ├── errorHandler.ts          # Error handling
│   └── validation.ts            # Request validation
│
├── sockets/                      # Socket.IO handlers
│   ├── chat-handler.ts
│   └── notification-handler.ts
│
├── config/                       # Configuration
│   ├── firebase.ts              # Firebase Admin
│   ├── environment.ts           # Environment vars
│   └── redis.ts                 # Redis client
│
└── utils/                        # Utilities
    ├── logger.ts                # Winston logger
    ├── errors.ts                # Error classes
    └── circuitBreaker.ts         # Circuit breaker
```

### 5.3 API Architecture

**RESTful API Design:**
```
/api/v1/
├── auth/
│   ├── POST /signin
│   ├── POST /signup
│   ├── POST /sms/send
│   └── POST /sms/verify
│
├── jobs/
│   ├── GET /                  # List jobs
│   ├── POST /                 # Create job
│   ├── GET /:id               # Get job
│   ├── PUT /:id                # Update job
│   ├── POST /:id/apply        # Apply to job
│   └── POST /:id/complete     # Mark complete
│
├── users/
│   ├── GET /:id                # Get user
│   ├── PUT /:id                # Update user
│   └── GET /:id/wallet        # Get wallet
│
├── guilds/
│   ├── GET /                   # List guilds
│   ├── POST /                  # Create guild
│   ├── GET /:id                # Get guild
│   ├── POST /:id/join          # Join guild
│   └── POST /:id/jobs/:jobId/assign  # Assign job
│
├── coins/
│   ├── GET /catalog            # Coin catalog
│   ├── GET /wallet             # User wallet
│   ├── POST /purchase          # Buy coins
│   ├── POST /job/pay           # Pay for job
│   └── POST /withdrawal        # Withdraw coins
│
└── payments/
    ├── POST /initiate           # Start payment
    ├── POST /webhook/fatora    # Fatora webhook
    └── GET /history            # Payment history
```

### 5.4 Service Layer Pattern

**Dependency Injection Container:**
```typescript
// container/DIContainer.ts
class DIContainer {
  private services = new Map();
  
  register(name: string, factory: Function) {
    this.services.set(name, factory);
  }
  
  get(name: string) {
    const factory = this.services.get(name);
    return factory ? factory() : null;
  }
}
```

**Service Examples:**
```typescript
// JobService
class JobService {
  async createJob(data: CreateJobData): Promise<Job> {
    // Validation
    // Create in Firestore
    // Send notifications
    // Return job
  }
  
  async applyToJob(jobId: string, userId: string): Promise<void> {
    // Check job status
    // Create application
    // Notify job owner
  }
}

// CoinService
class CoinService {
  async selectCoins(amount: number, wallet: Wallet): Promise<CoinSelection> {
    // Algorithm to select best coin combination
    // Return coin selection
  }
}
```

---

## 6. DATABASE & STORAGE

### 6.1 Firebase Firestore Schema

**Collections:**
```
users/{userId}
├── profile data
├── wallet balance
├── preferences
└── statistics

jobs/{jobId}
├── job details
├── clientId
├── freelancerId
├── status
├── budget
└── applications/{applicationId}

guilds/{guildId}
├── guild info
├── masterId
├── members/{memberId}
├── jobs/{jobId}
└── vault (daily earnings)

chats/{chatId}
├── participants
├── type (direct/guild)
└── messages/{messageId}

wallets/{userId}
├── balances (coin inventory)
├── transactions/{transactionId}
└── escrows/{escrowId}

ledger (append-only)
├── entryId
├── type
├── amount
├── timestamp
└── metadata
```

### 6.2 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthed() { return request.auth != null; }
    function isOwner(userId) { 
      return isAuthed() && request.auth.uid == userId; 
    }
    
    // Users: own profile
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Jobs: authenticated read, owner write
    match /jobs/{jobId} {
      allow read: if isAuthed();
      allow write: if isAuthed() && 
        (request.resource.data.clientId == request.auth.uid ||
         resource.data.clientId == request.auth.uid);
    }
    
    // Chats: participants only
    match /chats/{chatId} {
      allow read, write: if isAuthed() && 
        request.auth.uid in resource.data.participants;
      
      match /messages/{messageId} {
        allow read, write: if isAuthed() && 
          request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
      }
    }
    
    // Wallets: own wallet only
    match /wallets/{userId} {
      allow read, write: if isOwner(userId);
    }
  }
}
```

### 6.3 Firebase Storage

**Bucket Structure:**
```
gs://guild-4f46b.firebasestorage.app/
├── profile-pictures/{userId}.jpg
├── job-images/{jobId}/{imageId}.jpg
├── chat-media/{chatId}/{messageId}/{file}
├── contracts/{jobId}/contract.pdf
└── receipts/{transactionId}/receipt.pdf
```

**Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-pictures/{userId}.jpg {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /job-images/{jobId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 7. PAYMENT & WALLET SYSTEM

### 7.1 Guild Coin System

**Coin Types:**
```
GBC (Guild Bronze Coin): 1 QAR
GSC (Guild Silver Coin): 5 QAR
GGC (Guild Gold Coin): 10 QAR
GPC (Guild Platinum Coin): 50 QAR
GDC (Guild Diamond Coin): 100 QAR
GRC (Guild Royal Coin): 500 QAR
```

**Coin Purchase Flow:**
```
1. User selects coin pack in Coin Store
2. Calculate price (coins + 10% markup)
3. Create payment intent → Fatora
4. User completes payment on Fatora
5. Fatora sends webhook to backend
6. Backend validates payment
7. Issue coins to user wallet (atomic)
8. Create ledger entry
9. Send notification
10. Show receipt
```

### 7.2 Escrow System

**Job Payment Flow:**
```
1. Freelancer accepts job → Client pays
2. Coins locked in escrow (deducted from client wallet)
3. Escrow status: "locked"
4. Freelancer completes work
5. Client approves → Escrow releases:
   ├── 90% to freelancer wallet
   └── 10% to platform vault
6. Escrow status: "released"
7. Create transaction records
8. Send notifications
```

**Dispute Flow:**
```
1. Either party raises dispute
2. Escrow status: "disputed"
3. Admin reviews dispute
4. Admin resolution:
   ├── Release to freelancer (90%/10% split)
   ├── Refund to client (100%)
   └── Partial split (custom percentages)
5. Escrow status: "resolved"
```

### 7.3 PSP Integration (Fatora)

**Payment Flow:**
```
Client → App → Backend API
  ↓
Backend creates Fatora session
  ↓
Backend returns payment URL
  ↓
App opens Fatora WebView
  ↓
User completes payment
  ↓
Fatora redirects to returnUrl (deeplink)
  ↓
App handles deeplink
  ↓
Fatora sends webhook to backend
  ↓
Backend validates webhook signature
  ↓
Backend processes payment
  ↓
Backend issues coins / updates escrow
```

**Webhook Handler:**
```typescript
POST /api/payments/webhook/fatora
├── Verify signature
├── Check idempotency
├── Validate payment status
├── Process payment:
│   ├── Coin purchase → Issue coins
│   ├── Job payment → Lock escrow
│   └── Withdrawal → Transfer to bank
└── Return 200 OK
```

### 7.4 Wallet Operations

**Wallet Structure:**
```typescript
interface Wallet {
  userId: string;
  balances: {
    GBC: number;
    GSC: number;
    GGC: number;
    GPC: number;
    GDC: number;
    GRC: number;
  };
  totalQARValue: number;
  transactions: Transaction[];
  escrows: Escrow[];
}
```

**Transaction Types:**
- `coin_purchase`: User bought coins
- `escrow_lock`: Coins locked for job
- `escrow_release`: Coins released after completion
- `escrow_refund`: Coins refunded to client
- `withdrawal_request`: User requested withdrawal
- `withdrawal_complete`: Withdrawal processed

---

## 8. SECURITY & ACCESS CONTROL

### 8.1 Authentication System

**Firebase Authentication:**
```
Methods:
├── SMS (Phone Number) - Primary
├── Email/Password - Secondary
└── Social Login (Future: Google, Apple)

Flow:
1. User enters phone number
2. Firebase sends SMS code
3. User enters code
4. Firebase verifies code
5. Backend creates user profile
6. Backend sets custom claims (role)
7. Frontend stores ID token
```

**JWT Token Structure:**
```json
{
  "uid": "firebase-user-id",
  "email": "user@example.com",
  "role": "freelancer|client|admin|guild_master",
  "customClaims": {
    "role": "freelancer",
    "currentRank": "G",
    "permissions": ["read:jobs", "write:applications"]
  },
  "iat": 1696000000,
  "exp": 1696604800
}
```

### 8.2 Role-Based Access Control (RBAC)

**Roles:**
```
1. Admin
   ├── Full platform access
   ├── User management
   ├── Dispute resolution
   ├── System configuration
   └── Analytics access

2. Client
   ├── Post jobs
   ├── Hire freelancers
   ├── Make payments
   └── Rate freelancers

3. Freelancer
   ├── Browse jobs
   ├── Apply to jobs
   ├── Complete work
   ├── Join guilds
   └── Receive payments

4. Guild Master
   ├── Create guilds
   ├── Assign jobs to members
   ├── Manage guild members
   └── Access guild vault

5. Guild Vice Master
   ├── Assign jobs (limited)
   ├── Manage members (limited)
   └── No vault access

6. Guild Member (Levels 1-3)
   ├── Accept assigned jobs
   ├── Contribute to guild
   └── Level-based permissions
```

**Middleware Protection:**
```typescript
// Require authentication
router.get('/jobs', authenticateFirebaseToken, getJobs);

// Require admin
router.get('/admin/users', authenticateFirebaseToken, requireAdmin, getUsers);

// Require guild master
router.post('/guilds/:id/jobs/:jobId/assign', 
  authenticateFirebaseToken, 
  requireGuildMaster, 
  assignJob
);
```

### 8.3 Security Measures

**Data Protection:**
- ✅ **Encryption at Rest**: Firebase automatic encryption
- ✅ **Encryption in Transit**: TLS/HTTPS for all communications
- ✅ **Token Security**: Secure storage (Expo SecureStore)
- ✅ **Token Expiry**: 1-hour ID tokens, refresh tokens
- ✅ **PCI DSS Compliance**: Payment tokenization (no raw card data)

**Input Validation:**
- ✅ **Zod Schemas**: Request body validation
- ✅ **SQL Injection Prevention**: Firestore (NoSQL)
- ✅ **XSS Prevention**: React automatic escaping
- ✅ **Rate Limiting**: Express rate limiter
- ✅ **CORS**: Configured for specific origins

**Firestore Rules:**
- ✅ **Owner-only Access**: Users can only access own data
- ✅ **Participant Checks**: Chat access requires participation
- ✅ **Admin Verification**: Admin endpoints require custom claims

---

## 9. REAL-TIME FEATURES

### 9.1 Firestore Real-time Listeners

**Chat Messages:**
```typescript
// Listen to messages in real-time
const unsubscribe = onSnapshot(
  query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(50)
  ),
  (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setMessages(messages);
  }
);
```

**Presence System:**
```typescript
// User online/offline status
presenceService.connectUser(userId);
// Updates Firestore: presence/{userId}
// { state: 'online', lastSeen: serverTimestamp() }
```

**Job Updates:**
```typescript
// Listen to job status changes
onSnapshot(doc(db, 'jobs', jobId), (snapshot) => {
  const job = { id: snapshot.id, ...snapshot.data() };
  // Update UI when job status changes
});
```

### 9.2 Socket.IO Integration

**Socket Events:**
```
Client → Server:
├── join-room (chat, guild)
├── leave-room
├── send-message
└── typing-indicator

Server → Client:
├── new-message
├── user-joined
├── user-left
├── typing-status
└── notification
```

**Socket Handler:**
```typescript
io.on('connection', (socket) => {
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
  });
  
  socket.on('send-message', (data) => {
    // Save to Firestore
    // Broadcast to room
    io.to(data.chatId).emit('new-message', data);
  });
});
```

### 9.3 Push Notifications

**Firebase Cloud Messaging (FCM):**
```
Notification Types:
├── Job Applications
├── Job Status Updates
├── Chat Messages
├── Payment Confirmations
├── Dispute Updates
└── System Announcements

Flow:
1. Backend triggers notification
2. FCM sends to device token
3. App receives notification
4. App shows in-app banner
5. User taps → Navigate to screen
```

---

## 10. AI & AUTOMATION

### 10.1 AI Job Matching

**Matching Algorithm:**
```typescript
Match Score = (
  skillsMatch * 0.4 +        // Skills alignment
  locationMatch * 0.2 +      // Geographic proximity
  budgetMatch * 0.2 +        // Rate compatibility
  rankMatch * 0.1 +          // Qualification level
  difficultyMatch * 0.1       // Complexity alignment
)

Features:
├── Skill analysis (keywords, tags)
├── Location filtering (remote/local)
├── Budget optimization
├── Rank-based suggestions
└── Difficulty matching
```

**Implementation:**
```typescript
// EnhancedJobEvaluationService
class EnhancedJobEvaluationService {
  async evaluateJob(job: JobPosting): Promise<EvaluationResult> {
    // Rule-based evaluation
    // Quality scoring
    // Fraud detection
    // Generate recommendations
  }
  
  async matchJobs(freelancerId: string): Promise<Job[]> {
    // Get freelancer profile
    // Calculate match scores
    // Sort by score
    // Return top matches
  }
}
```

### 10.2 AI Proposal Generation

**Proposal Generator:**
```typescript
// Suggests bid amounts and descriptions
interface ProposalSuggestion {
  suggestedBid: number;
  description: string;
  confidence: number;
}

Features:
├── Analyzes job requirements
├── Considers freelancer history
├── Suggests competitive rates
└── Generates proposal text
```

### 10.3 AI Fraud Detection

**Fraud Detection System:**
```typescript
// AdvancedAMLService
class AdvancedAMLService {
  async detectFraud(transaction: Transaction): Promise<FraudScore> {
    // Pattern analysis
    // Anomaly detection
    // Risk scoring
    // Flag suspicious activity
  }
}

Checks:
├── Unusual transaction patterns
├── Multiple account associations
├── Rapid job completion patterns
├── Payment velocity checks
└── Geographic anomalies
```

### 10.4 AI Profile Picture Processing

**Background Removal Service:**
```typescript
// AdvancedProfilePictureAIService
class AdvancedProfilePictureAIService {
  async processImage(imageBuffer: Buffer): Promise<ProcessedImage> {
    // U2Net model for background removal
    // GrabCut algorithm fallback
    // Quality optimization
    // Return processed image
  }
}
```

---

## 11. SCALABILITY & DEVOPS

### 11.1 Current Deployment

**Hosting:**
```
Backend:
├── Platform: Render.com
├── URL: https://guild-yf7q.onrender.com
├── Environment: Production
├── Auto-deploy: Git push
└── Health Check: /health

Mobile App:
├── iOS: App Store Connect
├── Android: Google Play Console
├── Build: EAS Build (Expo)
└── CI/CD: Automatic on merge

Firebase:
├── Project: guild-4f46b
├── Region: us-central1
├── Plan: Blaze (pay-as-you-go)
└── Services: Auth, Firestore, Storage, Functions
```

### 11.2 Scalability Architecture

**Horizontal Scaling:**
```
Load Balancer (Future: AWS ALB / Cloudflare)
    ↓
Multiple Backend Instances (Render.com auto-scaling)
    ↓
Firebase Firestore (automatic scaling)
    ↓
Firebase Storage (CDN-backed)
```

**Caching Strategy:**
```
Redis (Optional):
├── Job listings cache (5 min TTL)
├── User profile cache (10 min TTL)
├── Coin catalog cache (1 hour TTL)
└── Rate limiting counters
```

### 11.3 Monitoring & Logging

**Logging:**
```
Winston Logger (Backend):
├── Console logs (development)
├── File logs (production)
├── Error tracking
└── Performance metrics

Log Levels:
├── error: Critical errors
├── warn: Warnings
├── info: General info
└── debug: Debug info
```

**Health Checks:**
```typescript
GET /health
Response:
{
  "status": "OK",
  "database": {
    "firebase": "connected",
    "primary": "Firebase"
  },
  "redis": "connected",
  "uptime": 3600
}
```

### 11.4 Future DevOps Improvements

**Kubernetes Deployment (Future):**
```
K8s Cluster:
├── Backend API (Deployment)
├── Redis (StatefulSet)
├── Ingress Controller
└── Horizontal Pod Autoscaler

Services:
├── Backend Service (ClusterIP)
├── Redis Service (ClusterIP)
└── Ingress (LoadBalancer)
```

**CI/CD Pipeline (Future):**
```
GitHub Actions:
├── Test → Lint → Build
├── Deploy to Staging
├── Run E2E Tests
└── Deploy to Production

EAS Build:
├── iOS build on merge
├── Android build on merge
└── Submit to stores
```

---

## 12. API STRUCTURE

### 12.1 Complete API Reference

**Authentication:**
```
POST /api/v1/auth/signin
POST /api/v1/auth/signup
POST /api/v1/auth/sms/send
POST /api/v1/auth/sms/verify
POST /api/v1/auth/refresh
```

**Jobs:**
```
GET    /api/v1/jobs                    # List jobs
POST   /api/v1/jobs                    # Create job
GET    /api/v1/jobs/:id                 # Get job
PUT    /api/v1/jobs/:id                 # Update job
DELETE /api/v1/jobs/:id                 # Delete job
POST   /api/v1/jobs/:id/apply          # Apply to job
POST   /api/v1/jobs/:id/complete       # Mark complete
POST   /api/v1/jobs/:id/dispute        # Raise dispute
```

**Users:**
```
GET    /api/v1/users/:id                # Get user
PUT    /api/v1/users/:id                 # Update user
GET    /api/v1/users/:id/wallet         # Get wallet
GET    /api/v1/users/:id/jobs           # User's jobs
GET    /api/v1/users/:id/statistics     # User stats
```

**Guilds:**
```
GET    /api/v1/guilds                  # List guilds
POST   /api/v1/guilds                  # Create guild
GET    /api/v1/guilds/:id               # Get guild
POST   /api/v1/guilds/:id/join          # Join guild
POST   /api/v1/guilds/:id/leave         # Leave guild
POST   /api/v1/guilds/:id/jobs/:jobId/assign  # Assign job
```

**Coins:**
```
GET    /api/coins/catalog              # Coin catalog
GET    /api/coins/wallet                # User wallet
POST   /api/coins/purchase              # Buy coins
POST   /api/coins/job/pay               # Pay for job
POST   /api/coins/withdrawal            # Withdraw request
```

**Payments:**
```
POST   /api/payments/initiate           # Start payment
POST   /api/payments/webhook/fatora    # Fatora webhook
GET    /api/payments/history           # Payment history
GET    /api/v1/payments/wallet/:userId  # Wallet balance
```

**Chat:**
```
GET    /api/chat/direct                # Get direct chat
POST   /api/chat/direct                 # Create chat
GET    /api/chat/:chatId/messages       # Get messages
POST   /api/chat/:chatId/messages       # Send message
```

**Notifications:**
```
POST   /api/notifications/register-token  # Register FCM token
GET    /api/notifications                 # Get notifications
PUT    /api/notifications/:id/read         # Mark as read
```

---

## 13. USER JOURNEYS

### 13.1 Freelancer Journey

```
1. Sign Up
   ├── Enter phone number
   ├── Verify SMS code
   ├── Complete profile
   ├── Select skills
   └── Choose role: Freelancer

2. Browse Jobs
   ├── View job feed
   ├── Filter by category
   ├── Search jobs
   └── AI-matched recommendations

3. Apply to Job
   ├── View job details
   ├── Submit proposal
   ├── Set bid amount
   └── Wait for acceptance

4. Complete Work
   ├── Accept job assignment
   ├── Mark work as complete
   ├── Submit deliverables
   └── Wait for client approval

5. Receive Payment
   ├── Client approves work
   ├── Escrow releases (90% to freelancer)
   ├── Coins added to wallet
   └── Receive notification

6. Join Guild (Optional)
   ├── Browse guilds
   ├── Join guild
   ├── Accept assigned jobs
   └── Contribute to guild vault
```

### 13.2 Client Journey

```
1. Sign Up
   ├── Enter phone number
   ├── Verify SMS code
   ├── Complete profile
   └── Choose role: Client

2. Post Job
   ├── Fill job form
   ├── Set budget (in coins)
   ├── Add job description
   ├── Optional: Add promotion (Featured/Boost)
   └── Submit for admin approval

3. Review Applications
   ├── View applications
   ├── Review freelancer profiles
   ├── Check ratings & reviews
   └── Select freelancer

4. Payment (Escrow)
   ├── Accept freelancer proposal
   ├── Pay coins (locked in escrow)
   ├── Wait for work completion
   └── Receive deliverables

5. Approve & Release
   ├── Review completed work
   ├── Approve completion
   ├── Escrow releases (90% to freelancer)
   └── Rate freelancer

6. Raise Dispute (If Needed)
   ├── Open dispute
   ├── Provide reason
   ├── Admin reviews
   └── Admin resolution
```

### 13.3 Guild Master Journey

```
1. Create Guild
   ├── Enter guild name
   ├── Set description
   ├── Invite members
   └── Assign roles

2. Manage Members
   ├── Invite freelancers
   ├── Assign roles (Vice Master, Members)
   ├── Set member levels (1-3)
   └── Remove members

3. Assign Jobs
   ├── Browse available jobs
   ├── Assign to guild member
   ├── Track progress
   └── Review completion

4. Manage Guild Vault
   ├── View guild earnings
   ├── Distribute to members
   └── Track guild statistics
```

---

## 14. APPENDIX

### 14.1 Key Files Reference

**Frontend:**
- `src/app/_layout.tsx`: Root layout with providers
- `src/contexts/AuthContext.tsx`: Authentication state
- `src/services/jobService.ts`: Job operations
- `src/services/firebaseSMSService.ts`: SMS authentication
- `src/config/firebase.tsx`: Firebase configuration

**Backend:**
- `backend/src/server.ts`: Express server entry
- `backend/src/services/JobService.ts`: Job business logic
- `backend/src/services/CoinService.ts`: Coin system
- `backend/src/middleware/firebaseAuth.ts`: Authentication middleware
- `backend/src/routes/payments.ts`: Payment endpoints

### 14.2 Environment Variables

**Frontend (.env):**
```
EXPO_PUBLIC_API_URL=https://guild-yf7q.onrender.com/api
EXPO_PUBLIC_FIREBASE_PROJECT_ID=guild-4f46b
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=guild-4f46b.firebaseapp.com
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=guild-4f46b.firebasestorage.app
```

**Backend (.env):**
```
NODE_ENV=production
PORT=5000
JWT_SECRET=...
FIREBASE_PROJECT_ID=guild-4f46b
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
FATORA_API_KEY=...
REDIS_URL=... (optional)
```

### 14.3 Database Indexes

**Firestore Indexes:**
```
jobs:
├── status + createdAt (descending)
├── category + status + createdAt (descending)
├── location + status + createdAt (descending)
└── clientId + status + createdAt (descending)

chats:
├── participants (array-contains)
└── updatedAt (descending)

messages:
├── chatId + createdAt (ascending)
└── chatId + createdAt (descending)
```

---

## 15. CONCLUSION

This document provides a comprehensive overview of the GUILD platform architecture, covering:

- ✅ **Complete UI/UX system** with 100+ screens
- ✅ **Frontend architecture** with React Native/Expo
- ✅ **Backend architecture** with Node.js/Express
- ✅ **Payment system** with Guild Coins and Fatora PSP
- ✅ **Security** with Firebase Auth and RBAC
- ✅ **Real-time features** with Firestore and Socket.IO
- ✅ **AI features** for matching and fraud detection
- ✅ **Scalability** planning for future growth

**Current Status:** Production-ready, deployed to App Store and Google Play

**Next Steps:**
1. Monitor production metrics
2. Optimize performance based on usage
3. Implement Kubernetes deployment (future)
4. Expand AI features
5. Add web admin portal

---

**Document Maintained By:** Development Team  
**Last Updated:** October 2025  
**Version:** 1.0.0









