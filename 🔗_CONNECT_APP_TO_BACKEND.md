# 🔗 Connect Mobile App to Backend

## ⚠️ **Current Issue**

Your app shows:
```
WARN Error getting fake wallet (using offline mode): [Error: HTTP 401]
LOG Backend connection failed
```

This means the app can't connect to the backend. Let's fix it!

---

## ✅ **Step 1: Verify Backend is Running**

### **Open a new terminal and run:**

```bash
cd backend
npm start
```

**Wait for:**
```
✅ Server listening on http://0.0.0.0:5000
🧪 Demo Mode Service initialized
💳 Fatora Payment Service initialized
```

**Keep this terminal open!** The backend needs to stay running.

---

## 🔍 **Step 2: Find Your Computer's IP Address**

### **Windows:**

```bash
ipconfig
```

Look for: `IPv4 Address . . . . : 192.168.X.X`

### **Mac/Linux:**

```bash
ifconfig | grep "inet "
```

Look for: `inet 192.168.X.X`

### **Common IP Addresses:**
- `192.168.1.34` (your current config)
- `192.168.0.10`
- `192.168.1.100`
- `10.0.0.5`

**Write down your IP!** Example: `192.168.1.34`

---

## 📱 **Step 3: Update Backend URL Based on Your Device**

### **Option A: Physical Device (iPhone/Android on WiFi)**

**Requirements:**
- ✅ Phone and computer on **same WiFi network**
- ✅ Backend running on your computer

**Update:** `src/config/backend.ts`

```typescript
const BACKEND_CONFIG = {
  baseURL: __DEV__ 
    ? 'http://YOUR_COMPUTER_IP:5000/api'  // Replace with your IP
    : 'https://api.guild.app/api',
  timeout: 10000,
  retries: 3,
};
```

**Example:**
```typescript
baseURL: __DEV__ 
  ? 'http://192.168.1.34:5000/api'  // ✅ Your computer's IP
```

### **Option B: iOS Simulator**

**Update:** `src/config/backend.ts`

```typescript
const BACKEND_CONFIG = {
  baseURL: __DEV__ 
    ? 'http://localhost:5000/api'  // ✅ Use localhost for iOS Simulator
    : 'https://api.guild.app/api',
```

### **Option C: Android Emulator**

**Update:** `src/config/backend.ts`

```typescript
const BACKEND_CONFIG = {
  baseURL: __DEV__ 
    ? 'http://10.0.2.2:5000/api'  // ✅ Special IP for Android Emulator
    : 'https://api.guild.app/api',
```

---

## 🧪 **Step 4: Test Backend Connection**

### **From Your Computer:**

```bash
# Test backend is responding
curl http://192.168.1.34:5000/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

### **From Your Phone's Browser:**

1. Open browser on your phone
2. Go to: `http://192.168.1.34:5000/health`
3. You should see: `{"status":"ok",...}`

**If this doesn't work:**
- ✅ Check phone and computer are on same WiFi
- ✅ Check firewall isn't blocking port 5000
- ✅ Try different IP address

---

## 🔄 **Step 5: Restart the App**

After updating `backend.ts`:

### **iOS Simulator:**

```bash
# Force quit app (Command + Q)
# Then restart
npx expo start
# Press 'i'
```

### **Android Emulator:**

```bash
# Force quit app
# Then restart
npx expo start
# Press 'a'
```

### **Physical Device:**

```bash
# Close app completely (swipe away)
# Scan QR code again
npx expo start
```

---

## ✅ **Step 6: Verify Connection**

### **Check App Console:**

You should see:
```
✅ Backend connection successful
✅ Health check passed
```

**No more:**
```
⚠️ Backend connection failed
```

---

## 🎯 **Quick Troubleshooting**

### **Issue: Still can't connect**

1. **Check Backend Logs:**
   - Is backend still running?
   - Any error messages?

2. **Check IP Address:**
   ```bash
   # On computer
   ipconfig  # Windows
   ifconfig  # Mac/Linux
   ```

3. **Check Firewall:**
   ```bash
   # Windows: Allow port 5000
   # Mac: System Preferences → Security & Privacy → Firewall
   ```

4. **Try Different Port:**
   
   In `backend/.env`:
   ```
   PORT=3000  # Instead of 5000
   ```
   
   In `src/config/backend.ts`:
   ```typescript
   baseURL: 'http://192.168.1.34:3000/api'  // Match new port
   ```

### **Issue: Backend starts but immediately crashes**

Check for:
- ✅ Port already in use: `netstat -ano | findstr :5000`
- ✅ Missing dependencies: `npm install`
- ✅ Environment variables: Check `backend/.env`

---

## 🎨 **Current Configuration**

Based on your setup:

**Backend URL:** `http://192.168.1.34:5000/api`

**This works for:**
- ✅ Physical device on WiFi (same network as computer)
- ❌ iOS Simulator (use `localhost` instead)
- ❌ Android Emulator (use `10.0.2.2` instead)

**What are you testing on?**
- Physical iPhone/Android → Current config is correct
- iOS Simulator → Change to `localhost:5000`
- Android Emulator → Change to `10.0.2.2:5000`

---

## 🚀 **Quick Fix for Testing**

### **Just Want to Test Payments?**

1. **Start backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Update backend.ts for your device:**
   - iOS Simulator: `http://localhost:5000/api`
   - Android Emulator: `http://10.0.2.2:5000/api`
   - Physical Device: `http://YOUR_IP:5000/api`

3. **Restart app:**
   ```bash
   # Force quit app
   npx expo start
   ```

4. **Test payment:**
   - Navigate to payment screen
   - Backend connection should work! ✅

---

## 📊 **Connection Status**

### **Working:**
```
✅ Backend health check passed
✅ User authenticated
✅ API requests successful
```

### **Not Working:**
```
⚠️ Backend connection failed
⚠️ Error: HTTP 401
⚠️ Using offline mode
```

---

## 💡 **For Payment Testing**

**Good News:** Payment testing doesn't require complex backend features!

**Minimum Setup:**
1. ✅ Backend running
2. ✅ Correct backend URL in `backend.ts`
3. ✅ User signed in (for auth token)

**That's it!** You can then test:
- Demo mode payments
- Production mode payments
- Payment WebView
- Success/failure flows

---

## 🎯 **Next Steps**

1. **Start backend** (if not running)
2. **Check your IP address**
3. **Update `src/config/backend.ts`** with correct URL
4. **Restart app**
5. **Test connection**
6. **Test payments!** 🚀

---

**Need help?** Check which device you're using and update the backend URL accordingly!

