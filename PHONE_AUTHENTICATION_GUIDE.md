# 📱 Phone Authentication Guide - GUILD App

## 🔴 **Problem You're Facing:**

You're trying to sign in with a **phone number** on the **email sign-in screen**, which causes:
```
Firebase: Error (auth/invalid-email)
```

---

## ✅ **Solution:**

### **The App Has TWO Separate Sign-In Methods:**

| Method | Screen | What It Accepts |
|--------|--------|-----------------|
| **Email Sign-In** | `sign-in.tsx` | ✉️ Email + Password |
| **Phone Sign-In** | `phone-verification.tsx` | 📱 Phone Number + SMS Code |

You need to use the **phone-verification screen** instead!

---

## 🚀 **How to Sign In With Phone Number:**

### **Option 1: Navigate from Welcome Screen**
1. Open the app
2. On the welcome/splash screen, look for:
   - **"Sign in with Phone"** button
   - **"Use Phone Number"** option
3. Tap it to go to phone verification

### **Option 2: From Current Sign-In Screen**
Look for a button or link that says:
- "Sign in with Phone Number"
- "Use Phone Instead"
- "Phone Verification"

### **Option 3: Direct Navigation** (For Developers)
In your code, navigate directly to:
```typescript
router.push('/(auth)/phone-verification');
```

---

## 📱 **Phone Verification Process:**

### **Step 1: Enter Phone Number**
```
Country Code: +974 (Qatar) 🇶🇦
Phone: 33445566

Full Number: +97433445566
```

**Supported Countries:**
- 🇶🇦 Qatar (+974)
- 🇸🇦 Saudi Arabia (+966)
- 🇦🇪 UAE (+971)
- 🇰🇼 Kuwait (+965)
- 🇧🇭 Bahrain (+973)
- 🇴🇲 Oman (+968)
- And more...

### **Step 2: Receive SMS Code**
Firebase will send a 6-digit code to your phone:
```
Your GUILD verification code is: 123456
```

### **Step 3: Enter Verification Code**
Enter the 6-digit code in the app

### **Step 4: Account Created!**
You're now signed in ✅

---

## 🔧 **Backend Connection Issue:**

### **Current Status: ✅ Backend is Running**
```
Backend: http://192.168.1.34:5000
Status: LISTENING on port 5000
Process ID: 21708
```

### **Why You See "Backend Connection Failed":**

The warning appears every 30 seconds during health checks. This is **normal** and doesn't affect phone authentication because:

1. **Phone auth uses Firebase directly** (not the backend)
2. **Backend is for advanced features** like:
   - Analytics
   - Payment processing
   - Admin functions
   - Job recommendations

### **To Verify Backend Connection:**

Open in browser:
```
http://192.168.1.34:5000/health
```

You should see:
```json
{
  "status": "healthy",
  "services": {
    "firebase": "connected",
    "redis": "connected",
    "postgresql": "connected"
  }
}
```

---

## 🔥 **Firebase Phone Auth Setup (For Developers):**

### **1. Check Firebase Console:**

Go to: https://console.firebase.google.com
1. Select your project: **`guild-4f46b`**
2. Go to **Authentication** → **Sign-in method**
3. Ensure **Phone** is **Enabled** ✅

### **2. Add Test Phone Numbers (Optional):**

For development, add test numbers:
```
Phone: +1 650-555-1234
Code: 123456
```

This bypasses SMS for testing.

### **3. Verify reCAPTCHA (Web):**

For React Native, ensure Firebase config is correct in:
```
GUILD-3/src/config/firebase.ts
```

---

## 📋 **Troubleshooting:**

### **Error: "Invalid Email"**
**Cause:** You're on the email sign-in screen  
**Fix:** Navigate to phone-verification screen

### **Error: "SMS Not Received"**
**Cause:** SMS delivery delay or wrong number  
**Fix:**
- Wait 1-2 minutes
- Check phone number format
- Try "Resend Code"
- Check spam/blocked messages

### **Error: "Invalid Verification Code"**
**Cause:** Wrong code or expired code  
**Fix:**
- Double-check the 6-digit code
- Codes expire after 5 minutes
- Request a new code

### **Error: "Too Many Requests"**
**Cause:** Exceeded Firebase SMS quota  
**Fix:**
- Wait 1 hour
- Use a different phone number
- Contact Firebase support

---

## 🎯 **Quick Test:**

### **Test Phone Authentication Now:**

1. **Stop** entering email/password
2. **Navigate** to phone verification screen
3. **Enter** your phone number with country code
4. **Wait** for SMS (30-60 seconds)
5. **Enter** the 6-digit code
6. ✅ **Signed in!**

---

## 📝 **Summary:**

| Issue | Solution |
|-------|----------|
| "Invalid Email" error | Use phone-verification screen, not sign-in screen |
| Backend connection failed | This is a warning, not an error. Phone auth works without backend. |
| Can't receive SMS | Check phone number format, wait 2 minutes, try resend |

---

## 🆘 **Still Having Issues?**

1. **Check Firebase logs:**
   ```bash
   # In your app console
   expo start --clear
   ```

2. **Verify phone number format:**
   ```
   ✅ Correct: +974 3344 5566
   ❌ Wrong: 974 3344 5566 (missing +)
   ❌ Wrong: 3344 5566 (missing country code)
   ```

3. **Check app permissions:**
   - SMS reading permission (Android)
   - Network permission

4. **Restart backend if needed:**
   ```powershell
   cd c:\Users\Admin\GUILD\GUILD-3\backend
   .\start-server-fixed.ps1
   ```

---

**✅ You're Ready!** Navigate to the phone verification screen and sign in with your phone number!

