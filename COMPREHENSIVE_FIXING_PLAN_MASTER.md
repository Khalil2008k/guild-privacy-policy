# 🎯 GUILD COMPREHENSIVE FIXING PLAN - MASTER TRACKER

**Created:** November 7, 2025  
**Engineer:** Senior Full-Stack + CTO Level AI  
**Target:** Production-Ready, App Store Compliant, Zero Technical Debt

---

## 📊 OVERALL PROGRESS

| Phase | Name | Status | Progress | Critical Issues |
|-------|------|--------|----------|-----------------|
| **0** | Safety & Feature Flags | 🔄 In Progress | 0% | None |
| **1** | Code Hygiene | ⏳ Pending | 0% | 8000+ lines waste |
| **2** | Wallet Completion | ⏳ Pending | 0% | Withdrawal incomplete |
| **3** | Job System | ⏳ Pending | 0% | Escrow/disputes incomplete |
| **4** | Guild System | ⏳ Pending | 0% | RBAC/analytics incomplete |
| **5** | Design System | ⏳ Pending | 0% | Inconsistent UI |
| **6** | Type Safety | ⏳ Pending | 0% | Excessive `any` |
| **7** | Performance | ⏳ Pending | 0% | Chat re-renders |
| **8** | iOS Tech Fixes | ⏳ Pending | 0% | AcceptAndPay broken |
| **9** | iOS Privacy | ⏳ Pending | 0% | No account deletion |
| **10** | iOS IAP | ⏳ Pending | 0% | Must use IAP |
| **11** | Legal/Account | ⏳ Pending | 0% | Org account needed |

**Overall Completion:** 0/12 phases (0%)

---

## 🎯 CRITICAL RULES (NO EXCEPTIONS)

- ❌ **NO LIES** – Every statement must match real code or be marked TODO
- ❌ **NO EMPTY SHELLS** – No fake components or unhooked routes
- ❌ **NO HALF SOLUTIONS** – Each fix must be complete and tested
- ❌ **NO CHAIN-EFFECT ERRORS** – Cannot break existing flows
- ✅ **USE REAL METHODS** – Only approaches valid as of Nov 2025
- ✅ **REUSE QUALITY OSS** – Well-maintained, popular libraries
- ✅ **PRESERVE PSP SECURITY** – Do not break existing PSP/Sadad for Web/Android

---

## 📋 PHASE DETAILS

### PHASE 0: Safety & Feature Flags ⏱️ ETA: 1 hour

**Goal:** Prevent chain-effect bugs during refactoring

**Tasks:**
- [ ] Create `src/config/featureFlags.ts`
- [ ] Add feature flag helper `isFeatureEnabled()`
- [ ] Snapshot current baseline behavior
- [ ] Document baseline in `docs/baseline-behavior.md`

**Feature Flags to Create:**
- `GUILD_WITHDRAWAL_V2` (withdrawal system)
- `GUILD_DISPUTE_V1` (dispute system)
- `GUILD_MILESTONES_V1` (milestone escrow)
- `GUILD_GUILDCOURT_V1` (guild court)
- `GUILD_IOS_IAP_COINS` (iOS IAP vs PSP)

**Success Criteria:**
- ✅ All flags created and documented
- ✅ Helper function works
- ✅ Baseline documented

---

### PHASE 1: Code Hygiene ⏱️ ETA: 2-3 hours

**Goal:** Remove 8000+ lines of duplicate/unused code

#### 1.1 Chat Duplication (4000 lines)
- [ ] Verify `chat.tsx` is the active implementation
- [ ] Archive 6 duplicate chat files:
  - `chat-PREMIUM.tsx`
  - `chat-WHATSAPP-STYLE.tsx`
  - `chat-BROKEN.tsx`
  - `chat-OLD-BASIC.tsx`
  - `chat-ENHANCED.tsx`
  - `chat-MODERN-BACKUP.tsx`
- [ ] Search for imports across codebase
- [ ] Move to `/archive/chat-legacy/`
- [ ] Test build + chat functionality
- [ ] Delete archived files permanently

#### 1.2 RealTimeSyncEngine (2000 lines)
- [ ] Verify not imported in production
- [ ] Remove:
  - `RealTimeSyncEngine.ts`
  - `RealTimeSyncTestSuite.ts`
  - `RealTimeSyncIntegrationTest.ts`
  - `RealTimeSyncTestRunner.js`
  - `EnterpriseTestSuite.ts`
  - `EnterpriseTestRunner.js`
  - `EnterpriseLocalStorageEngine.ts`
- [ ] Test build still passes

#### 1.3 Test Files in Production
- [ ] Move to `__tests__/`:
  - `firebase-sms-test.tsx`
  - `notification-test.tsx`
  - `contract-test.tsx`
- [ ] Add ESLint rule: no `*-test.tsx` outside `__tests__`

#### 1.4 Wrong Artifacts
- [ ] Delete `Environment changes - GUILD.txt` from modals
- [ ] Add pre-commit hook rejecting random text files in `src/app`

**Success Criteria:**
- ✅ 8000+ lines removed
- ✅ Build passes
- ✅ All tests pass
- ✅ Manual smoke test: chat works

---

### PHASE 2: Wallet Completion ⏱️ ETA: 4-6 hours

**Goal:** Fully functional withdrawal system with KYC

#### 2.1 Model & Types
- [ ] Define `Withdrawal` interface in `wallet.types.ts`
- [ ] Document state machine and invariants

#### 2.2 Backend Withdrawal Route
- [ ] Implement `POST /api/coins/withdraw`
- [ ] Validations: Auth, KYC, balance, limits
- [ ] Create withdrawal record
- [ ] Deduct coins in Firestore transaction
- [ ] Enqueue processing (Cloud Function or queue)

#### 2.3 Processing Worker
- [ ] Mark as `processing`
- [ ] Implement payout adapter interface
- [ ] Create mock adapter for now
- [ ] Handle failures → `failed` status

#### 2.4 KYC System
- [ ] Extend user model with KYC fields
- [ ] Create KYC submission UI in profile
- [ ] Backend: Store KYC data securely
- [ ] Admin review endpoints
- [ ] Connect to withdrawal validation

#### 2.5 Frontend UI
- [ ] Complete `coin-withdrawal.tsx` wiring
- [ ] Amount input with validation
- [ ] Destination selection
- [ ] Confirmation step
- [ ] KYC blocking state
- [ ] Feature flag gating

#### 2.6 Tests
- [ ] Integration tests for all scenarios
- [ ] Unit tests for validation logic

**Success Criteria:**
- ✅ Complete withdrawal flow works
- ✅ KYC properly blocks withdrawals
- ✅ All tests pass
- ✅ Feature flag controls rollout

---

### PHASE 3: Job System Completion ⏱️ ETA: 6-8 hours

**Goal:** Marketplace-grade job system

#### 3.1 State Machine
- [ ] Define job state machine in `jobStateMachine.ts`
- [ ] Centralize state transitions

#### 3.2 Escrow Backend
- [ ] Implement `POST /api/escrow/release`
- [ ] Implement `POST /api/escrow/refund`
- [ ] Strict validation (owner/admin only)
- [ ] Connect to wallet services

#### 3.3 Dispute System
- [ ] Full dispute model (Firestore + routes)
- [ ] Wire `job-dispute.tsx` to backend
- [ ] Evidence upload (Storage)
- [ ] Status tracking
- [ ] Admin review UI

#### 3.4 Milestones
- [ ] Extend job with `milestones[]`
- [ ] UI to show and mark milestones
- [ ] Partial escrow release per milestone

#### 3.5 Ratings & Reviews
- [ ] Add rating model (1-5 stars + comment)
- [ ] Rating dialog after job completion
- [ ] Aggregate in user profile

#### 3.6 Tests
- [ ] State transition tests
- [ ] Escrow release/refund tests
- [ ] Dispute flow tests

**Success Criteria:**
- ✅ Full job lifecycle works
- ✅ Escrow release/refund functional
- ✅ Disputes can be created and resolved
- ✅ Milestones trigger partial payments
- ✅ Ratings display on profiles

---

### PHASE 4: Guild System Completion ⏱️ ETA: 5-7 hours

**Goal:** Fully functional guild system

#### 4.1 Guild Creation
- [ ] Wire `guild-creation-wizard.tsx` to backend
- [ ] Implement `POST /api/guilds`
- [ ] Set creator as Guild Master

#### 4.2 RBAC (Role-Based Access Control)
- [ ] Create `GuildRolePolicy.ts`
- [ ] Define roles: master, vice_master, member
- [ ] Map roles to allowed actions
- [ ] Backend RBAC middleware
- [ ] Frontend permission-based UI hiding

#### 4.3 Guild Analytics
- [ ] Active member count
- [ ] Jobs completed
- [ ] Guild revenue
- [ ] Chart integration in `guild-analytics.tsx`

#### 4.4 Guild Map
- [ ] Implement `guild-map.tsx`
- [ ] Use `react-native-maps`
- [ ] Show guild clusters/pins from Firestore

#### 4.5 Guild Court MVP
- [ ] Convert `guild-court.tsx` to functional
- [ ] Attach to disputes
- [ ] Simple vote/decision flow

**Success Criteria:**
- ✅ Guilds can be created
- ✅ RBAC enforced on all actions
- ✅ Analytics display correctly
- ✅ Map shows guild locations
- ✅ Court can handle basic disputes

---

### PHASE 5: Design System ⏱️ ETA: 4-5 hours

**Goal:** Unified UI/UX and accessibility

#### 5.1 Design System Components
- [ ] Create `src/components/design-system/`:
  - `GuildButton.tsx`
  - `GuildCard.tsx`
  - `GuildModal.tsx`
  - `ModalHeader.tsx`
  - `LoadingState.tsx`
  - `EmptyState.tsx`
- [ ] Document usage in Storybook or README

#### 5.2 Tokens & Standards
- [ ] Define spacing tokens
- [ ] Define typography tokens
- [ ] Define color tokens
- [ ] Replace magic numbers in critical screens

#### 5.3 Accessibility
- [ ] Add accessibility props to all interactive elements
- [ ] Test with VoiceOver (iOS) and TalkBack (Android)
- [ ] Ensure tap targets ≥ 44pt

**Success Criteria:**
- ✅ Design system components created
- ✅ 50+ screens refactored to use design system
- ✅ Consistent look and feel
- ✅ VoiceOver/TalkBack navigation works

---

### PHASE 6: Type Safety ⏱️ ETA: 6-8 hours

**Goal:** Zero `any` types, full type safety

#### 6.1 TypeScript Strictness
- [ ] Enable `"strict": true` in `tsconfig.json`
- [ ] Fix type errors folder by folder
- [ ] Target: `types/`, `services/`, `screens/`

#### 6.2 Shared Types
- [ ] Create comprehensive types:
  - `wallet.types.ts`
  - `job.types.ts`
  - `guild.types.ts`
  - `user.types.ts`

#### 6.3 Runtime Validation with Zod
- [ ] Install and configure Zod
- [ ] Create Zod schemas for API inputs
- [ ] Validate Firestore documents
- [ ] Generate types from Zod schemas

**Success Criteria:**
- ✅ Strict mode enabled
- ✅ Zero `any` types in critical paths
- ✅ Runtime validation on all API inputs
- ✅ Type errors < 50

---

### PHASE 7: Performance ⏱️ ETA: 3-4 hours

**Goal:** Fast, smooth, observable app

#### 7.1 Chat Optimization
- [ ] Memoize message items
- [ ] Use FlashList or optimized FlatList
- [ ] Proper pagination
- [ ] Fix re-render issues

#### 7.2 Wallet Optimization
- [ ] Avoid heavy recalculations in render
- [ ] Use `useMemo` for computed values

#### 7.3 Cleanup
- [ ] Ensure all listeners unsubscribe
- [ ] Clear all timers on unmount
- [ ] Fix useEffect dependency warnings

#### 7.4 Observability
- [ ] Implement centralized logging service
- [ ] Add error boundaries around critical trees
- [ ] Integrate Sentry or similar

**Success Criteria:**
- ✅ Chat scrolling smooth (60 FPS)
- ✅ No memory leaks
- ✅ Error tracking functional
- ✅ Performance metrics baseline established

---

### PHASE 8: iOS Technical Fixes ⏱️ ETA: 2-3 hours

**Goal:** Fix Apple guideline technical issues

#### 8.1 AcceptAndPay Button (Guideline 2.1)
- [ ] Locate handler in `coin-store.tsx`
- [ ] Trace flow: button → handler → API → response
- [ ] Fix wiring issues
- [ ] Add logging for iOS builds
- [ ] Test on iPad Air (5th Gen) simulator
- [ ] Add integration test

#### 8.2 App Icon (Guideline 2.3.8)
- [ ] Create proper AppIcon set
- [ ] All required sizes (iPhone, iPad, App Store)
- [ ] Align with brand identity
- [ ] Test in simulator

#### 8.3 iPad Screenshots (Guideline 2.3.3)
- [ ] Test layout on iPad simulator (13")
- [ ] Verify landscape & portrait work
- [ ] Capture real iPad screenshots
- [ ] Document required sizes

**Success Criteria:**
- ✅ AcceptAndPay works on iPad
- ✅ App icon displays correctly
- ✅ iPad UI properly sized (no stretched iPhone screens)

---

### PHASE 9: iOS Privacy Fixes ⏱️ ETA: 3-4 hours

**Goal:** Fix privacy and data handling issues

#### 9.1 Purpose Strings (Guideline 5.1.1)
- [ ] Update `Info.plist` or `app.json`:
  - `NSCameraUsageDescription`
  - `NSMicrophoneUsageDescription`
  - `NSPhotoLibraryUsageDescription`
- [ ] Clear, accurate descriptions
- [ ] Verify all permissions are actually used

#### 9.2 Account Deletion (Guideline 5.1.1(v))
- [ ] Add "Delete Account" in Settings
- [ ] Confirmation modal
- [ ] Backend `DELETE /api/account` route
- [ ] Delete user data:
  - Firestore documents
  - Sensitive info (KYC)
  - Firebase Auth user
- [ ] Frontend logout on success
- [ ] Document in privacy policy

#### 9.3 Data Minimization (Guideline 5.1.1)
- [ ] Make Nationality optional
- [ ] Make Phone Number optional (unless KYC)
- [ ] Add explanatory text where required
- [ ] Ensure secure storage for sensitive fields

**Success Criteria:**
- ✅ Clear permission purpose strings
- ✅ Account deletion fully functional
- ✅ Only necessary data collected
- ✅ Privacy policy updated

---

### PHASE 10: iOS IAP Implementation ⏱️ ETA: 6-8 hours

**Goal:** iOS uses Apple IAP, preserve PSP for Android/Web

**CRITICAL:** This is platform-conditional. Do NOT break Android/Web PSP flow.

#### 10.1 Platform-Conditional Logic
- [ ] Detect platform: iOS vs Android/Web
- [ ] iOS: Show IAP coin purchase
- [ ] Android/Web: Show PSP/Sadad flow

#### 10.2 iOS IAP Implementation
- [ ] Install modern RN IAP library
- [ ] Configure StoreKit products:
  - `com.guild.coins.pack1`, etc.
- [ ] Map products to coin packages
- [ ] Implement purchase flow
- [ ] Backend receipt validation route:
  - `POST /api/coins/purchase/apple-iap/confirm`
- [ ] Server-side receipt verification
- [ ] Credit coins only after verification

#### 10.3 UI Changes
- [ ] In `coin-store.tsx`:
  - iOS: Show IAP products
  - Android/Web: Show PSP options
- [ ] No PSP WebView on iOS for coins

#### 10.4 Testing
- [ ] Test in Apple Sandbox
- [ ] Verify no PSP flow on iOS
- [ ] Verify PSP still works on Android/Web

**Success Criteria:**
- ✅ iOS uses IAP exclusively for coins
- ✅ Android/Web PSP flow unchanged
- ✅ Server-side validation working
- ✅ No client-side coin grants
- ✅ Apple Sandbox testing successful

---

### PHASE 11: Legal & Documentation ⏱️ ETA: 1 hour

**Goal:** Document legal requirements and explain coins

#### 11.1 Guild Coins Explanation
- [ ] Add "About Guild Coins" in Settings
- [ ] Clear in-app explanation
- [ ] Prepare App Review Notes text

#### 11.2 Developer Account
- [ ] Document in `docs/app-store/LEGAL.md`:
  - Organization account requirement
  - Steps to convert or transfer
- [ ] Note for human team action

**Success Criteria:**
- ✅ Guild Coins clearly explained in-app
- ✅ Legal requirements documented
- ✅ App Review Notes prepared

---

## 🧪 FINAL VALIDATION CHECKLIST

Before marking complete:

- [ ] All tests pass
- [ ] iOS build successful (including iPad)
- [ ] Android build successful
- [ ] Manual smoke tests:
  - [ ] Coin purchase (iOS IAP)
  - [ ] Coin purchase (Android PSP)
  - [ ] Wallet balance & transactions
  - [ ] Withdrawals (if KYC approved)
  - [ ] Job posting & application
  - [ ] Job escrow & completion
  - [ ] Disputes
  - [ ] Milestones
  - [ ] Ratings
  - [ ] Guild creation
  - [ ] Guild management
  - [ ] Chat messaging
  - [ ] Profile editing
  - [ ] Account deletion
  - [ ] Camera/mic/photos permissions
- [ ] iOS-specific verifications:
  - [ ] AcceptAndPay works on iPad
  - [ ] App icon correct
  - [ ] iPad screenshots real
  - [ ] Purpose strings clear
  - [ ] Account deletion exists
  - [ ] Data collection justified
  - [ ] IAP (not PSP) for coins
  - [ ] Coins explanation clear
- [ ] No regressions
- [ ] No broken PSP flows on Android/Web
- [ ] All errors logged and surfaced

---

## 📊 METRICS TO TRACK

| Metric | Baseline | Target | Current | Status |
|--------|----------|--------|---------|--------|
| Overall Readiness | 82% | 95%+ | 82% | ⏳ |
| Lines of Waste Code | 8000+ | 0 | 8000+ | ⏳ |
| TypeScript `any` Count | ~500 | < 50 | ~500 | ⏳ |
| Test Coverage | 65% | 80%+ | 65% | ⏳ |
| Code Quality Score | 70% | 90%+ | 70% | ⏳ |
| Apple Guideline Issues | 9 | 0 | 9 | ⏳ |
| Build Time | ~3 min | < 2 min | ~3 min | ⏳ |
| Chat FPS (scroll) | ~45 | 60 | ~45 | ⏳ |

---

## 🚨 RISK REGISTER

| Risk | Severity | Mitigation | Status |
|------|----------|------------|--------|
| Breaking PSP on Android/Web | 🔴 Critical | Feature flags, platform checks, thorough testing | ⚠️ Open |
| IAP implementation complexity | 🟡 High | Use well-maintained library, follow Apple docs | ⚠️ Open |
| Chain-effect bugs from refactor | 🟡 High | Comprehensive tests, feature flags, incremental rollout | ⚠️ Open |
| Guild system incomplete | 🟢 Medium | Phased implementation, MVP first | ⚠️ Open |
| Type safety migration cost | 🟡 High | Incremental, folder-by-folder approach | ⚠️ Open |

---

## 📝 NOTES & DECISIONS

**Date: Nov 7, 2025**
- Master plan created
- 12 phases identified
- Estimated total time: 40-60 hours
- Approach: Systematic, phase-by-phase
- Priority: Safety first, then cleanup, then features, then compliance

---

**MASTER TRACKER v1.0.0**  
*This document is automatically updated as phases complete*


