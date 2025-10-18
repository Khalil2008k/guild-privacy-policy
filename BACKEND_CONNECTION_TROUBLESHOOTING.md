# 🔧 Backend Connection Troubleshooting Guide

**Created:** October 15, 2025  
**Status:** Backend returning ERROR - Service unavailable

---

## 🔍 **Current Situation:**

### ✅ What's Working:
- Backend server **IS running** on port 5000
- Firebase service account file exists
- Admin portal dependencies installed
- Mobile app configured with correct IP (192.168.1.34)

### ❌ What's NOT Working:
1. **Backend Health Check:** Returns "Service unavailable" error
2. **Admin Portal:** Not starting properly
3. **Mobile App:** Can't connect to backend (backend is unhealthy)

---

## 🚨 **Root Cause: Backend Service Unavailable**

When checking `http://localhost:5000/health`, the backend returns:
```json
{
  "status": "ERROR",
  "timestamp": "2025-10-15T01:16:25.881Z",
  "error": "Service unavailable"
}
```

This means:
- ✅ Backend server is running
- ❌ Firebase connection is failing
- ❌ Database connection might be failing

---

## ✅ **SOLUTION STEPS:**

### Step 1: Fix Backend Connection

The backend needs Firebase to be properly configured. Check:

```powershell
cd c:\Users\Admin\GUILD\GUILD-3\backend

# Check if Firebase credentials are loaded
Get-Content config\firebase-service-account.json

# Restart backend with proper environment variables
.\start-server-fixed.ps1
```

**If the startup script fails**, manually set environment and run:

```powershell
# Set Firebase credentials
$env:GOOGLE_APPLICATION_CREDENTIALS = "config\firebase-service-account.json"
$env:PORT = "5000"
$env:NODE_ENV = "development"

# Start server
node dist/server.js
```

---

### Step 2: Start Admin Portal

Once backend is healthy, start the admin portal:

```powershell
cd c:\Users\Admin\GUILD\GUILD-3\admin-portal

# Install dependencies (if not done)
npm install

# Start the portal
npm start
```

**The portal should open at:** http://localhost:3000

**If it takes too long:**
- React needs 30-60 seconds to compile
- Check browser console (F12) for errors
- Try clearing cache: `npm start -- --reset-cache`

---

### Step 3: Configure Mobile App Backend URL

The mobile app's backend URL is in: `src/config/backend.ts`

**Current configuration:**
```typescript
baseURL: __DEV__ 
  ? 'http://192.168.1.34:5000/api'  // ← Your network IP
  : 'https://api.guild.app/api'
```

**Choose the right URL based on how you're running:**

| How You're Running | URL to Use | Instructions |
|-------------------|------------|--------------|
| **Physical Device** (same WiFi) | `http://192.168.1.34:5000/api` | ✅ Already correct! |
| **iOS Simulator** | `http://localhost:5000/api` | Uncomment line 18 |
| **Android Emulator** | `http://10.0.2.2:5000/api` | Uncomment line 19 |
| **Expo Go App** | `http://192.168.1.34:5000/api` | ✅ Already correct! |

**To change:**
1. Open `GUILD-3/src/config/backend.ts`
2. Comment/uncomment the appropriate line
3. Restart your mobile app (shake device → Reload)

---

## 🧪 **Testing Each Component:**

### Test 1: Backend Health
```powershell
# Should return: {"status":"OK", ...}
Invoke-WebRequest -Uri http://localhost:5000/health -UseBasicParsing
```

### Test 2: Backend from Network IP
```powershell
# Should return: {"status":"OK", ...}
Invoke-WebRequest -Uri http://192.168.1.34:5000/health -UseBasicParsing
```

### Test 3: Admin Portal
```
1. Open browser: http://localhost:3000
2. Should see login page
3. Click "DEV BYPASS" to test without login
```

### Test 4: Mobile App Connection
```
1. Open mobile app
2. Check console logs for:
   "✅ Backend connection healthy"
   
   OR
   
   "⚠️ Backend connection failed"
3. If failed, app will use Firebase-only mode
```

---

## 🔧 **Quick Fixes:**

### Backend Won't Start:
```powershell
# Kill all node processes
Get-Process node | Stop-Process -Force

# Restart backend
cd c:\Users\Admin\GUILD\GUILD-3\backend
.\start-server-fixed.ps1
```

### Admin Portal Won't Start:
```powershell
# Clear cache and reinstall
cd c:\Users\Admin\GUILD\GUILD-3\admin-portal
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
npm start
```

### Mobile App Can't Connect:
```typescript
// In src/config/backend.ts, try localhost first:
baseURL: __DEV__ 
  ? 'http://localhost:5000/api'  // Try this
  : 'https://api.guild.app/api'
```

---

## 📊 **Current Status Summary:**

| Component | Port | Status | Action Needed |
|-----------|------|--------|---------------|
| Backend Server | 5000 | 🟡 Running but unhealthy | Fix Firebase connection |
| Admin Portal | 3000 | 🔴 Not started | Wait or restart |
| Mobile App | N/A | 🔴 Can't connect | Wait for backend fix |
| Firebase | N/A | 🔴 Not connected | Check service account |

---

## 🎯 **Next Steps:**

1. **First Priority:** Fix backend health
   - Restart backend with proper Firebase credentials
   - Verify health check returns "OK"

2. **Second Priority:** Start admin portal
   - Wait for React to compile (30-60 seconds)
   - Or restart if taking too long

3. **Third Priority:** Test mobile app
   - Should automatically connect once backend is healthy
   - Check app logs for connection status

---

## 📞 **Need Help?**

If you're still stuck after trying these steps:

1. Share the **exact error message** you're seeing
2. Tell me **which component** is failing (backend/portal/app)
3. Share **console logs** from browser/terminal
4. Let me know **how you're running the mobile app** (simulator/device/Expo Go)

---

## 📝 **Files Modified:**

- ✅ `admin-portal/.env.local` - Backend URLs configured
- ✅ `src/config/backend.ts` - Mobile app backend URL with options
- ✅ This troubleshooting guide

---

**Last Updated:** October 15, 2025, 4:16 AM


