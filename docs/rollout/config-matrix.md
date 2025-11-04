# 🔐 GUILD — Configuration Matrix (Deliverable G)

**Generated:** 2025-01-15  
**Last Updated:** 2025-01-15

---

## Environment Configuration

### Development (`env.development`)

```bash
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyD5i6jUePndKyW1AYI0ANrizNpNzGJ6d3w
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=guild-4f46b.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=guild-4f46b
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=guild-4f46b.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=654144998705
EXPO_PUBLIC_FIREBASE_APP_ID=1:654144998705:web:880f16df9efe0ad4853410
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-3F86RQH389

# Backend API Configuration
EXPO_PUBLIC_API_URL=https://guild-yf7q.onrender.com/api
EXPO_PUBLIC_WS_URL=https://guild-yf7q.onrender.com

# Feature Flags
EXPO_PUBLIC_ENABLE_ANALYTICS=false
EXPO_PUBLIC_ENABLE_CRASHLYTICS=false
EXPO_PUBLIC_ENABLE_DEBUG_MODE=true
EXPO_PUBLIC_ENABLE_TEST_DATA=true
EXPO_PUBLIC_ENABLE_BETA_FEATURES=true

# Logging
LOG_LEVEL=debug
ENABLE_CONSOLE_LOGGING=true
ENABLE_REMOTE_LOGGING=false
```

### Preview/Staging (`env.preview`)

```bash
# Firebase Configuration (Staging Project)
EXPO_PUBLIC_FIREBASE_API_KEY=<staging-api-key>
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=guild-staging.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=guild-staging
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=guild-staging.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<staging-sender-id>
EXPO_PUBLIC_FIREBASE_APP_ID=<staging-app-id>
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=<staging-measurement-id>

# Backend API Configuration
EXPO_PUBLIC_API_URL=https://guild-staging.onrender.com/api
EXPO_PUBLIC_WS_URL=https://guild-staging.onrender.com

# Feature Flags
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_CRASHLYTICS=true
EXPO_PUBLIC_ENABLE_DEBUG_MODE=true
EXPO_PUBLIC_ENABLE_TEST_DATA=false
EXPO_PUBLIC_ENABLE_BETA_FEATURES=true

# Logging
LOG_LEVEL=info
ENABLE_CONSOLE_LOGGING=true
ENABLE_REMOTE_LOGGING=true
```

### Production (`env.production`)

```bash
# Firebase Configuration (Production Project)
EXPO_PUBLIC_FIREBASE_API_KEY=<production-api-key>
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=guild-prod.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=guild-prod
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=guild-prod.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<production-sender-id>
EXPO_PUBLIC_FIREBASE_APP_ID=<production-app-id>
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=<production-measurement-id>

# Backend API Configuration
EXPO_PUBLIC_API_URL=https://guild-prod.onrender.com/api
EXPO_PUBLIC_WS_URL=https://guild-prod.onrender.com

# Feature Flags
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_CRASHLYTICS=true
EXPO_PUBLIC_ENABLE_DEBUG_MODE=false
EXPO_PUBLIC_ENABLE_TEST_DATA=false
EXPO_PUBLIC_ENABLE_BETA_FEATURES=false

# Logging
LOG_LEVEL=warn
ENABLE_CONSOLE_LOGGING=false
ENABLE_REMOTE_LOGGING=true
```

---

## Firebase Console Configuration

### Android Configuration

#### SHA-1/SHA-256 Certificates
**Location:** Firebase Console → Project Settings → Your Apps → Android App

**Required Certificates:**
- **Debug:** Development keystore SHA-1/SHA-256
- **Release:** Production keystore SHA-1/SHA-256

**How to Get SHA-1:**
```bash
# Debug keystore
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Release keystore
keytool -list -v -keystore <path-to-release-keystore> -alias <alias-name>
```

#### SafetyNet/Play Integrity
**Location:** Firebase Console → App Check → Android App

**Configuration:**
- ✅ Enable Play Integrity API (Production)
- ✅ Enable SafetyNet (Legacy, for older devices)
- ⚠️ Require App Check: Enable for production, disable for development

### iOS Configuration

#### APNs Certificates (If Using Push Notifications)
**Location:** Firebase Console → Project Settings → Your Apps → iOS App

**Required:**
- APNs Authentication Key (`.p8` file)
- OR APNs Certificate (`.p12` file)

**Configuration Steps:**
1. Generate APNs key in Apple Developer Portal
2. Upload to Firebase Console
3. Configure in `app.config.js`:
```javascript
ios: {
  config: {
    usesNonExemptEncryption: false
  }
}
```

---

## Backend Environment Variables (Render)

### Required Environment Variables

```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=guild-4f46b
FIREBASE_CLIENT_EMAIL=<service-account-email>
FIREBASE_PRIVATE_KEY=<service-account-private-key>

# JWT Secret
JWT_SECRET=<jwt-secret-key>

# Database (if using PostgreSQL)
DATABASE_URL=<postgresql-connection-string>

# Redis (if using)
REDIS_URL=<redis-connection-string>

# Twilio (if using SMS)
TWILIO_ACCOUNT_SID=<twilio-account-sid>
TWILIO_AUTH_TOKEN=<twilio-auth-token>
TWILIO_PHONE_NUMBER=<twilio-phone-number>

# Environment
NODE_ENV=production
PORT=5000

# Health Check
HEALTH_CHECK_PATH=/health
```

### Render Configuration Steps

1. **Go to Render Dashboard:** https://dashboard.render.com
2. **Select Service:** Guild Backend Service
3. **Go to Environment:** Settings → Environment
4. **Add Variables:** Click "Add Environment Variable"
5. **Copy-Paste:** Use values from above
6. **Save:** Click "Save Changes"
7. **Redeploy:** Service will auto-redeploy

---

## Feature Flags

### Mobile App Feature Flags

**Location:** `src/config/environment.ts`

```typescript
features: {
  enableAnalytics: boolean;
  enableCrashlytics: boolean;
  enablePerformanceMonitoring: boolean;
  enableDebugMode: boolean;
  enableTestData: boolean;
  enableBetaFeatures: boolean;
  enableAppCheck: boolean;
}
```

### Backend Feature Flags

**Location:** Firestore Collection: `feature_flags/{flagId}`

```typescript
{
  name: string;
  enabled: boolean;
  environments: string[]; // ['development', 'staging', 'production']
  rolloutPercentage: number; // 0-100
}
```

---

## Security Checklist

### ✅ Secrets Not in Code
- [ ] Firebase API keys moved to environment variables
- [ ] Service account keys in backend env vars only
- [ ] JWT secrets in backend env vars only
- [ ] No hardcoded passwords or tokens

### ✅ Transport Security
- [ ] HTTPS enabled for all API calls
- [ ] WebSocket connections use WSS
- [ ] Certificate pinning (optional, for high security)

### ✅ Header Validation
- [ ] Authorization header validated on backend
- [ ] CORS configured correctly
- [ ] Rate limiting enabled

---

## Build Configuration

### Expo Go vs Dev Build vs Production

#### Expo Go
**Configuration:** Default `expo start`
- ✅ No native modules
- ✅ Firebase Web SDK only
- ✅ Mock SMS fallback
- ❌ No real SMS
- ❌ Limited Firebase features

#### Dev Build (EAS)
**Configuration:** `eas build --profile preview`
- ✅ Native modules available
- ✅ Real SMS support
- ✅ Full Firebase features
- ✅ Production-like environment

#### Production Build
**Configuration:** `eas build --profile production`
- ✅ All features enabled
- ✅ App Check enforced
- ✅ Analytics enabled
- ✅ Crashlytics enabled

---

## Validation Checklist

### Pre-Deployment
- [ ] All environment variables set
- [ ] Firebase project configured
- [ ] Backend environment variables set
- [ ] Health check endpoint working
- [ ] Firestore rules deployed
- [ ] Storage rules deployed
- [ ] Firestore indexes created
- [ ] Android SHA certificates added
- [ ] iOS APNs configured (if needed)

### Post-Deployment
- [ ] App connects to Firebase
- [ ] Backend API responds
- [ ] Push notifications work
- [ ] SMS authentication works (Dev Build)
- [ ] File uploads work
- [ ] Chat real-time updates work
- [ ] No permission errors in logs

---

## Quick Reference

### Firebase Console URLs
- **Project:** https://console.firebase.google.com/project/guild-4f46b
- **Firestore Rules:** https://console.firebase.google.com/project/guild-4f46b/firestore/rules
- **Storage Rules:** https://console.firebase.google.com/project/guild-4f46b/storage/rules
- **Indexes:** https://console.firebase.google.com/project/guild-4f46b/firestore/indexes

### Render Dashboard
- **Backend Service:** https://dashboard.render.com/web/guild-yf7q
- **Logs:** https://dashboard.render.com/web/guild-yf7q/logs
- **Environment:** https://dashboard.render.com/web/guild-yf7q/env

### EAS Dashboard
- **Builds:** https://expo.dev/accounts/mazen123333/projects/guild-2/builds
- **Credentials:** https://expo.dev/accounts/mazen123333/projects/guild-2/credentials

---

**Status:** Configuration Matrix complete ✅










