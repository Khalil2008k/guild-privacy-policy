# Guild Admin Portal - Deployment Guide

## 🚀 Quick Deployment Steps

### 1. **Setup Firebase Indexes (REQUIRED)**

The admin portal requires Firestore composite indexes for complex queries. You have two options:

#### Option A: Auto-create indexes (Recommended)
1. Run the admin portal and navigate to pages that trigger queries
2. Firebase will show index creation links in the console errors
3. Click the links to auto-create indexes in Firebase Console

#### Option B: Deploy indexes manually
```bash
# Install Firebase CLI if not installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project (if not done)
firebase init firestore

# Deploy indexes
firebase deploy --only firestore:indexes
```

### 2. **Build for Production**
```bash
# Build optimized production version
npm run build
```

### 3. **Deploy to Firebase Hosting**
```bash
# Initialize hosting (if not done)
firebase init hosting

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### 4. **Setup Admin Users**

In Firebase Console, add custom claims to admin users:

```javascript
// In Firebase Functions or Admin SDK
admin.auth().setCustomUserClaims(uid, { 
  role: 'super_admin' // or 'admin' or 'moderator'
});
```

## 🔧 **Environment Configuration**

### Production Environment Variables
Create `.env.production` file:
```env
REACT_APP_FIREBASE_API_KEY=your_production_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_production_domain
REACT_APP_FIREBASE_PROJECT_ID=your_production_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_production_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_production_sender_id
REACT_APP_FIREBASE_APP_ID=your_production_app_id
```

### Development Environment
The portal uses Guild's Firebase config by default for development.

## 🛡️ **Security Setup**

### 1. Firestore Security Rules
Deploy the included security rules:
```bash
firebase deploy --only firestore:rules
```

### 2. Admin Role Setup
Set up admin roles in Firebase Auth:

```javascript
// Example: Set user as super admin
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.setAdminRole = functions.https.onCall(async (data, context) => {
  // Verify caller is already a super admin
  if (!context.auth?.token?.role === 'super_admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only super admins can set roles');
  }
  
  await admin.auth().setCustomUserClaims(data.uid, { 
    role: data.role // 'super_admin', 'admin', or 'moderator'
  });
  
  return { success: true };
});
```

## 📊 **Required Firestore Indexes**

The following composite indexes are required:

### Jobs Collection
- `adminStatus` (ASC) + `createdAt` (DESC)
- `status` (ASC) + `createdAt` (DESC)
- `category` (ASC) + `createdAt` (DESC)
- `isUrgent` (ASC) + `createdAt` (DESC)
- `clientId` (ASC) + `createdAt` (DESC)

### Users Collection
- `status` (ASC) + `joinDate` (DESC)
- `verificationStatus` (ASC) + `joinDate` (DESC)
- `rank` (ASC) + `joinDate` (DESC)

### Transactions Collection
- `status` (ASC) + `createdAt` (DESC)

## 🚨 **Troubleshooting**

### Index Errors
If you see "The query requires an index" errors:
1. Copy the index creation URL from the error
2. Open it in your browser to create the index
3. Wait 2-3 minutes for the index to build
4. Refresh the admin portal

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

### Authentication Issues
1. Verify Firebase config is correct
2. Check user has admin role custom claims
3. Ensure Firestore rules allow admin access

## 🌐 **Custom Domain Setup**

1. **Add Custom Domain in Firebase Console:**
   - Go to Firebase Console > Hosting
   - Add custom domain (e.g., admin.yourdomain.com)
   - Follow DNS configuration steps

2. **SSL Certificate:**
   - Firebase automatically provisions SSL certificates
   - May take up to 24 hours to activate

## 🔄 **Continuous Deployment**

### GitHub Actions Example
```yaml
name: Deploy Admin Portal
on:
  push:
    branches: [main]
    paths: ['admin-portal/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        working-directory: ./admin-portal
        run: npm install --legacy-peer-deps
      
      - name: Build
        working-directory: ./admin-portal
        run: npm run build
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: guild-4f46b
          channelId: live
          entryPoint: ./admin-portal
```

## 📈 **Performance Optimization**

### 1. Enable Firestore Caching
```javascript
// In firebase.ts
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';

const db = initializeFirestore(app, {
  localCache: persistentLocalCache()
});
```

### 2. Bundle Optimization
- Code splitting is already enabled
- Lazy loading for routes
- Chart.js tree shaking

### 3. CDN Configuration
Firebase Hosting automatically provides:
- Global CDN
- Gzip compression
- HTTP/2 support
- Automatic SSL

## 🎯 **Production Checklist**

- [ ] Firebase indexes deployed
- [ ] Security rules deployed
- [ ] Admin users configured with roles
- [ ] Custom domain configured (optional)
- [ ] Environment variables set
- [ ] Build completed successfully
- [ ] Hosting deployed
- [ ] SSL certificate active
- [ ] Admin portal accessible
- [ ] All features tested in production

## 📞 **Support**

For deployment issues:
1. Check Firebase Console logs
2. Verify Firestore rules and indexes
3. Test with demo credentials first
4. Check browser console for errors

The admin portal is designed to be production-ready with proper error handling and graceful fallbacks for missing indexes.
