# Start Backend Server

## Option 1: PowerShell (Recommended)
```powershell
cd C:\Users\Admin\GUILD\GUILD-3\backend
npm run dev
```

## Option 2: CMD
```cmd
cd C:\Users\Admin\GUILD\GUILD-3\backend
npm run dev
```

## Verify Backend is Running
```powershell
# Check if port 5000 is listening
netstat -ano | findstr :5000

# Test health endpoint
curl http://192.168.1.34:5000/health
```

## Expected Output
```
info: 🚀 GUILD Platform Backend Server started
info: 📍 Server running on http://0.0.0.0:5000
info: ✅ All services initialized
```

## If Port is Already in Use
```powershell
# Find the process
netstat -ano | findstr :5000

# Kill the process (replace XXXX with PID from above)
taskkill /PID XXXX /F

# Then start backend again
npm run dev
```

## Current Status
- Backend is NOT running (port 5000 is free)
- You need to start it before the app can connect
- The frontend configuration is correct


