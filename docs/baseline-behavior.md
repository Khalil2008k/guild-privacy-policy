# 📸 GUILD Baseline Behavior Snapshot

**Created:** November 7, 2025  
**Commit:** f091fdc (before comprehensive fixes)  
**Purpose:** Document current working behavior before refactoring

---

## 🎯 Purpose

This document captures the **baseline behavior** of GUILD before the comprehensive fixing plan begins. This allows us to:

1. ✅ Verify no regressions after each phase
2. ✅ Understand what's working vs. what's incomplete
3. ✅ Safely refactor knowing the expected behavior

---

## ✅ WORKING FEATURES (DO NOT BREAK)

### Authentication & User Management
- ✅ Firebase Auth login/signup
- ✅ Phone verification (SMS)
- ✅ Profile creation and editing
- ✅ Profile image upload
- ✅ User search and discovery

### Coin & Wallet System
- ✅ Coin purchase via Sadad WebCheckout 2.1 (Web/Android)
- ✅ Wallet balance display
- ✅ Transaction history
- ✅ Coin packages (GBC, GSC, GGC, GPC, GDC)
- ✅ 10% platform markup on purchases
- ✅ Coin credit after successful payment
- ⚠️ **Withdrawal**: UI exists but backend incomplete

### Job System
- ✅ Job posting (create job)
- ✅ Job browsing and search
- ✅ Job application
- ✅ Job details view
- ✅ Job status updates
- ⚠️ **Escrow release/refund**: Partially implemented
- ⚠️ **Disputes**: UI exists but not fully functional
- ⚠️ **Milestones**: UI exists but not fully functional
- ⚠️ **Ratings**: Not implemented

### Chat System
- ✅ One-on-one messaging
- ✅ Real-time message sync
- ✅ Message delivery status
- ✅ Image sharing
- ✅ Voice messages (Web Audio API)
- ✅ Message timestamps
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Message actions (reply, forward, star, delete)
- ⚠️ **Note**: 6 duplicate chat files exist (unused)

### Guild System
- ✅ Guild browsing
- ✅ Guild details view
- ⚠️ **Guild creation**: Wizard exists but not fully wired
- ⚠️ **Guild RBAC**: Not implemented
- ⚠️ **Guild analytics**: UI exists but not functional
- ⚠️ **Guild map**: UI exists but not functional
- ⚠️ **Guild court**: UI exists but not functional

### Notifications
- ✅ Push notifications (Expo)
- ✅ In-app notifications
- ✅ Notification preferences

### Settings & Preferences
- ✅ Language switching (English/Arabic)
- ✅ Theme (light/dark)
- ✅ RTL/LTR support
- ✅ Profile settings
- ⚠️ **Account deletion**: Not implemented

### Payment Security (Advanced)
- ✅ Device integrity checks (Play Integrity, DeviceCheck)
- ✅ Risk scoring
- ✅ Velocity checks
- ✅ Fraud pattern detection
- ✅ 3D Secure
- ✅ Tokenization
- ✅ Sadad WebCheckout integration

---

## ⚠️ INCOMPLETE FEATURES (TO BE COMPLETED)

### Wallet & Coins
1. **Withdrawal System**
   - Status: UI exists (`coin-withdrawal.tsx`)
   - Backend: Not implemented
   - Missing: Backend route, KYC, limits, processing

2. **KYC Verification**
   - Status: Not implemented
   - Missing: UI, backend, admin review

### Job System
1. **Escrow Release/Refund**
   - Status: Partially implemented
   - Missing: Complete backend routes, validation

2. **Dispute System**
   - Status: UI exists (`job-dispute.tsx`)
   - Missing: Full backend, evidence upload, admin review

3. **Milestones**
   - Status: UI partially exists
   - Missing: Backend logic, partial escrow release

4. **Ratings & Reviews**
   - Status: Not implemented
   - Missing: Complete system (UI + backend)

### Guild System
1. **Guild Creation**
   - Status: Wizard UI exists
   - Missing: Backend wiring, validation

2. **Guild RBAC**
   - Status: Not implemented
   - Missing: Role policy, middleware, UI enforcement

3. **Guild Analytics**
   - Status: UI shell exists
   - Missing: Real data, calculations, charts

4. **Guild Map**
   - Status: UI shell exists
   - Missing: Map integration, real pins

5. **Guild Court**
   - Status: UI shell exists
   - Missing: Functional dispute resolution logic

---

## 🔴 TECHNICAL DEBT (TO BE REMOVED)

### Duplicate Files (~8000 lines waste)
1. **Chat Duplicates** (~4000 lines)
   - `chat-PREMIUM.tsx`
   - `chat-WHATSAPP-STYLE.tsx`
   - `chat-BROKEN.tsx`
   - `chat-OLD-BASIC.tsx`
   - `chat-ENHANCED.tsx`
   - `chat-MODERN-BACKUP.tsx`
   - **Note**: `chat.tsx` is the only active version

2. **RealTimeSyncEngine** (~2000 lines)
   - `RealTimeSyncEngine.ts`
   - `RealTimeSyncTestSuite.ts`
   - `RealTimeSyncIntegrationTest.ts`
   - `RealTimeSyncTestRunner.js`
   - `EnterpriseTestSuite.ts`
   - `EnterpriseTestRunner.js`
   - `EnterpriseLocalStorageEngine.ts`
   - **Note**: Not used in production

3. **Test Files in Production**
   - `firebase-sms-test.tsx`
   - `notification-test.tsx`
   - `contract-test.tsx`
   - **Note**: Should be in `__tests__/`

4. **Wrong Artifacts**
   - `Environment changes - GUILD.txt` in modals folder

### Type Safety Issues
- ~500 instances of `any` type
- Strict mode not enabled
- Missing Zod validation

### UI/UX Inconsistencies
- Inconsistent button styles
- No unified design system
- Some screens missing accessibility props
- Magic numbers in styles

### Performance Issues
- Heavy re-renders in chat
- Missing memoization in wallet
- Some useEffect missing dependencies
- Listeners not always unsubscribed

---

## 🍎 APPLE APP STORE ISSUES (TO BE FIXED)

### Technical Issues
1. **AcceptAndPay not working on iPad** (Guideline 2.1)
   - Issue: Button doesn't trigger payment flow
   - Impact: Critical - blocks submission

2. **Blank app icon** (Guideline 2.3.8)
   - Issue: Placeholder icon
   - Impact: High - unprofessional

3. **Stretched iPad screenshots** (Guideline 2.3.3)
   - Issue: iPhone screens stretched
   - Impact: High - misrepresentation

### Privacy Issues
4. **Vague purpose strings** (Guideline 5.1.1)
   - Issue: Camera/mic/photos permissions unclear
   - Impact: High - rejection risk

5. **No account deletion** (Guideline 5.1.1(v))
   - Issue: Can create but not delete account
   - Impact: Critical - required by Apple

6. **Unnecessary data collection** (Guideline 5.1.1)
   - Issue: Nationality, phone not justified
   - Impact: Medium - privacy concern

### Payment Issues
7. **No IAP for iOS coins** (Guideline 3.1.1)
   - Issue: Using external PSP for digital goods
   - Impact: **CRITICAL** - instant rejection
   - Note: Must preserve PSP for Android/Web

### Information Issues
8. **Guild Coins unexplained** (Guideline 2.1)
   - Issue: Reviewer doesn't understand coin system
   - Impact: Medium - needs clarification

### Legal Issues
9. **Individual vs Organization account** (Guideline 5.1.1(ix))
   - Issue: App requires Organization account
   - Impact: High - account transfer needed

---

## 🧪 TEST SCENARIOS (BASELINE)

### Critical Paths to Verify After Each Phase

#### 1. Coin Purchase Flow
```
1. User opens coin store
2. Selects coin package
3. Taps "Accept and Pay"
4. Redirected to Sadad WebCheckout (Web/Android)
5. Completes 3DS verification
6. Returns to app
7. Coins credited to wallet
8. Transaction appears in history
```
**Expected:** ✅ Works on Web/Android
**Expected:** ⚠️ Should use IAP on iOS (after Phase 10)

#### 2. Job Posting Flow
```
1. User taps "Post Job"
2. Fills job details
3. Selects visibility and budget
4. Confirms payment from wallet
5. Job published
6. Job appears in listings
```
**Expected:** ✅ Works

#### 3. Chat Flow
```
1. User opens chat list
2. Selects conversation
3. Sends text message
4. Sends image
5. Sends voice message
6. Receives real-time messages
7. Sees typing indicator
8. Sees read receipts
```
**Expected:** ✅ Works

#### 4. Profile Flow
```
1. User opens profile
2. Edits name, bio, location
3. Uploads profile image
4. Saves changes
5. Changes reflected everywhere
```
**Expected:** ✅ Works

### New Flows to Test (After Implementation)

#### 5. Withdrawal Flow (After Phase 2)
```
1. User has KYC approved
2. Opens withdrawal screen
3. Enters amount
4. Selects destination
5. Confirms withdrawal
6. Withdrawal processed
7. Coins deducted
8. Transaction recorded
```
**Expected:** ⚠️ Not yet implemented

#### 6. Dispute Flow (After Phase 3)
```
1. Job completed but issue arises
2. User creates dispute
3. Uploads evidence
4. Admin/moderator reviews
5. Decision made
6. Escrow released or refunded
```
**Expected:** ⚠️ Not yet implemented

#### 7. Guild Creation Flow (After Phase 4)
```
1. User opens guild creation wizard
2. Fills guild details
3. Sets permissions
4. Creates guild
5. User becomes Guild Master
6. Guild appears in listings
```
**Expected:** ⚠️ Not yet implemented

#### 8. Account Deletion Flow (After Phase 9)
```
1. User opens Settings
2. Taps "Delete Account"
3. Confirms deletion
4. All data deleted
5. User logged out
6. Cannot log back in with same account
```
**Expected:** ⚠️ Not yet implemented

#### 9. iOS IAP Flow (After Phase 10)
```
1. iOS user opens coin store
2. Sees Apple IAP products (not PSP)
3. Selects package
4. Apple payment sheet appears
5. Completes purchase
6. Receipt validated server-side
7. Coins credited
```
**Expected:** ⚠️ Not yet implemented

---

## 📊 PERFORMANCE BASELINES

| Metric | Current | Target | Notes |
|--------|---------|--------|-------|
| Chat scroll FPS | ~45 | 60 | Heavy re-renders |
| Wallet load time | ~1.5s | < 1s | Can optimize |
| Job list load time | ~2s | < 1.5s | Can optimize |
| Build time | ~3 min | < 2 min | Can improve |
| Bundle size (iOS) | ~45 MB | < 40 MB | Tree-shaking needed |
| Bundle size (Android) | ~40 MB | < 35 MB | Tree-shaking needed |

---

## 🔐 SECURITY BASELINES

### Current Security Measures (DO NOT BREAK)
- ✅ Firebase Auth with JWT
- ✅ Firestore security rules deployed
- ✅ Storage security rules deployed
- ✅ Backend authentication middleware
- ✅ Device integrity checks
- ✅ Risk scoring
- ✅ Velocity checks
- ✅ 3D Secure for payments
- ✅ Server-side payment validation
- ✅ No client-side coin grants

### Security to Add
- ⚠️ KYC verification for withdrawals
- ⚠️ Account deletion audit logs
- ⚠️ IAP receipt validation

---

## 📝 NOTES

### Important Invariants
1. **NEVER grant coins without server-side verification**
2. **NEVER bypass Firebase Auth**
3. **NEVER expose sensitive keys in frontend**
4. **NEVER break PSP flow for Android/Web when adding iOS IAP**
5. **ALWAYS maintain backward compatibility during refactor**

### Known Quirks
1. Chat uses `onSnapshot` listeners (must unsubscribe on unmount)
2. Wallet balance recalculated on every render (should memoize)
3. Some screens use magic numbers for spacing
4. RTL support is comprehensive but not 100%
5. Translation coverage is 95% (some admin screens missing)

---

## ✅ BASELINE VERIFICATION CHECKLIST

Before starting Phase 1, verify:

- [x] All critical paths work
- [x] Build succeeds (iOS + Android)
- [x] Tests pass
- [x] No console errors on main flows
- [x] This document accurately reflects current state

---

**BASELINE ESTABLISHED ✅**

This document will be referenced throughout the fixing plan to ensure no regressions.

*Last Updated: November 7, 2025*


