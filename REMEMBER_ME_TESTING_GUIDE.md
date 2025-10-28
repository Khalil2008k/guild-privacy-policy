# 🧪 Remember Me Feature - Testing Guide

## 📋 How to Test

### Test 1: First Time Sign In (Without Remember Me)
```
1. Open sign-in screen
2. Enter email: demo@guild.app
3. Enter password: demo123
4. Leave "Remember Me" UNCHECKED ☐
5. Tap "Sign In"
6. Sign out from profile
7. Return to sign-in screen
8. ✅ Expected: Email field is EMPTY
9. ✅ Expected: Checkbox is UNCHECKED
```

**Console Logs to Look For:**
```
ℹ️ Remember Me: No saved credentials found
🗑️ Remember Me: Clearing saved credentials
```

---

### Test 2: Sign In WITH Remember Me
```
1. Open sign-in screen
2. Enter email: demo@guild.app
3. Enter password: demo123
4. CHECK "Remember Me" ☑
5. Tap "Sign In"
6. Sign out from profile
7. Return to sign-in screen
8. ✅ Expected: Email field is PRE-FILLED with "demo@guild.app"
9. ✅ Expected: Checkbox is CHECKED ☑
10. ✅ Expected: Only need to enter password
```

**Console Logs to Look For:**
```
✅ Remember Me: Saving email for next time: demo@guild.app
🔐 Remember Me: Loading saved credentials... { hasSavedEmail: true, rememberMeEnabled: true }
✅ Remember Me: Auto-filling email: demo@guild.app
```

---

### Test 3: Changing Saved Email
```
1. Sign in with "Remember Me" checked
2. Email "user1@example.com" is saved
3. Sign out
4. Return to sign-in screen
5. Change email to "user2@example.com"
6. Keep "Remember Me" checked
7. Sign in
8. Sign out
9. Return to sign-in screen
10. ✅ Expected: Email field shows "user2@example.com"
```

**Console Logs to Look For:**
```
✅ Remember Me: Saving email for next time: user2@example.com
✅ Remember Me: Auto-filling email: user2@example.com
```

---

### Test 4: Unchecking Remember Me
```
1. Sign in with "Remember Me" checked (email saved)
2. Sign out
3. Return to sign-in screen (email is pre-filled)
4. UNCHECK "Remember Me" ☐
5. Sign in
6. Sign out
7. Return to sign-in screen
8. ✅ Expected: Email field is EMPTY
9. ✅ Expected: Checkbox is UNCHECKED
```

**Console Logs to Look For:**
```
🗑️ Remember Me: Clearing saved credentials
ℹ️ Remember Me: No saved credentials found
```

---

### Test 5: Different Input Types
```
Test with Email:
- Enter: demo@guild.app
- Check "Remember Me"
- Sign in → Sign out → Return
- ✅ Expected: Email pre-filled, type detected as "Email"

Test with Phone:
- Enter: +974 1234 5678
- Check "Remember Me"
- Continue → Return
- ✅ Expected: Phone pre-filled, type detected as "Phone"

Test with GID:
- Enter: GUILD123456
- Check "Remember Me"
- Sign in → Sign out → Return
- ✅ Expected: GID pre-filled, type detected as "GID"
```

---

### Test 6: RTL (Arabic) Mode
```
1. Change language to Arabic
2. Open sign-in screen
3. ✅ Expected: Checkbox on RIGHT side
4. ✅ Expected: Text "تذكرني" next to checkbox
5. ✅ Expected: "نسيت كلمة المرور؟" on LEFT side
6. Check "Remember Me"
7. Sign in → Sign out → Return
8. ✅ Expected: Email pre-filled in RTL layout
```

---

### Test 7: Theme Switching
```
Light Mode:
1. Sign in screen in light mode
2. ✅ Expected: Checkbox border visible
3. ✅ Expected: Checkmark in primary color
4. ✅ Expected: Text readable

Dark Mode:
1. Switch to dark mode
2. Sign in screen
3. ✅ Expected: Checkbox border visible
4. ✅ Expected: Checkmark in primary color
5. ✅ Expected: Text readable
```

---

## 🔍 Console Log Reference

### When Screen Loads:
```javascript
// No saved data:
ℹ️ Remember Me: No saved credentials found

// With saved data:
🔐 Remember Me: Loading saved credentials... { hasSavedEmail: true, rememberMeEnabled: true }
✅ Remember Me: Auto-filling email: demo@guild.app
```

### When Signing In:
```javascript
// Remember Me checked:
💾 Remember Me: Saving email for next time: demo@guild.app
✅ Remember Me: Email saved successfully

// Remember Me unchecked:
🗑️ Remember Me: Clearing saved credentials
✅ Remember Me: Credentials cleared
```

### On Error:
```javascript
❌ Remember Me: Error loading saved credentials: [error details]
```

---

## 📱 Visual Checklist

### Checkbox States:

**Unchecked:**
```
┌──┐
│  │  Remember Me
└──┘
Border: theme.border
Background: transparent
```

**Checked:**
```
┌──┐
│✓ │  Remember Me
└──┘
Border: theme.primary
Background: theme.primary
Checkmark: #000000 (black)
```

### Layout:

**English (LTR):**
```
[☐] Remember Me          Forgot Password?
```

**Arabic (RTL):**
```
?نسيت كلمة المرور          تذكرني [☐]
```

---

## 🐛 Troubleshooting

### Issue: Email not saving
**Check:**
1. Is "Remember Me" checked when signing in?
2. Look for console log: `✅ Remember Me: Saving email...`
3. Check AsyncStorage: `await AsyncStorage.getItem('rememberedEmail')`

### Issue: Email not loading
**Check:**
1. Look for console log: `🔐 Remember Me: Loading saved credentials...`
2. Check if `hasSavedEmail: true` in logs
3. Verify AsyncStorage has data

### Issue: Checkbox not visible
**Check:**
1. Theme colors are correct
2. Border width is 2px
3. Size is 24x24

### Issue: RTL layout broken
**Check:**
1. `flexDirection: isRTL ? 'row-reverse' : 'row'`
2. Checkbox on correct side
3. Text alignment correct

---

## ✅ Success Criteria

The feature is working correctly if:

1. ✅ Checkbox is visible and tappable
2. ✅ Checkmark appears when checked
3. ✅ Email saves when "Remember Me" is checked
4. ✅ Email loads on next visit
5. ✅ Email clears when "Remember Me" is unchecked
6. ✅ Works in both English and Arabic
7. ✅ Works in both light and dark themes
8. ✅ Console logs appear as expected
9. ✅ No errors in console
10. ✅ Smooth user experience

---

## 📊 Current Status (Based on Logs)

From your logs, I can see:
- ✅ App is running
- ✅ User signed in successfully: `demo@guild.app`
- ✅ Biometric is available
- ⏳ Need to test "Remember Me" feature

**Next Steps:**
1. Sign out from the app
2. Return to sign-in screen
3. Check if you see the "Remember Me" checkbox
4. Test the scenarios above
5. Look for the console logs

---

## 🎯 Quick Test

**Fastest way to verify it's working:**

```bash
# Test 1: Sign in with Remember Me
1. Open sign-in
2. Enter: demo@guild.app / demo123
3. Check "Remember Me" ☑
4. Sign in
5. Look for log: "✅ Remember Me: Saving email..."

# Test 2: Verify it loads
6. Sign out
7. Return to sign-in
8. Look for log: "✅ Remember Me: Auto-filling email..."
9. Email should be pre-filled
10. Checkbox should be checked
```

**If you see these logs and the email is pre-filled, IT'S WORKING!** ✅

---

## 📝 Notes

- Password is NEVER saved (security)
- Data is stored locally on device
- User has full control (can clear anytime)
- Works across app restarts
- Persists until user unchecks or clears app data

**The feature is fully implemented and ready to test!** 🚀
