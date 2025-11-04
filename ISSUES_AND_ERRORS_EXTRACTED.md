# Issues and Errors Extraction Report

## Date: 2025-11-03

## Summary
This document extracts all issues and errors from the application logs.

---

## 🔴 CRITICAL ERRORS

### 1. Expo Notifications - Push Notifications Error
**Type:** Runtime Error  
**Location:** `expo-notifications` module  
**Error Message:**
```
expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go with the release of SDK 53. Use a development build instead of Expo Go.
```
**Impact:** Push notifications will not work in Expo Go  
**Resolution:** Requires development build (not fixable in Expo Go)

---

## ⚠️ WARNINGS

### 1. Missing Default Exports (28 Route Files)
**Type:** Expo Router Warning  
**Count:** 28 files  
**Impact:** Files are incorrectly registered as routes when they should be components/hooks/utilities  

**Affected Files:**
- `./(main)/_components/GuildMapModal.tsx`
- `./(main)/_components/HomeActionButtons.tsx`
- `./(main)/_components/HomeHeader.tsx`
- `./(main)/_components/HomeHeaderCard.tsx`
- `./(main)/_components/JobCard.tsx`
- `./(main)/_components/SearchScreen.tsx`
- `./(main)/_hooks/useAdminTestHandlers.ts`
- `./(main)/_hooks/useHomeAnimations.ts`
- `./(main)/_hooks/useJobs.ts`
- `./(modals)/_components/AddJobFooter.tsx`
- `./(modals)/_components/AddJobHeader.tsx`
- `./(modals)/_components/AddPaymentMethodModal.tsx`
- `./(modals)/_components/CardForm.tsx`
- `./(modals)/_components/EditPaymentMethodModal.tsx`
- `./(modals)/_components/LanguageSelector.tsx`
- `./(modals)/_components/PaymentMethodCard.tsx`
- `./(modals)/_components/PaymentMethodsHeader.tsx`
- `./(modals)/_components/Step1BasicInfo.tsx`
- `./(modals)/_components/Step2BudgetTimeline.tsx`
- `./(modals)/_components/Step3LocationRequirements.tsx`
- `./(modals)/_components/Step4VisibilitySummary.tsx`
- `./(modals)/_components/StepIndicator.tsx`
- `./(modals)/_constants/jobFormConstants.ts`
- `./(modals)/_hooks/useAdminNotifications.ts`
- `./(modals)/_hooks/useJobForm.ts`
- `./(modals)/_hooks/useLocation.ts`
- `./(modals)/_hooks/usePromotionLogic.ts`
- `./(modals)/_hooks/useWalletBalance.ts`

**Note:** Files with `_components/` and `_hooks/` prefixes should not be treated as routes. This is expected behavior - the underscore prefix prevents Expo Router from treating them as routes, but Expo still logs warnings.

---

### 2. Expo Go Limitations

#### 2.1 Media Library Access
**Warning:** 
```
Due to changes in Androids permission requirements, Expo Go can no longer provide full access to the media library. To test the full functionality of this module, you can create a development build.
```
**Impact:** Limited media library access in Expo Go  
**Resolution:** Requires development build for full testing

#### 2.2 Notifications Support
**Warning:**
```
expo-notifications functionality is not fully supported in Expo Go:
We recommend you instead use a development build to avoid limitations.
```
**Impact:** Limited notification functionality in Expo Go  
**Resolution:** Requires development build

---

### 3. React Native Reanimated Warnings
**Type:** Property Overwrite Warning  
**Count:** ~50+ occurrences  
**Message:**
```
[Reanimated] Property "transform" of AnimatedComponent(View) may be overwritten by a layout animation. Please wrap your component with an animated view and apply the layout animation on the wrapper.
```
**Impact:** Potential visual glitches in animations  
**Location:** Multiple `Animated.View` components with transform animations  
**Resolution:** Wrap components with transform animations in additional animated views

---

### 4. MediaTile Video Container Width
**Type:** Style Validation Warning  
**Location:** `src/components/ChatMessage.tsx`  
**Message:**
```
[MediaTile] videoContainer width should be 250px (fixed size).
```
**Current:** `width: '100%'`  
**Expected:** `width: 250`  
**Impact:** Video container may not display at expected fixed width

---

### 5. setLayoutAnimationEnabledExperimental
**Type:** Deprecated API Warning  
**Message:**
```
setLayoutAnimationEnabledExperimental is currently a no-op in the New Architecture.
```
**Count:** 2 occurrences  
**Impact:** None (deprecated feature ignored)  
**Resolution:** Can be removed (no functionality impact)

---

## 📊 RUNTIME ERRORS (Non-Critical)

### 1. Firebase Permissions Errors
**Type:** Permission Denied  
**Location:** Firestore queries  
**Error:** `[FirebaseError: Missing or insufficient permissions.]`  
**Affected Operations:**
- GlobalChatNotificationService
- UserProfile Firebase load
- Presence service connection (retried 4 times, failed)

**Impact:** 
- User profile may not load from Firebase
- Presence status may not update
- Chat notifications may not work

**Note:** This appears to be related to Firestore security rules or authentication state.

---

### 2. Backend API 404 Error
**Type:** HTTP 404 Not Found  
**Location:** `/api/v1/payments/wallet/{userId}`  
**Error:**
```json
{"error": "Not found", "path": "/api/v1/payments/wallet/aATkaEe7ccRhHxk3I7RvXYGlELn1", "success": false}
```
**Impact:** Wallet balance may not load  
**Resolution:** Wallet service falls back to offline mode

---

## 📈 PERFORMANCE METRICS

### Cold Start Performance
**Total Time:** 44.56 seconds  
**Target:** 3.00 seconds  
**Status:** ⚠️ **EXCEEDS TARGET** (14.85x slower)

**Breakdown:**
- **Time to First Render:** 0.00s (✅ Within target: < 1.50s)
- **Time to Interactive:** 44.56s (⚠️ Exceeds target: > 3.00s)

**Issue:** Cold start time is significantly slower than target, indicating heavy initialization or network requests.

---

## ✅ WORKING FEATURES

The following features are working correctly:
- Authentication flow
- Chat message loading (50 messages loaded)
- Real-time typing indicators
- Message read receipts
- Message rendering
- Job listings (13 jobs found)
- Theme system
- i18n (internationalization)
- Remember Me functionality
- Biometric availability check

---

## 🔧 RECOMMENDED FIXES

### High Priority
1. **Firebase Permissions:** Review and fix Firestore security rules to allow proper access
2. **Cold Start Performance:** Optimize initialization to reduce cold start time from 44s to <3s
3. **Backend API Wallet Endpoint:** Fix or implement wallet balance endpoint

### Medium Priority
4. **Reanimated Transform Warnings:** Wrap animated components properly to prevent property overwrites
5. **Video Container Width:** Update video container style to use fixed 250px width

### Low Priority
6. **Route Export Warnings:** These are expected for underscore-prefixed files - can be safely ignored
7. **Expo Go Limitations:** Expected limitations - resolve by using development build for testing

---

## 📝 NOTES

- Most warnings are non-critical and expected in Expo Go environment
- Firebase permission errors need investigation - may be related to authentication state
- Performance metrics indicate need for optimization
- Application is functional despite warnings

---

**End of Report**


