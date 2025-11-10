# 🐛 BUG FIX: QR Scanner Black Screen

**Date:** November 9, 2025  
**Time Spent:** 10 minutes  
**Status:** 🟢 FIXED

---

## 📋 ISSUE DESCRIPTION

**Problem:**
After scanning a user's QR code and viewing their profile, when the user presses the back button to return to the QR scanner screen, a black screen appears instead of the scanner being ready to scan again.

**User Flow:**
1. Profile → My QR Code → Scan QR Code ✅
2. Scan user QR code ✅
3. View scanned user profile ✅
4. Press back button ❌ **BLACK SCREEN**
5. Expected: Return to Scan QR Code screen (ready to scan)

---

## 🔍 ROOT CAUSE

**File:** `src/app/(modals)/qr-scanner.tsx`

**Issue:**
When a QR code is successfully scanned (line 53), the `isScanning` state is set to `false`:

```typescript
setIsScanning(false); // Line 53
```

When the user navigates back from the `scanned-user-profile` screen, the QR scanner screen is still mounted with `isScanning = false`, which causes the `QRCodeScanner` component to not render the camera view, resulting in a black screen.

**Why it happens:**
- The `isScanning` state persists when the screen is still in the navigation stack
- When user presses back, the screen doesn't remount (it's already mounted)
- The `useState(true)` initial value only runs on first mount
- Therefore, `isScanning` remains `false` from the previous scan

---

## ✅ SOLUTION

**Added `useFocusEffect` hook** to reset the scanner state when the screen comes back into focus.

### **Changes Made:**

**1. Added imports:**
```typescript
import React, { useState, useEffect } from 'react'; // Added useEffect
import { Stack, useRouter, useFocusEffect } from 'expo-router'; // Added useFocusEffect
```

**2. Added focus effect hook:**
```typescript
// ✅ FIX: Reset scanner when screen comes back into focus
// This prevents black screen when user goes back from scanned-user-profile
useFocusEffect(
  React.useCallback(() => {
    // Reset scanning state when screen is focused
    setIsScanning(true);
    console.log('QRScannerScreen focused, resetting scanner');
    
    return () => {
      // Optional cleanup when screen loses focus
      console.log('QRScannerScreen unfocused');
    };
  }, [])
);
```

---

## 🎯 HOW IT WORKS

### **useFocusEffect Hook:**
- Runs when the screen comes into focus (becomes visible)
- Resets `isScanning` to `true` every time the screen is focused
- Ensures the scanner is always ready when the user returns to this screen

### **User Flow After Fix:**
1. Profile → My QR Code → Scan QR Code ✅
2. Scan user QR code ✅
3. View scanned user profile ✅
4. Press back button ✅ **SCANNER READY**
5. Can scan another QR code immediately ✅

---

## 📁 FILES MODIFIED

1. `src/app/(modals)/qr-scanner.tsx`
   - Added `useEffect` import
   - Added `useFocusEffect` import
   - Added focus effect hook to reset scanner state

---

## 🧪 TESTING

### **Test Cases:**
- [x] Scan QR code → View profile → Go back → Scanner is ready
- [x] Scan QR code → View profile → Go back → Scan another QR code
- [x] Multiple scan cycles work correctly
- [x] No black screen appears
- [x] Camera permissions still work
- [x] Error handling still works

### **Expected Behavior:**
- ✅ Scanner resets when returning to screen
- ✅ Camera view is visible
- ✅ Ready to scan immediately
- ✅ No black screen
- ✅ Smooth user experience

---

## 🎨 ALTERNATIVE SOLUTIONS CONSIDERED

### **Option 1: Replace router.back() with router.replace()** ❌
**Rejected because:**
- Would break navigation stack
- User couldn't navigate back to profile
- Not user-friendly

### **Option 2: Unmount/remount screen** ❌
**Rejected because:**
- Performance overhead
- Unnecessary complexity
- Would require navigation changes

### **Option 3: Use useFocusEffect** ✅ **CHOSEN**
**Why:**
- Clean and simple
- Follows React Navigation best practices
- No performance overhead
- Maintains navigation stack
- Works with Expo Router

---

## 📊 IMPACT

### **Before Fix:**
- ❌ Black screen after viewing scanned profile
- ❌ User confused
- ❌ Had to close and reopen scanner
- ❌ Poor user experience

### **After Fix:**
- ✅ Scanner ready immediately
- ✅ Smooth user experience
- ✅ Can scan multiple users in succession
- ✅ Professional behavior

---

## 🎉 SUMMARY

**Issue:** Black screen when returning to QR scanner after viewing scanned user profile

**Root Cause:** `isScanning` state remained `false` from previous scan

**Solution:** Added `useFocusEffect` hook to reset `isScanning` to `true` when screen comes into focus

**Result:** Scanner is now always ready when user returns to the screen

**Time Spent:** 10 minutes

**Status:** ✅ **FIXED**

---

**The QR scanner now works perfectly!** 🎉


