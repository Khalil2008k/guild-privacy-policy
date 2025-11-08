# 🚀 Backend Deployment Instructions

## Issue Identified

The frontend is hitting the production backend on Render (`https://guild-yf7q.onrender.com`), but the production backend **hasn't been redeployed** with the new coin purchase routes and Sadad integration.

## Build Status: ✅ SUCCESSFUL

All TypeScript compilation errors have been fixed:
- ✅ `admin-system.ts` - Added `logger` import
- ✅ `coin-job.routes.ts` - Added `admin` import and replaced `getFirestore()` with `admin.firestore()`
- ✅ `coin-purchase.routes.ts` - Fixed webhook retry type (`'psp'` instead of `'sadad'`) and `router.handle` issue
- ✅ `contracts.ts` - Fixed import (`sanitizeContractContent` instead of `sanitizeContractTerms`)
- ✅ `sanitize.ts` - Added type assertions for generic return values
- ✅ `admin-manual-payments.ts` - Added `admin` import at top level

**Backend builds successfully with no errors!**

---

## Deployment Options

### Option 1: Deploy to Render (Recommended)

Since your backend is already hosted on Render at `https://guild-yf7q.onrender.com`, you need to:

1. **Push the latest backend code to your Git repository:**
   ```powershell
   cd GUILD-3
   git add .
   git commit -m "feat: Add Sadad payment integration, advanced security features, and coin purchase system"
   git push origin main
   ```

2. **Trigger Render deployment:**
   - Render automatically deploys when you push to the connected branch
   - Or manually trigger deployment from Render Dashboard:
     - Go to https://dashboard.render.com
     - Select your backend service
     - Click "Manual Deploy" → "Deploy latest commit"

3. **Monitor deployment:**
   - Check deployment logs in Render Dashboard
   - Verify the build succeeds
   - Wait for the service to become "Live"

4. **Verify deployment:**
   ```powershell
   # Test health endpoint
   curl https://guild-yf7q.onrender.com/health
   
   # Test coin purchase endpoint (should return 401 Unauthorized without auth, not 404)
   curl -X POST https://guild-yf7q.onrender.com/api/coins/purchase
   ```

---

### Option 2: Run Backend Locally (For Testing)

If you want to test locally before deploying to production:

1. **Start local backend:**
   ```powershell
   cd GUILD-3/backend
   npm run dev
   ```

2. **Update frontend config to use local backend:**
   ```typescript
   // src/config/backend.ts
   const BACKEND_CONFIG = {
     baseURL: 'http://localhost:3000',  // Change from Render URL
     timeout: 10000,
     retries: 3,
   };
   ```

3. **Restart frontend:**
   ```powershell
   cd GUILD-3
   npm start
   ```

4. **Test coin purchase flow**

5. **Remember to change backend URL back to production before building for production!**

---

## Environment Variables Required

Make sure these environment variables are set in your Render service:

### Payment & Security
- `SADAD_SECRET_KEY` = `kOGQrmkFr5LcNW9c`
- `SADAD_WEBHOOK_SECRET` = (generate a secure random string)
- `PAYMENT_ENCRYPTION_KEY` = (32-byte hex string for AES-256-CBC)

### Firebase
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_DATABASE_URL`

### Other
- `JWT_SECRET`
- `NODE_ENV` = `production`
- `PORT` = `3000` (or Render's default)

---

## Verification Checklist

After deployment, verify:

1. ✅ Backend is running: `https://guild-yf7q.onrender.com/health`
2. ✅ Coin purchase endpoint exists: `POST /api/coins/purchase` (should return 401, not 404)
3. ✅ Sadad webhook endpoint exists: `POST /api/coins/webhook/sadad`
4. ✅ Security tests pass (run locally before deploying)
5. ✅ Frontend can connect to backend
6. ✅ Coin purchase flow works end-to-end

---

## Current Status

- ✅ Backend code is ready
- ✅ TypeScript compiles without errors
- ✅ All security tests passing (20/20)
- ⏳ **Awaiting deployment to Render**

---

## Next Steps

1. **Deploy backend to Render** (Option 1 above)
2. **Verify deployment** using the checklist above
3. **Test coin purchase flow** from the mobile app
4. **Monitor logs** for any issues

---

**Note:** The frontend is currently configured to hit production backend on Render. Until you redeploy the backend, the `/api/coins/purchase` endpoint will return 404 Not Found.


