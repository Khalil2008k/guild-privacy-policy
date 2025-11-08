# 🚀 Step-by-Step Deployment Guide

**AI Support Chat System - Complete Deployment Instructions**

---

## 📋 Prerequisites

Before deploying, ensure you have:

1. ✅ Firebase CLI installed
2. ✅ Logged into Firebase
3. ✅ Node.js 18+ installed
4. ✅ Access to Firebase project: `guild-4f46b`

---

## 🔧 Step 1: Verify Firebase CLI Installation

Open PowerShell/Terminal and run:

```bash
firebase --version
```

**Expected Output:** Should show Firebase CLI version (e.g., `13.0.0`)

**If not installed:**
```bash
npm install -g firebase-tools
```

---

## 🔐 Step 2: Login to Firebase

```bash
firebase login
```

**Expected Output:** Browser opens → Select your Google account → "Success! Logged in as [your-email]"

**Verify login:**
```bash
firebase projects:list
```

**Expected Output:** Should show `guild-4f46b` in the list

---

## 📦 Step 3: Navigate to Functions Directory

```bash
cd GUILD-3/backend/functions
```

**Verify you're in the right directory:**
```bash
pwd
# Should show: .../GUILD-3/backend/functions
```

---

## 🔨 Step 4: Install Dependencies

```bash
npm install
```

**Expected Output:** Dependencies installed successfully

**Verify:**
```bash
ls node_modules
# Should show: firebase-admin, firebase-functions, etc.
```

---

## 🏗️ Step 5: Build Functions

```bash
npm run build
```

**Expected Output:** 
```
> guild-functions@1.0.0 build
> tsc
```

**Verify build:**
```bash
ls lib
# Should show: index.js, supportChat.js, etc.
```

**If build fails:**
- Check TypeScript errors
- Ensure all imports are correct
- Verify `tsconfig.json` exists (may need to create one)

---

## 🚀 Step 6: Deploy Firebase Function

**Option A: Deploy only the support chat function**
```bash
firebase deploy --only functions:createSupportChat
```

**Option B: Deploy all functions**
```bash
firebase deploy --only functions
```

**Expected Output:**
```
=== Deploying to 'guild-4f46b'...

i  deploying functions
i  functions: ensuring required API cloudfunctions.googleapis.com is enabled...
i  functions: ensuring required API cloudresourcemanager.googleapis.com is enabled...
✓  functions: required APIs are enabled
i  functions: preparing functions directory for uploading...
i  functions: packaged functions (XXX.XX KB) for uploading
✓  functions: createSupportChat function deployed successfully

✔  Deploy complete!
```

**Verify deployment:**
1. Go to [Firebase Console](https://console.firebase.google.com/project/guild-4f46b/functions)
2. Check that `createSupportChat` function appears in the list
3. Verify it's enabled and has the correct trigger (Auth user creation)

---

## 🔒 Step 7: Deploy Firestore Rules

**Navigate to project root:**
```bash
cd ../../..
# Should be in: GUILD-3/
```

**Verify Firestore rules file exists:**
```bash
ls firestore.rules
# Should show: firestore.rules
```

**Deploy rules:**
```bash
firebase deploy --only firestore:rules
```

**Expected Output:**
```
=== Deploying to 'guild-4f46b'...

i  deploying firestore
i  firestore: checking firestore.rules for compilation errors...
✓  firestore: rules file firestore.rules compiled successfully
i  firestore: uploading rules firestore.rules...
✓  firestore: released rules firestore.rules to firestore

✔  Deploy complete!
```

**Verify deployment:**
1. Go to [Firebase Console → Firestore → Rules](https://console.firebase.google.com/project/guild-4f46b/firestore/rules)
2. Verify the rules are updated
3. Check that support chat protection rules are present

---

## 🧪 Step 8: Test the System

### Test 1: Create a New User

**Option A: Using Firebase Console**
1. Go to [Firebase Console → Authentication](https://console.firebase.google.com/project/guild-4f46b/authentication/users)
2. Click "Add user"
3. Enter email and password
4. Click "Add user"

**Option B: Using Your App**
1. Open your app
2. Sign up with a new email
3. Complete registration

### Test 2: Verify Support Chat Creation

**Check Firestore:**
1. Go to [Firebase Console → Firestore](https://console.firebase.google.com/project/guild-4f46b/firestore/data)
2. Navigate to `chats` collection
3. Look for document ID: `support_{userId}`
4. Verify the document has:
   - `pinned: true`
   - `undeletable: true`
   - `type: 'support'`
   - `ai_agent: 'IDE_AI'`
   - `participants: [userId, 'support_bot']`

**Check Messages:**
1. In the same chat document, open `messages` subcollection
2. Verify there's a welcome message from `support_bot`
3. Check message content includes welcome text

**Check Function Logs:**
1. Go to [Firebase Console → Functions → Logs](https://console.firebase.google.com/project/guild-4f46b/functions/logs)
2. Look for log entry: `✅ Support chat created for user {userId}`
3. Verify no errors occurred

### Test 3: Verify in App

1. Open your app
2. Navigate to chat list
3. Verify support chat appears at the top (pinned)
4. Try to delete support chat → Should fail
5. Try to unpin support chat → Should fail
6. Open support chat → Should show welcome message

---

## 🐛 Troubleshooting

### Issue: Firebase CLI not found

**Solution:**
```bash
npm install -g firebase-tools
```

### Issue: Not logged in

**Solution:**
```bash
firebase login
```

### Issue: Wrong project

**Solution:**
```bash
firebase use guild-4f46b
```

### Issue: Build fails

**Solution:**
1. Check TypeScript errors:
   ```bash
   npm run build
   ```
2. Verify `tsconfig.json` exists in `backend/functions/`
3. Check all imports are correct

### Issue: Function deployment fails

**Solution:**
1. Check function logs:
   ```bash
   firebase functions:log
   ```
2. Verify function is exported in `index.ts`
3. Check Firebase Console for errors

### Issue: Rules deployment fails

**Solution:**
1. Check rules syntax:
   ```bash
   firebase deploy --only firestore:rules --debug
   ```
2. Verify `firestore.rules` file exists
3. Check rules for syntax errors

### Issue: Support chat not created

**Solution:**
1. Check function logs in Firebase Console
2. Verify function is enabled
3. Check function trigger (should be Auth user creation)
4. Verify Firestore permissions allow function to write

### Issue: Support chat can be deleted

**Solution:**
1. Verify Firestore rules are deployed
2. Check rules include support chat protection
3. Test rules in Firebase Console → Rules Playground

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Firebase Function `createSupportChat` is deployed
- [ ] Function is enabled in Firebase Console
- [ ] Function trigger is set to "Auth user creation"
- [ ] Firestore rules are deployed
- [ ] Support chat protection rules are present
- [ ] New user signup creates support chat
- [ ] Support chat appears in app chat list
- [ ] Support chat cannot be deleted
- [ ] Support chat cannot be unpinned
- [ ] Welcome message is created
- [ ] Function logs show success

---

## 📊 Monitoring

### Function Logs
```bash
firebase functions:log
```

### Real-time Monitoring
1. Go to [Firebase Console → Functions](https://console.firebase.google.com/project/guild-4f46b/functions)
2. Click on `createSupportChat`
3. View "Logs" tab for real-time logs

### Firestore Activity
1. Go to [Firebase Console → Firestore](https://console.firebase.google.com/project/guild-4f46b/firestore/data)
2. Monitor `chats` collection for new support chats

---

## 🎉 Success!

If all steps complete successfully, your AI Support Chat System is now live!

**Next Steps:**
1. Monitor function logs for any errors
2. Test with multiple new users
3. Verify WebSocket connection works
4. Test AI streaming responses

---

**Created:** November 7, 2025  
**Status:** ✅ Ready for deployment  
**Project:** guild-4f46b


