# 🚨 CRITICAL FIXES CHECKLIST - START HERE

**Priority:** P0 - BLOCKING LAUNCH  
**Timeline:** 2 weeks  
**Team:** All engineers

---

## ✅ WEEK 1: SECURITY FIXES (Days 1-7)

### Day 1-2: Firestore Rules Security 🔴
**Files:** `backend/firestore.rules`

- [ ] **CB-010: Fix wallet transaction rules**
  ```javascript
  // Change line 84-88:
  match /wallet_transactions/{transactionId} {
    allow read: if request.auth != null && request.auth.uid == resource.data.userId;
    allow write: if false; // ❌ CHANGE THIS - was: if request.auth != null
  }
  
  // Add new collection:
  match /wallets/{userId} {
    allow read: if request.auth != null && request.auth.uid == userId;
    allow write: if false; // Only Cloud Functions
  }
  ```
  - [ ] Update Firestore rules
  - [ ] Deploy rules: `firebase deploy --only firestore:rules`
  - [ ] Test: User cannot write to wallet
  - [ ] Test: Backend can write to wallet

- [ ] **CB-011: Fix notification rules**
  ```javascript
  // Change line 57-61:
  match /notifications/{notificationId} {
    allow read: if request.auth != null && request.auth.uid == resource.data.userId;
    allow update: if request.auth != null && 
      request.auth.uid == resource.data.userId &&
      request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read', 'readAt']);
    allow create, delete: if false; // ❌ CHANGE THIS - was: allow write
  }
  ```
  - [ ] Update Firestore rules
  - [ ] Deploy rules
  - [ ] Test: User cannot create notifications
  - [ ] Test: User can mark notification as read

- [ ] **CB-012: Add input validation to rules**
  ```javascript
  // Add to users collection (line 6-8):
  match /users/{userId} {
    allow write: if request.auth != null && 
      request.auth.uid == userId &&
      request.resource.data.name is string &&
      request.resource.data.name.size() >= 2 &&
      request.resource.data.name.size() <= 100 &&
      !request.resource.data.name.matches('.*<script.*');
  }
  
  // Add to jobs collection (line 11-16):
  match /jobs/{jobId} {
    allow create: if request.auth != null &&
      request.resource.data.budget > 0 &&
      request.resource.data.budget <= 1000000 &&
      request.resource.data.title.size() >= 3 &&
      request.resource.data.title.size() <= 200;
  }
  ```
  - [ ] Add validation to all collections
  - [ ] Deploy rules
  - [ ] Test: Invalid data rejected
  - [ ] Test: Valid data accepted

---

### Day 3-4: Remove Console.log 🔴
**Files:** 189 files across entire codebase

- [ ] **CB-001: Remove all 1,054 console.log statements**
  ```bash
  # Search for console.log:
  grep -r "console\.log" src/ --include="*.ts" --include="*.tsx"
  grep -r "console\.debug" src/ --include="*.ts" --include="*.tsx"
  
  # Replace with proper logger:
  # ❌ REMOVE: console.log('User data:', userData);
  # ✅ ADD: logger.info('User action', { userId: maskUserId(user.id) });
  ```
  - [ ] Create proper logger utility (if not exists)
  - [ ] Replace console.log with logger.info
  - [ ] Replace console.error with logger.error
  - [ ] Replace console.warn with logger.warn
  - [ ] Add ESLint rule to prevent console.log
  - [ ] Verify: `grep -r "console\.log" src/` returns 0 results

---

### Day 5-6: Input Validation & Sanitization 🔴
**Files:** All user input handlers

- [ ] **CB-004: Add input sanitization**
  ```bash
  npm install dompurify isomorphic-dompurify
  ```
  ```typescript
  // src/utils/sanitize.ts
  import DOMPurify from 'isomorphic-dompurify';
  
  export function sanitizeHTML(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'li'],
      ALLOWED_ATTR: []
    });
  }
  
  export function sanitizeText(text: string): string {
    return text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  ```
  - [ ] Create sanitization utilities
  - [ ] Sanitize chat messages
  - [ ] Sanitize job descriptions
  - [ ] Sanitize user profiles
  - [ ] Sanitize search queries
  - [ ] Test with XSS payloads: `<script>alert('XSS')</script>`
  - [ ] Verify: All inputs sanitized

---

### Day 7: Secure Token Storage 🔴
**Files:** `src/services/authTokenService.ts`, `src/contexts/AuthContext.tsx`

- [ ] **CB-005: Migrate to SecureStore**
  ```bash
  npm install expo-secure-store
  ```
  ```typescript
  import * as SecureStore from 'expo-secure-store';
  
  // ❌ REMOVE: await AsyncStorage.setItem('authToken', token);
  // ✅ ADD:
  await SecureStore.setItemAsync('authToken', token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED
  });
  ```
  - [ ] Install expo-secure-store
  - [ ] Replace AsyncStorage for tokens
  - [ ] Replace AsyncStorage for refresh tokens
  - [ ] Replace AsyncStorage for sensitive data
  - [ ] Test: Tokens stored securely
  - [ ] Verify: No tokens in AsyncStorage

---

## ✅ WEEK 2: MONITORING & INFRASTRUCTURE (Days 8-14)

### Day 8-9: Implement Monitoring 🔴
**Files:** `src/app/_layout.tsx`, `backend/src/server.ts`

- [ ] **CB-014: Add Sentry crash reporting**
  ```bash
  npm install @sentry/react-native @sentry/expo
  cd backend && npm install @sentry/node @sentry/profiling-node
  ```
  ```typescript
  // src/app/_layout.tsx
  import * as Sentry from '@sentry/react-native';
  
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: 1.0,
  });
  
  export default Sentry.wrap(RootLayout);
  ```
  - [ ] Create Sentry account
  - [ ] Install Sentry SDK (frontend)
  - [ ] Install Sentry SDK (backend)
  - [ ] Configure Sentry DSN
  - [ ] Test: Trigger error, verify in Sentry
  - [ ] Set up alerts (email, Slack)

---

### Day 10-11: Rate Limiting 🔴
**Files:** `backend/src/middleware/rateLimiter.ts`, `backend/src/server.ts`

- [ ] **CB-006: Add backend rate limiting**
  ```bash
  cd backend && npm install express-rate-limit rate-limit-redis ioredis
  ```
  ```typescript
  // backend/src/middleware/rateLimiter.ts
  import rateLimit from 'express-rate-limit';
  
  export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: 'Too many attempts, please try again later'
  });
  
  export const apiRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
  });
  ```
  - [ ] Install rate limiting packages
  - [ ] Create rate limiter middleware
  - [ ] Apply to auth endpoints
  - [ ] Apply to payment endpoints
  - [ ] Apply to API endpoints
  - [ ] Test: Exceed rate limit → 429 error

- [ ] **CB-013: Add Firestore rate limiting**
  ```bash
  # Install Firebase App Check
  npm install @react-native-firebase/app-check
  ```
  - [ ] Configure Firebase App Check
  - [ ] Enable reCAPTCHA
  - [ ] Test: App Check token required

---

### Day 12: Error Boundaries 🔴
**Files:** `src/components/ErrorBoundary.tsx`, `src/app/_layout.tsx`

- [ ] **CB-003: Add global error boundaries**
  ```typescript
  // src/components/ErrorBoundary.tsx
  import React from 'react';
  
  export class ErrorBoundary extends React.Component {
    componentDidCatch(error, errorInfo) {
      logger.error('App crashed', { error, errorInfo });
      Sentry.captureException(error);
    }
    
    render() {
      if (this.state.hasError) {
        return <SafeErrorScreen />;
      }
      return this.props.children;
    }
  }
  ```
  - [ ] Create ErrorBoundary component
  - [ ] Wrap root layout
  - [ ] Create error fallback UI
  - [ ] Test: Trigger error, verify boundary catches it

---

### Day 13: Backups 🔴
**Files:** Firebase Console, Cloud Functions

- [ ] **HP-006: Set up automated backups**
  ```bash
  # Enable Firestore backups
  gcloud firestore backups schedules create \
    --database='(default)' \
    --recurrence=daily \
    --retention=7d
  ```
  - [ ] Enable Firestore daily backups
  - [ ] Enable Firebase Storage backups
  - [ ] Test: Trigger manual backup
  - [ ] Verify: Backup created successfully

---

### Day 14: Testing & Verification 🔴

- [ ] **Final Verification Checklist**
  - [ ] All P0 issues resolved
  - [ ] No console.log in code
  - [ ] Firestore rules secure
  - [ ] Monitoring working
  - [ ] Rate limiting working
  - [ ] Error boundaries working
  - [ ] Backups configured
  - [ ] All tests passing

---

## 🎯 SUCCESS CRITERIA

### Before Moving to Week 3:
- ✅ Security score improved from 2/10 to 7/10
- ✅ All P0 critical blockers resolved
- ✅ Monitoring implemented and working
- ✅ No console.log in production code
- ✅ Firestore rules secure
- ✅ Rate limiting implemented
- ✅ Backups configured

---

## 📋 DAILY STANDUP TEMPLATE

### What did you complete yesterday?
- [ ] List completed tasks

### What will you work on today?
- [ ] List today's tasks

### Any blockers?
- [ ] List blockers

---

## 🚨 EMERGENCY CONTACTS

**If you find additional critical issues:**
1. Stop work immediately
2. Document the issue
3. Notify team lead
4. Add to this checklist
5. Reassess timeline

---

## 📊 PROGRESS TRACKING

**Week 1 Progress:** __ / 7 days complete  
**Week 2 Progress:** __ / 7 days complete  
**Overall Progress:** __ / 14 days complete

**Blockers:** (List any blockers here)

**Notes:** (Add any notes here)

---

**Last Updated:** November 9, 2025  
**Next Review:** Daily standup  
**Final Review:** End of Week 2

