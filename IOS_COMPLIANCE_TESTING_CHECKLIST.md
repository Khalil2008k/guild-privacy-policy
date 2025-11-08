# 🧪 iOS COMPLIANCE TESTING CHECKLIST

**Date:** November 7, 2025  
**Purpose:** Verify all iOS compliance implementations  
**Scope:** Phases 8, 9, 10 (iOS compliance)  
**Priority:** 🔴 CRITICAL for App Store submission

---

## 📱 TESTING ENVIRONMENT SETUP

### Prerequisites
- [ ] **Mac with Xcode** installed
- [ ] **iOS Simulator** (iPad Pro 12.9" + iPhone)
- [ ] **Real iOS device** (optional, recommended)
- [ ] **Backend deployed** with latest changes
- [ ] **APPLE_SHARED_SECRET** configured in backend
- [ ] **Sandbox test account** created

---

## 🔧 PRE-TEST CONFIGURATION

### 1. Backend Configuration (15 min)

#### Step 1.1: Deploy Backend with IAP Route
```bash
cd GUILD-3/backend
git pull origin main
npm install
npm run build

# Verify IAP route exists
ls src/routes/apple-iap.ts  # Should exist
```

#### Step 1.2: Add APPLE_SHARED_SECRET
```bash
# Edit .env file
nano .env

# Add this line:
APPLE_SHARED_SECRET=your_shared_secret_here
```

**To get shared secret:**
1. Go to https://appstoreconnect.apple.com
2. Sign in with: `guild1@guild-app.net`
3. Navigate: **My Apps** → **GUILD** → **In-App Purchases**
4. Click: **App-Specific Shared Secret**
5. Copy/Generate secret
6. Paste into `.env`

#### Step 1.3: Restart Backend
```bash
npm run dev
# Or for production:
npm start
```

#### Step 1.4: Verify Backend Running
```bash
# Test health endpoint
curl http://localhost:YOUR_PORT/health

# Test IAP route exists
curl -X POST http://localhost:YOUR_PORT/api/coins/purchase/apple-iap/verify
# Should return 401 (auth required) - that's correct!
```

**Status:** ⏳ Backend configuration pending

---

### 2. App Store Connect Configuration (30 min)

#### Step 2.1: Create IAP Products
Go to App Store Connect → GUILD → In-App Purchases

Create these 5 products (all Consumable):

1. **Bronze Coins**
   - Product ID: `com.guild.coins.bronze`
   - Reference Name: GUILD Bronze Coins
   - Price: Tier 1 (~5 QAR)
   - Description (EN): 5 QAR worth of Guild Coins for jobs and services
   - Description (AR): عملات جيلد بقيمة 5 ريال للوظائف والخدمات

2. **Silver Coins**
   - Product ID: `com.guild.coins.silver`
   - Reference Name: GUILD Silver Coins
   - Price: Tier 2 (~10 QAR)
   - Description (EN): 10 QAR worth of Guild Coins for jobs and services
   - Description (AR): عملات جيلد بقيمة 10 ريال للوظائف والخدمات

3. **Gold Coins**
   - Product ID: `com.guild.coins.gold`
   - Reference Name: GUILD Gold Coins
   - Price: Tier 11 (~50 QAR)
   - Description (EN): 50 QAR worth of Guild Coins for jobs and services
   - Description (AR): عملات جيلد بقيمة 50 ريال للوظائف والخدمات

4. **Platinum Coins**
   - Product ID: `com.guild.coins.platinum`
   - Reference Name: GUILD Platinum Coins
   - Price: Tier 21 (~100 QAR)
   - Description (EN): 100 QAR worth of Guild Coins for jobs and services
   - Description (AR): عملات جيلد بقيمة 100 ريال للوظائف والخدمات

5. **Diamond Coins**
   - Product ID: `com.guild.coins.diamond`
   - Reference Name: GUILD Diamond Coins
   - Price: Tier 32 (~200 QAR)
   - Description (EN): 200 QAR worth of Guild Coins for jobs and services
   - Description (AR): عملات جيلد بقيمة 200 ريال للوظائف والخدمات

**Status:** ⏳ IAP products pending

#### Step 2.2: Create Sandbox Test Account
1. Go to: **Users and Access** → **Sandbox** → **Testers**
2. Click **+** to add tester
3. Email: `guild.iap.test@icloud.com` (or any)
4. Password: Create strong password
5. First Name: GUILD
6. Last Name: Tester
7. Territory: Qatar (QA)
8. Save

**Status:** ⏳ Sandbox account pending

---

### 3. iOS App Build (15 min)

#### Step 3.1: Install Dependencies
```bash
cd GUILD-3
npm install
cd ios
pod install
cd ..
```

#### Step 3.2: Add IAP Capability (Xcode)
1. Open `ios/GUILD.xcworkspace` in Xcode
2. Select **GUILD** target
3. Go to: **Signing & Capabilities**
4. Click **+ Capability**
5. Add: **In-App Purchase**
6. Save

#### Step 3.3: Build for Simulator
```bash
# Build for iPad Pro 12.9"
npm run ios -- --simulator="iPad Pro (12.9-inch) (6th generation)"

# Or iPhone
npm run ios -- --simulator="iPhone 15 Pro"
```

**Status:** ⏳ Build pending

---

## ✅ PHASE 10: iOS IAP TESTING

### Test 1: IAP Initialization (5 min)
**Goal:** Verify IAP service loads on iOS

**Steps:**
1. ✅ Launch app on iOS Simulator
2. ✅ Navigate to Coin Store
3. ✅ Check logs for: `[IAP] Initializing connection...`
4. ✅ Check logs for: `[IAP] Connection initialized successfully`
5. ✅ Check logs for: `[IAP] Fetching products:`
6. ✅ Verify no crash

**Expected Result:**
- App loads without crash
- IAP service initializes
- Logs show initialization

**Actual Result:**
- [ ] Pass ✅
- [ ] Fail ❌ (note issue: _____________)

---

### Test 2: IAP Products Load (10 min)
**Goal:** Verify IAP products fetch from App Store

**Steps:**
1. ✅ Open Coin Store
2. ✅ Wait for products to load
3. ✅ Check logs for: `[IAP] Products loaded:`
4. ✅ Verify products array has 5 items
5. ✅ Check product IDs match:
   - `com.guild.coins.bronze`
   - `com.guild.coins.silver`
   - `com.guild.coins.gold`
   - `com.guild.coins.platinum`
   - `com.guild.coins.diamond`

**Expected Result:**
- 5 products loaded
- Product IDs correct
- Prices displayed

**Actual Result:**
- [ ] Pass ✅
- [ ] Fail ❌ (note issue: _____________)

**Troubleshooting if products don't load:**
- Wait 24 hours after creating products
- Verify product IDs match exactly
- Check agreements signed in App Store Connect
- Try sandbox account

---

### Test 3: IAP Purchase Flow (Bronze - 5 QAR) (15 min)
**Goal:** Test complete IAP purchase

**Steps:**
1. ✅ Sign out of Apple ID on simulator
2. ✅ Open Coin Store
3. ✅ Add Bronze Coins to cart
4. ✅ Tap "Checkout"
5. ✅ Accept terms
6. ✅ Verify: Platform check routes to IAP (check logs: `[iOS IAP]`)
7. ✅ Native Apple payment sheet appears
8. ✅ Sign in with sandbox account when prompted
9. ✅ Complete purchase
10. ✅ Verify: Receipt sent to backend (check logs)
11. ✅ Verify: Backend verifies receipt
12. ✅ Verify: Coins credited to wallet
13. ✅ Check Firestore:
    - `iap_transactions` has new doc
    - `coin_instances` has new coin
    - `user_wallets` updated

**Expected Result:**
- Native payment sheet appears
- Purchase completes
- Receipt verifies
- Coins credited
- Database updated

**Actual Result:**
- [ ] Pass ✅
- [ ] Fail ❌ (note issue: _____________)

---

### Test 4: IAP All Coin Packages (30 min)
**Goal:** Test all 5 coin packages

Repeat Test 3 for each package:
- [ ] Bronze (5 QAR) - Pass ✅ / Fail ❌
- [ ] Silver (10 QAR) - Pass ✅ / Fail ❌
- [ ] Gold (50 QAR) - Pass ✅ / Fail ❌
- [ ] Platinum (100 QAR) - Pass ✅ / Fail ❌
- [ ] Diamond (200 QAR) - Pass ✅ / Fail ❌

**Expected Result:**
- All packages purchase successfully
- Correct coin amounts credited
- No duplicate transactions

**Actual Result:**
- [ ] All Pass ✅
- [ ] Some Fail ❌ (note which: _____________)

---

### Test 5: IAP Error Handling (15 min)
**Goal:** Test error scenarios

**Test 5.1: Cancel Purchase**
1. ✅ Start purchase
2. ✅ Tap "Cancel" on payment sheet
3. ✅ Verify: Error message shown
4. ✅ Verify: No coins credited
5. ✅ Verify: Can retry purchase

**Result:** [ ] Pass ✅ / Fail ❌

**Test 5.2: Network Error**
1. ✅ Turn off WiFi
2. ✅ Attempt purchase
3. ✅ Verify: Network error shown
4. ✅ Turn on WiFi
5. ✅ Verify: Can retry

**Result:** [ ] Pass ✅ / Fail ❌

**Test 5.3: Duplicate Transaction**
1. ✅ Complete purchase
2. ✅ Attempt same transaction ID again
3. ✅ Verify: Backend prevents duplicate
4. ✅ Verify: No double-crediting

**Result:** [ ] Pass ✅ / Fail ❌

---

### Test 6: Android/Web PSP Unchanged (20 min)
**Goal:** Verify Android still uses Sadad

**Steps:**
1. ✅ Build Android version: `npm run android`
2. ✅ Navigate to Coin Store
3. ✅ Add coins to cart
4. ✅ Tap "Checkout"
5. ✅ Accept terms
6. ✅ Verify: Platform check routes to Sadad (check logs: `[Sadad]`)
7. ✅ Verify: WebView appears (NOT native payment sheet)
8. ✅ Verify: Sadad payment gateway loads
9. ✅ Complete test payment
10. ✅ Verify: Coins credited via callback

**Expected Result:**
- Android uses Sadad (NOT IAP)
- WebView payment works
- No regressions
- Existing flow unchanged

**Actual Result:**
- [ ] Pass ✅
- [ ] Fail ❌ (note issue: _____________)

---

## ✅ PHASE 9: PRIVACY TESTING

### Test 7: Account Deletion Flow (15 min)
**Goal:** Verify user can delete account

**Steps:**
1. ✅ Sign in to app
2. ✅ Navigate to: Settings
3. ✅ Scroll to: "Danger Zone"
4. ✅ Tap: "Delete Account"
5. ✅ Verify: Delete account modal appears
6. ✅ Enter deletion reason
7. ✅ Tap "Delete My Account"
8. ✅ Verify: Confirmation modal appears
9. ✅ Confirm deletion
10. ✅ Verify: Success message shown
11. ✅ Check Firestore: `accountDeletionRequests` has new doc
12. ✅ Check backend logs: Deletion request logged

**Expected Result:**
- Delete account option visible
- Reason required
- Confirmation required
- Request logged
- Success message shown

**Actual Result:**
- [ ] Pass ✅
- [ ] Fail ❌ (note issue: _____________)

---

### Test 8: Permission Strings (10 min)
**Goal:** Verify permission strings are clear

**Steps:**
1. ✅ Install app on real iOS device (or simulator)
2. ✅ First launch
3. ✅ Trigger each permission:
   
   **Camera:**
   - Navigate to profile → Edit → Camera
   - Verify prompt text: "GUILD needs camera access to take photos for your profile picture, job postings, and document verification..."
   
   **Photo Library:**
   - Navigate to profile → Edit → Photo Library
   - Verify prompt text: "GUILD needs access to your photo library to select and share images..."
   
   **Microphone:**
   - Navigate to chat → Voice message
   - Verify prompt text: "GUILD needs microphone access to record and send voice messages..."
   
   **Location:**
   - Navigate to jobs → Browse
   - Verify prompt text: "GUILD uses your location to show nearby jobs and guilds..."

**Expected Result:**
- All permission strings clear and explicit
- No generic "App needs access" messages
- Purpose explained in each prompt

**Actual Result:**
- [ ] Pass ✅
- [ ] Fail ❌ (note issue: _____________)

---

### Test 9: Data Minimization (5 min)
**Goal:** Verify nationality is optional

**Steps:**
1. ✅ Sign out
2. ✅ Tap "Sign Up"
3. ✅ Fill Step 1: Personal Info
4. ✅ Skip nationality field (leave empty)
5. ✅ Tap "Next"
6. ✅ Verify: Can proceed without nationality
7. ✅ Verify: No error about missing nationality
8. ✅ Complete signup
9. ✅ Verify: Account created successfully

**Expected Result:**
- Nationality field marked "(Optional)"
- Help text explains it's optional
- Can skip and proceed
- Account creates successfully

**Actual Result:**
- [ ] Pass ✅
- [ ] Fail ❌ (note issue: _____________)

---

### Test 10: Phone Number Justification (2 min)
**Goal:** Verify phone number has clear justification

**Steps:**
1. ✅ Go to signup
2. ✅ View Step 2: Account Info
3. ✅ Read phone number field
4. ✅ Verify help text: "Required for account verification and enabling communication..."

**Expected Result:**
- Help text clearly explains why phone is required
- Not just "Required" with no explanation

**Actual Result:**
- [ ] Pass ✅
- [ ] Fail ❌ (note issue: _____________)

---

## ✅ PHASE 8: TECHNICAL TESTING

### Test 11: iPad Accept and Pay Button (10 min)
**Goal:** Verify iPad payment button works

**Steps:**
1. ✅ Launch on iPad Pro 12.9" simulator
2. ✅ Navigate to Coin Store
3. ✅ Add coins to cart
4. ✅ Tap "Checkout"
5. ✅ Tap "Accept and Pay"
6. ✅ Verify: Button shows loading state
7. ✅ Verify: No silent failures
8. ✅ Verify: Payment initiates
9. ✅ Check logs for 8 fixes:
   - BackendAPI import
   - Firebase Auth check
   - User authentication
   - Network check
   - Debug info logged
   - Timeout handling
   - Response validation
   - Error messages with debug IDs

**Expected Result:**
- Button works on iPad
- Loading state shows
- Payment initiates
- Comprehensive error handling
- No silent failures

**Actual Result:**
- [ ] Pass ✅
- [ ] Fail ❌ (note issue: _____________)

---

### Test 12: App Icon (5 min)
**Goal:** Verify app icon displays correctly

**Steps:**
1. ✅ Install app on device/simulator
2. ✅ Go to Home Screen
3. ✅ Verify icon appears (not blank)
4. ✅ Verify icon is recognizable
5. ✅ Check in Settings
6. ✅ Check in Spotlight search
7. ✅ Check in App Switcher

**Expected Result:**
- Icon appears correctly in all locations
- No placeholder icon
- Professional appearance

**Actual Result:**
- [ ] Pass ✅
- [ ] Fail ❌ (note issue: _____________)

---

## 📸 MEDIA ASSETS

### Test 13: iPad Screenshots (60 min)
**Goal:** Capture required iPad screenshots

**Steps:**
1. ✅ Launch iPad Pro 12.9" simulator
2. ✅ Navigate to Home screen
3. ✅ Take screenshot (**Cmd + S**): `guild-ipad-01-home.png`
4. ✅ Navigate to Jobs screen
5. ✅ Take screenshot: `guild-ipad-02-jobs.png`
6. ✅ Navigate to Profile screen
7. ✅ Take screenshot: `guild-ipad-03-profile.png`
8. ✅ Navigate to Wallet screen
9. ✅ Take screenshot: `guild-ipad-04-wallet.png`
10. ✅ (Optional) Navigate to Chat screen
11. ✅ (Optional) Take screenshot: `guild-ipad-05-chat.png`
12. ✅ Verify dimensions: `sips -g pixelWidth -g pixelHeight *.png`
13. ✅ Should be: 2048 x 2732 pixels

**Expected Result:**
- 3-10 screenshots captured
- All 2048x2732 pixels
- High quality, professional
- Show key app features

**Actual Result:**
- [ ] Pass ✅
- [ ] Fail ❌ (note issue: _____________)

---

## 🔍 REGRESSION TESTING

### Test 14: Core App Functionality (30 min)
**Goal:** Ensure no regressions in core features

**Test each:**
- [ ] Login/Signup - Pass ✅ / Fail ❌
- [ ] Profile viewing - Pass ✅ / Fail ❌
- [ ] Job browsing - Pass ✅ / Fail ❌
- [ ] Job details - Pass ✅ / Fail ❌
- [ ] Chat messaging - Pass ✅ / Fail ❌
- [ ] Wallet viewing - Pass ✅ / Fail ❌
- [ ] Settings - Pass ✅ / Fail ❌
- [ ] Navigation - Pass ✅ / Fail ❌

**Expected Result:**
- All core features work
- No crashes
- No UI glitches
- No data issues

**Actual Result:**
- [ ] All Pass ✅
- [ ] Some Fail ❌ (note which: _____________)

---

## 📊 TEST SUMMARY

### Test Results Overview

| Phase | Test | Status | Notes |
|-------|------|--------|-------|
| **Phase 10: iOS IAP** |
| Test 1 | IAP Initialization | ⏳ | |
| Test 2 | IAP Products Load | ⏳ | |
| Test 3 | IAP Purchase (Bronze) | ⏳ | |
| Test 4 | IAP All Packages | ⏳ | |
| Test 5 | IAP Error Handling | ⏳ | |
| Test 6 | Android/Web PSP | ⏳ | |
| **Phase 9: Privacy** |
| Test 7 | Account Deletion | ⏳ | |
| Test 8 | Permission Strings | ⏳ | |
| Test 9 | Data Minimization | ⏳ | |
| Test 10 | Phone Justification | ⏳ | |
| **Phase 8: Technical** |
| Test 11 | iPad Accept/Pay | ⏳ | |
| Test 12 | App Icon | ⏳ | |
| Test 13 | iPad Screenshots | ⏳ | |
| **Regression** |
| Test 14 | Core Functionality | ⏳ | |

### Overall Status
- **Tests Passed:** 0 / 14
- **Tests Failed:** 0 / 14
- **Tests Pending:** 14 / 14

---

## 🐛 ISSUES FOUND

### Critical Issues (Must Fix Before Submission)
_None yet_

### Major Issues (Should Fix)
_None yet_

### Minor Issues (Can Fix Later)
_None yet_

---

## ✅ PRE-SUBMISSION CHECKLIST

### Code & Configuration
- [ ] Backend deployed with latest changes
- [ ] APPLE_SHARED_SECRET configured
- [ ] IAP products created in App Store Connect
- [ ] Sandbox test account created
- [ ] iOS app built with IAP capability

### Testing Complete
- [ ] All 14 tests passed
- [ ] No critical issues
- [ ] Android/Web verified unchanged
- [ ] Core functionality works

### Media Assets
- [ ] iPad screenshots captured (3-10)
- [ ] Screenshots are 2048x2732 pixels
- [ ] Screenshots uploaded to App Store Connect
- [ ] App icon verified

### App Store Connect
- [ ] App information updated
- [ ] Screenshots uploaded
- [ ] Privacy policy URL updated
- [ ] Support URL updated
- [ ] Age rating set
- [ ] App Review Information filled

### Ready for Submission
- [ ] All checklist items complete
- [ ] No blocking issues
- [ ] Team approval
- [ ] **SUBMIT!** 🚀

---

## 📝 NEXT STEPS AFTER TESTING

### If All Tests Pass ✅
1. Capture iPad screenshots
2. Upload to App Store Connect
3. Fill App Review Information
4. Submit for review
5. **Start coding Phase 2 while in review!**

### If Tests Fail ❌
1. Document issues in this checklist
2. Create fix plan
3. Implement fixes
4. Re-test
5. Repeat until all pass

---

**TESTING STATUS:** ⏳ Ready to begin  
**Estimated Time:** 3-5 hours (with setup)  
**Priority:** 🔴 CRITICAL for App Store submission

**Let's test and ship! 🚀**

*Created: November 7, 2025*

