# Admin Portal Environment Setup Instructions

## ⚠️ IMPORTANT: Backend Connection Fix

Your admin portal needs to connect to the backend running on port 5000, not 3001!

## 📝 Steps to Fix:

### 1. Create Environment File

Create a file named `.env.local` in this directory (`admin-portal/`) with the following content:

```env
# Backend API Configuration
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_WEBSOCKET_URL=ws://localhost:5000

# Firebase Configuration (Get these from your Firebase Console)
REACT_APP_FIREBASE_API_KEY=your-api-key-here
REACT_APP_FIREBASE_AUTH_DOMAIN=guild-4f46b.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=guild-4f46b
REACT_APP_FIREBASE_STORAGE_BUCKET=guild-4f46b.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Development Mode
NODE_ENV=development
REACT_APP_ENABLE_DEV_MODE=true
```

### 2. Quick PowerShell Command to Create File:

Run this in PowerShell from the `admin-portal/` directory:

```powershell
@"
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_WEBSOCKET_URL=ws://localhost:5000
REACT_APP_FIREBASE_API_KEY=your-api-key-here
REACT_APP_FIREBASE_AUTH_DOMAIN=guild-4f46b.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=guild-4f46b
REACT_APP_FIREBASE_STORAGE_BUCKET=guild-4f46b.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
NODE_ENV=development
REACT_APP_ENABLE_DEV_MODE=true
"@ | Out-File -FilePath .env.local -Encoding utf8
```

### 3. Start the Admin Portal:

```bash
npm start
```

### 4. Alternative: Use Dev Bypass Mode

If you just want to test the UI without backend connection:

1. Open the admin portal in your browser
2. Open Developer Console (F12)
3. Run: `localStorage.setItem('devBypass', 'true')`
4. Refresh the page

This will use mock data instead of connecting to the backend.

## 🔧 Current Status:

- ✅ Backend Server: **RUNNING** on port 5000
- ❌ Admin Portal: **NOT RUNNING**  
- ⚠️ Backend Monitor: Trying to connect to port 3001 (incorrect)

## 📍 Backend API Endpoints Available:

The backend has these monitoring endpoints available:
- `http://localhost:5000/health` - Basic health check
- `http://localhost:5000/api/admin-system/monitoring/system` - System metrics
- `http://localhost:5000/api/admin-system/monitoring/security` - Security metrics
- `http://localhost:5000/api/admin-system/monitoring/performance` - Performance metrics
- `http://localhost:5000/api/admin-system/monitoring/financial` - Financial metrics

Note: All `/api/admin-system/*` endpoints require admin authentication.

## 🚀 Quick Start:

```bash
# In admin-portal directory:
cd c:\Users\Admin\GUILD\GUILD-3\admin-portal

# Create .env.local file (use PowerShell command above or create manually)

# Install dependencies (if not already done)
npm install

# Start the portal
npm start
```

The portal should open at http://localhost:3000 and connect to backend at http://localhost:5000

---

## 🐛 Debugging:

If still having issues:

1. Check backend is running: `netstat -ano | findstr :5000`
2. Check admin portal logs in browser console (F12)
3. Verify .env.local file exists and has correct values
4. Try dev bypass mode as mentioned above


