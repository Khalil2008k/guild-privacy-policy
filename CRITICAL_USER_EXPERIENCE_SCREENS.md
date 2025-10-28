# Critical User Experience Screens - Priority Fix List

## 🎯 Priority Level: CRITICAL
These screens directly affect user experience with RTL/LTR, translations, light mode, icons, and UI polish.

---

## 1️⃣ AUTHENTICATION FLOW (Must Be Perfect) 🔴 HIGHEST PRIORITY

### First Impression Screens (User Sees First)
1. **`(auth)/splash.tsx`** ⭐⭐⭐
   - First screen users see
   - Must have: RTL/LTR, translations, proper icon placement
   - Critical for first impression

2. **`(auth)/welcome.tsx`** ⭐⭐⭐
   - Welcome message needs RTL, translation
   - Button icons positioning for RTL
   - Text alignment critical

3. **`(auth)/welcome-tutorial.tsx`** ⭐⭐⭐
   - Tutorial that teaches app
   - All text must translate perfectly
   - Icons must be positioned correctly

### Onboarding Screens ✅ ALREADY FIXED
4. **`(auth)/onboarding/1.tsx`** ✅
5. **`(auth)/onboarding/2.tsx`** ✅
6. **`(auth)/onboarding/3.tsx`** ✅

### Sign In/Up Flow (Critical)
7. **`(auth)/sign-in.tsx`** ⭐⭐⭐
   - Most used screen after onboarding
   - Form fields need RTL/LTR
   - Icons (eye icon, email icon) positioning
   - Text translations
   - Light mode support

8. **`(auth)/sign-up.tsx`** ⭐⭐⭐
   - Registration flow
   - All form fields RTL-aware
   - Icon positioning
   - Arabic translations

9. **`(auth)/signup-complete.tsx`** ⭐⭐
   - Success message
   - Button positioning
   - Translations

### Verification Screens
10. **`(auth)/email-verification.tsx`** ⭐⭐
    - Code input fields (RTL for Arabic)
    - Text translations
    - Icon positioning

11. **`(auth)/phone-verification.tsx`** ⭐⭐
    - Phone input (RTL-aware)
    - Code input fields
    - Translations

12. **`(auth)/two-factor-auth.tsx`** ⭐⭐
    - 2FA code input
    - RTL/LTR support
    - Translations

13. **`(auth)/two-factor-setup.tsx`** ⭐⭐
    - Setup instructions
    - QR code display (if any)
    - Translations

### Profile Setup
14. **`(auth)/profile-completion.tsx`** ⭐⭐⭐
    - Image upload (RTL-aware)
    - Form fields with labels
    - Icon positioning
    - Text translations

15. **`(auth)/biometric-setup.tsx`** ⭐⭐
    - Setup instructions
    - Icon positioning
    - Translations

### Account Recovery
16. **`(auth)/account-recovery.tsx`** ⭐⭐
    - Form fields
    - RTL/LTR support
    - Translations

17. **`(auth)/account-recovery-complete.tsx`** ⭐
    - Success message
    - Translations

### Legal (Less Critical)
18. **`(auth)/terms-conditions.tsx`** ⭐
    - Long text content
    - RTL text flow
    - Arabic translation accuracy

19. **`(auth)/privacy-policy.tsx`** ⭐
    - Long text content
    - RTL text flow
    - Arabic translation accuracy

---

## 2️⃣ MAIN APP NAVIGATION (Daily Use) 🔴 HIGHEST PRIORITY

### Core Screens (Most Used)
20. **`(main)/home.tsx`** ⭐⭐⭐ (Partially Fixed)
    - Search bar: translations, RTL positioning
    - Action buttons: RTL icon positioning
    - Job cards: RTL layout
    - Header buttons: icon placement
    - Guild Map button: translation
    - **Remove blur from icons** ✅
    - **Button animations** ✅
    - Light mode support

21. **`(main)/jobs.tsx`** ⭐⭐⭐
    - Job listings RTL layout
    - Filter button positioning
    - Search functionality
    - Empty state translations
    - Icon placement

22. **`(main)/profile.tsx`** ⭐⭐⭐
    - Profile header RTL
    - Stats cards layout
    - Action buttons icon positioning
    - Verification icon (shield with X/checkmark) ✅
    - Light mode support
    - **Remove blur from icons**

23. **`(main)/chat.tsx`** ⭐⭐⭐
    - Message bubbles RTL alignment
    - Input field RTL-aware
    - Send button icon positioning
    - Timestamps RTL alignment
    - Translations

24. **`(main)/search.tsx`** ⭐⭐
    - Search input RTL
    - Results list RTL
    - Filter options positioning
    - Translations

25. **`(main)/map.tsx`** ⭐⭐
    - Map controls RTL positioning
    - Location markers
    - Search bar RTL
    - Translations

26. **`(main)/post.tsx`** ⭐⭐
    - Post job form
    - RTL form fields
    - Icon positioning
    - Translations

---

## 3️⃣ JOB POSTING (Critical Workflow) 🔴 HIGH PRIORITY

### Job Creation Flow
27. **`(modals)/add-job.tsx`** ⭐⭐⭐ (Already Fixed)
    - Multi-step form ✅
    - Language options RTL ✅
    - Category selection RTL ✅
    - Budget type cards RTL ✅
    - Location options RTL ✅
    - Step indicators RTL ✅
    - **Remove blur from icons** ✅
    - Light mode support ✅
    - Translations ✅

28. **`(modals)/job-posting-help.tsx`** ⭐⭐ (Already Fixed)
    - Help content
    - RTL text flow ✅
    - Translations ✅
    - **Remove blur from icons** ✅

29. **`(modals)/job-search.tsx`** ⭐⭐
    - Search filters RTL
    - Results layout RTL
    - Icon positioning
    - Translations

30. **`(modals)/my-jobs.tsx`** ⭐⭐
    - Job list RTL
    - Status badges positioning
    - Filter options RTL
    - Translations

31. **`(modals)/job-details.tsx`** ⭐⭐
    - Job information layout RTL
    - Action buttons positioning
    - Contact section RTL
    - Translations

32. **`(modals)/leads-feed.tsx`** ⭐⭐
    - Feed layout RTL
    - Job cards RTL
    - Filter modal RTL
    - Translations

---

## 4️⃣ WALLET & PAYMENTS (Critical Functionality) 🔴 HIGH PRIORITY

### Wallet Screens (Already Fixed)
33. **`(modals)/coin-wallet.tsx`** ⭐⭐⭐ (Already Fixed)
    - Total worth section: border instead of blur ✅
    - RTL layout ✅
    - **Remove blur from icons** ✅
    - Light mode support ✅
    - Translations ✅

34. **`(modals)/coin-withdrawal.tsx`** ⭐⭐⭐ (Already Fixed)
    - Balance section: border instead of blur ✅
    - Form fields RTL ✅
    - **Remove blur from icons** ✅
    - Light mode support ✅
    - Translations ✅

35. **`(modals)/wallet.tsx`** ⭐⭐
    - Wallet overview RTL
    - Balance display RTL
    - Transaction list RTL
    - Translations

36. **`(modals)/payment-methods.tsx`** ⭐⭐
    - Payment cards list RTL
    - Add button positioning
    - Form inputs RTL
    - Translations

37. **`(modals)/coin-store.tsx`** ⭐⭐
    - Packages layout RTL
    - Purchase buttons positioning
    - Currency display RTL
    - Translations

38. **`(modals)/transaction-history.tsx`** ⭐⭐
    - List layout RTL
    - Status badges positioning
    - Dates RTL alignment
    - Translations

---

## 5️⃣ SETTINGS & PREFERENCES 🔴 HIGH PRIORITY

39. **`(modals)/settings.tsx`** ⭐⭐⭐
    - Settings list RTL
    - Switch positioning
    - Icon placement
    - Translations
    - Light mode toggle

40. **`(modals)/profile-edit.tsx`** ⭐⭐
    - Form fields RTL
    - Image upload RTL-aware
    - Icon positioning
    - Translations

41. **`(modals)/profile-settings.tsx`** ⭐⭐
    - Settings list RTL
    - Icon positioning
    - Translations

42. **`(modals)/user-settings.tsx`** ⭐⭐
    - User preferences RTL
    - Switch toggles positioning
    - Translations

43. **`(modals)/notification-preferences.tsx`** ⭐⭐
    - Notification options RTL
    - Toggle switches positioning
    - Translations

44. **`(modals)/security-center.tsx`** ⭐⭐
    - Security options RTL
    - Icon positioning
    - Translations

---

## 6️⃣ GUILD FEATURES 🔴 MEDIUM PRIORITY

45. **`(modals)/guild.tsx`** ⭐⭐
    - Guild overview RTL
    - Member list RTL
    - Icon positioning
    - Translations

46. **`(modals)/guilds.tsx`** ⭐⭐
    - Guild list RTL
    - Search bar RTL
    - Filter options RTL
    - Translations

47. **`(modals)/create-guild.tsx`** ⭐⭐
    - Creation form RTL
    - Form fields RTL
    - Icon positioning
    - Translations

48. **`(modals)/guild-map.tsx`** ⭐⭐
    - Map display RTL-aware
    - Controls positioning
    - Translations

---

## 7️⃣ NOTIFICATIONS 🔴 MEDIUM PRIORITY

49. **`(modals)/notifications.tsx`** ⭐⭐
    - Notification list RTL
    - Time stamps RTL alignment
    - Icon positioning
    - Translations

50. **`(modals)/notifications-center.tsx`** ⭐⭐
    - Center layout RTL
    - Filter options RTL
    - Translations

---

## 8️⃣ HELP & SUPPORT 🔴 MEDIUM PRIORITY

51. **`(modals)/help.tsx`** ⭐⭐
    - Help content RTL
    - Categories RTL
    - Icon positioning
    - Translations

52. **`(modals)/knowledge-base.tsx`** ⭐
    - Articles list RTL
    - Search RTL
    - Translations

---

## 🎨 GLOBAL UI FIXES NEEDED ACROSS ALL SCREENS

### Icon Issues
- ❌ Remove blur/shadow from ALL icons
- ✅ Use Lucide icons consistently
- ❌ Remove outer lines from icons
- ✅ Proper icon positioning in RTL mode
- ✅ Icon spacing from text based on language

### Translation Issues
- ❌ Check all translations for accuracy
- ❌ Fix "Guild" not translating issue
- ❌ Ensure Arabic translations are complete
- ❌ Proper RTL text flow

### Light Mode Issues
- ❌ Ensure all screens support light mode
- ❌ Text colors visible on backgrounds
- ❌ Icon colors contrast properly
- ❌ Theme colors applied consistently

### RTL/LTR Issues
- ❌ Proper flexDirection in RTL
- ❌ Text alignment (left/right)
- ❌ Icon margins (left/right)
- ❌ Writing direction set correctly

---

## 📊 SUMMARY BY PRIORITY

### 🔴 CRITICAL (Fix First - 30 screens)
1. Splash, Welcome, Tutorial
2. Sign In, Sign Up, Profile Completion
3. Onboarding (Already Fixed)
4. Home, Jobs, Profile, Chat
5. Add Job (Already Fixed)
6. Coin Wallet (Already Fixed)
7. Coin Withdrawal (Already Fixed)
8. Settings, Profile Edit

### 🟡 HIGH (Fix Second - 15 screens)
- Verification screens
- My Jobs, Job Details
- Wallet screens
- Profile settings

### 🟢 MEDIUM (Fix Third - 10 screens)
- Guild screens
- Notifications
- Help & Support

### ⚪ LOW (Fix Last - Remaining)
- Less frequently used screens
- Admin-only screens
- Debug/test screens

---

## 🎯 ACTION PLAN

### Phase 1: Critical UX (Do First)
1. ✅ Fix RTL component connection (DONE)
2. Fix Sign In screen
3. Fix Sign Up screen
4. Fix Profile Completion
5. Check all auth screens
6. Verify Home screen RTL completely
7. Fix Jobs screen
8. Fix Chat screen
9. Fix Settings screen

### Phase 2: Polish UX (Do Second)
10. Remove blur from all icons
11. Fix icon positioning everywhere
12. Check all translations
13. Ensure light mode works everywhere
14. Verify naming accuracy in Arabic

### Phase 3: Comprehensive Check (Do Third)
15. Go through ALL screens systematically
16. Test in both languages
17. Test in light/dark mode
18. Fix any remaining issues

---

**Total Critical Screens:** ~55 screens
**Already Fixed:** 7 screens
**Remaining:** ~48 screens to fix

**Estimated Effort:** High (requires careful testing of each screen)
**Impact:** CRITICAL - User experience depends on this

