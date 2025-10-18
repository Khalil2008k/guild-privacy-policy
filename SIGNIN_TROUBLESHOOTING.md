# 🔐 Sign-In Troubleshooting Guide

## ✅ **Fixed Issues:**

### 1. **Ionicons Error** ✅
- **Error:** `Property 'Ionicons' doesn't exist`
- **Fixed:** Replaced Ionicons with ChevronLeft/ChevronRight from lucide-react-native
- **Status:** RESOLVED ✅

---

## 🔐 **Current Issue: Invalid Credentials**

### **Error:**
```
🔐 Sign-in error: [FirebaseError: Firebase: Error (auth/invalid-credential).]
```

### **What This Means:**
This error occurs when:
1. ❌ Email doesn't exist in Firebase
2. ❌ Password is incorrect
3. ❌ Account hasn't been created yet

---

## 🎯 **Solution Options:**

### **Option 1: Create a New Account** (Recommended)

If you don't have an account yet:

1. **Tap "Sign Up"** on the sign-in screen
2. **Enter your details:**
   - Email: `your@email.com`
   - Password: (at least 6 characters)
3. **Complete verification** (if required)
4. **Success!** ✅ Now you can sign in

### **Option 2: Use an Existing Account**

If you already have an account:

1. **Make sure you're using the correct email**
   - Check for typos
   - Check caps lock
   - Verify it's the right email address

2. **Make sure you're using the correct password**
   - Passwords are case-sensitive
   - Check caps lock
   - Try copying/pasting if you saved it

3. **If you forgot your password:**
   - Tap "Forgot Password?"
   - Enter your email
   - Check your inbox for reset link
   - Create a new password
   - Sign in with new password

### **Option 3: Use Phone Number Sign-In**

**Easier & More Secure!**

1. On the sign-in screen, just type your phone number:
   - Example: `+974 3344 5566`
2. The app will auto-detect it as a phone number 📱
3. Tap "Continue"
4. Enter the SMS code you receive
5. Done! ✅

---

## 📱 **Recommended: Phone Number Auth**

**Why use phone authentication?**

✅ **No password to remember**  
✅ **More secure** (SMS verification)  
✅ **Faster** (no password typing)  
✅ **Works immediately** (no account creation needed)  

**How to use:**

```
Step 1: Type: +974 3344 5566
        ↓
Step 2: App detects it as phone 📱
        ↓
Step 3: Tap "Continue"
        ↓
Step 4: Receive SMS code
        ↓
Step 5: Enter code
        ↓
Step 6: Signed in! ✅
```

---

## 🧪 **Test Accounts (For Development)**

If you need to test email sign-in, create a test account:

### **Create Test Account:**
```
1. Tap "Sign Up"
2. Email: test@guild.app
3. Password: test123
4. Complete sign-up
5. Use these credentials to sign in
```

### **Common Test Credentials:**
```
Email: demo@guild.app
Password: demo123

Email: test@example.com
Password: test123
```

**Note:** These are examples - you need to create them first!

---

## 🔍 **Debugging Steps:**

### **Step 1: Check What You're Typing**

The unified sign-in screen will show:
- 📱 **Phone icon** if you're typing a phone number
- ✉️ **Email icon** if you're typing an email
- 🆔 **GID icon** if you're typing a Guild ID

**Make sure the icon matches what you intend!**

### **Step 2: Verify Your Input**

**For Email:**
```
✅ Good: user@example.com
❌ Bad: user@example (missing .com)
❌ Bad: @example.com (missing username)
❌ Bad: user example.com (missing @)
```

**For Phone:**
```
✅ Good: +974 3344 5566
✅ Good: +97433445566
❌ Bad: 3344 5566 (missing country code)
❌ Bad: 974 3344 5566 (missing +)
```

### **Step 3: Check Firebase Console**

To see if your account exists:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `guild-4f46b`
3. Go to **Authentication** → **Users**
4. Search for your email
5. If not found → **Create account first!**

---

## 🛠️ **Common Fixes:**

### **Fix 1: Wrong Email/Password**
```
✅ Solution: Double-check your credentials
✅ Or use "Forgot Password?" link
✅ Or create a new account
```

### **Fix 2: Account Doesn't Exist**
```
✅ Solution: Tap "Sign Up" to create account
✅ Or use phone number sign-in
```

### **Fix 3: Typing in Wrong Format**
```
✅ Solution: Watch the icon (📱/✉️/🆔)
✅ Make sure it matches your intent
```

### **Fix 4: Backend Connection Warning**
```
✅ This is NORMAL - ignore it!
✅ Phone auth works without backend
✅ Email auth also works without backend
```

---

## 🎯 **Quick Decision Tree:**

```
Do you have an account?
├── YES → Use correct email + password
│   └── Forgot password? → Use "Forgot Password" link
│
└── NO → Choose one:
    ├── Create account → Tap "Sign Up"
    └── Use phone → Just type your phone number
```

---

## 📊 **Error Code Reference:**

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `auth/invalid-credential` | Wrong email/password | Check credentials or create account |
| `auth/invalid-email` | Email format wrong | Use valid email format |
| `auth/user-not-found` | Account doesn't exist | Create account first |
| `auth/wrong-password` | Password incorrect | Check password or reset it |
| `auth/too-many-requests` | Too many failed attempts | Wait 15 minutes and try again |

---

## 🚀 **Best Practice: Use Phone Auth!**

For the smoothest experience:

1. **Open sign-in screen**
2. **Type:** `+974 3344 5566` (your actual number)
3. **Tap:** "Continue"
4. **Enter:** SMS code
5. **Done!** ✅

**No email, no password, no hassle!** 📱

---

## 📝 **Summary:**

✅ **Ionicons error fixed** - App won't crash anymore  
🔐 **Invalid credential error** - Need to:
  - Create account first, OR
  - Use correct credentials, OR
  - Switch to phone authentication

**Recommended:** Just use your phone number! It's easier and more secure! 📱✨

---

## 🆘 **Still Having Issues?**

1. **Clear app cache** (Settings → Apps → GUILD → Clear Cache)
2. **Restart the app**
3. **Try phone authentication** instead
4. **Create a fresh account** with a new email

---

**🎯 Bottom Line:**  
The `auth/invalid-credential` error means you're trying to sign in with credentials that don't match any Firebase account. Either create a new account or use your phone number for instant access! 🚀

