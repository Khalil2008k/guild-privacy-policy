# Backend Connection Debugging Guide

## Current Configuration

### Network Setup
- **PC IP (LAN)**: 192.168.1.34
- **Backend Port**: 5000
- **Phone**: WiFi (same router)

### Backend URLs Configured
1. **environment.ts**: `http://192.168.1.34:5000/api`
2. **backend.ts**: `http://192.168.1.34:5000/api`

### Backend Endpoints
- Health Check: `http://192.168.1.34:5000/health` ✅ (tested, works)
- API Routes: `http://192.168.1.34:5000/api/*`

## Changes Made

### Files Modified
1. ✅ `src/config/environment.ts` - line 44
   - Changed from: `http://localhost:5000/api`
   - Changed to: `http://192.168.1.34:5000/api`

2. ✅ `src/config/backend.ts` - line 13
   - Changed from: `http://localhost:5000/api`
   - Changed to: `http://192.168.1.34:5000/api`

3. ✅ `src/services/socketService.ts` - line 87
   - Fixed to handle both `/api/v1` and `/api` removal

## Testing Checklist

### Backend Tests
- [x] Backend running on port 5000
- [x] Health endpoint accessible: `curl http://192.168.1.34:5000/health`
- [x] Health endpoint from phone browser: `http://192.168.1.34:5000/health`
- [ ] API endpoint accessible: `curl http://192.168.1.34:5000/api/auth/health`

### Frontend Tests
- [ ] Expo app restarted with --clear flag
- [ ] App shows "Backend connection established successfully"
- [ ] No "Backend connection failed" warnings
- [ ] SMS verification shows alert popup

## Troubleshooting Steps

### If Connection Still Fails:

1. **Clear Metro Bundler Cache**
   ```bash
   npx expo start --clear
   ```

2. **Close and Reopen Expo Go App**
   - Force close Expo Go on phone
   - Reopen and scan QR code again

3. **Verify Network Configuration**
   ```bash
   ipconfig
   netstat -ano | findstr :5000
   ```

4. **Test Backend API Endpoint**
   ```bash
   curl http://192.168.1.34:5000/api/auth/health
   ```

5. **Check Firewall** (if needed)
   ```powershell
   netsh advfirewall firewall add rule name="Node.js Server Port 5000" dir=in action=allow protocol=TCP localport=5000
   ```

## Expected Behavior

### Before Fix
```
LOG  [2025-10-12T12:XX:XX.XXX] [WARN] ⚠️ Backend connection failed
```

### After Fix
```
LOG  [2025-10-12T12:XX:XX.XXX] [INFO] 🚀 Backend connection established successfully
LOG  🌍 Environment initialized: {"apiUrl": "http://192.168.1.34:5000/api", ...}
```

## Common Issues

### Issue 1: App Not Reloading
**Solution**: Completely close Expo Go, clear cache, restart
```bash
npx expo start --clear
```

### Issue 2: Cached Configuration
**Solution**: Clear AsyncStorage or reinstall app

### Issue 3: Firewall Blocking
**Solution**: Add firewall rule or temporarily disable Windows Firewall

### Issue 4: Wrong Network
**Solution**: Ensure phone and PC are on same WiFi network

## Next Steps

1. Restart Expo with cache clear: `npx expo start --clear`
2. Check logs for "Backend connection established successfully"
3. Test SMS verification functionality
4. Verify all API calls work correctly


