# 🔄 Migrate Support Chats for Existing Users

**One-time migration to create support chats for all existing users**

---

## 📋 Overview

This migration script will:
- ✅ Find all existing users in Firestore
- ✅ Check if they already have a support chat
- ✅ Create support chats for users who don't have one
- ✅ Add welcome messages to each new chat
- ✅ Update user documents with `support_chat_id`

---

## 🚀 Deployment Steps

### Step 1: Deploy Migration Function

```bash
cd GUILD-3
firebase deploy --only functions:migrateSupportChats
```

**Expected Output:**
```
=== Deploying to 'guild-4f46b'...
✓  functions[migrateSupportChats(us-central1)] Successful create operation.
+  Deploy complete!
```

---

## 🎯 Running the Migration

### Option A: Via HTTP Request (Recommended)

**Get the function URL:**
1. Go to [Firebase Console → Functions](https://console.firebase.google.com/project/guild-4f46b/functions)
2. Find `migrateSupportChats`
3. Copy the function URL

**Trigger the migration:**
```bash
# Using curl
curl -X POST https://us-central1-guild-4f46b.cloudfunctions.net/migrateSupportChats

# Or open in browser (GET request also works)
# https://us-central1-guild-4f46b.cloudfunctions.net/migrateSupportChats
```

### Option B: Via Firebase CLI

```bash
firebase functions:call migrateSupportChats
```

### Option C: Via Firebase Console

1. Go to [Firebase Console → Functions](https://console.firebase.google.com/project/guild-4f46b/functions)
2. Click on `migrateSupportChats`
3. Click "Test function"
4. Click "Test"

---

## 📊 Monitoring Progress

### View Logs in Real-Time

```bash
firebase functions:log --only migrateSupportChats
```

### View in Firebase Console

1. Go to [Firebase Console → Functions → Logs](https://console.firebase.google.com/project/guild-4f46b/functions/logs)
2. Filter by `migrateSupportChats`
3. Watch for progress updates:
   - `🚀 Starting support chat migration...`
   - `📊 Found X users to process`
   - `🔄 Processing batch X/Y...`
   - `✅ Created support chat for user...`
   - `✅ Migration completed!`

---

## ✅ Expected Results

After migration completes, you'll see a response like:

```json
{
  "success": true,
  "message": "Support chat migration completed",
  "results": {
    "totalUsers": 150,
    "existingChats": 5,
    "createdChats": 145,
    "errors": [],
    "startTime": "2025-11-07T14:00:00.000Z",
    "endTime": "2025-11-07T14:02:30.000Z",
    "duration": 150.5
  }
}
```

---

## 🔍 Verification

### Check Firestore

1. Go to [Firebase Console → Firestore](https://console.firebase.google.com/project/guild-4f46b/firestore/data)
2. Navigate to `chats` collection
3. Filter by `type == 'support'`
4. Verify all users have a support chat document

### Check User Documents

1. Go to `users` collection
2. Check a few user documents
3. Verify they have `support_chat_id` field

### Check Messages

1. Open a support chat document
2. Check `messages` subcollection
3. Verify welcome message exists

---

## 🐛 Troubleshooting

### Issue: Function times out

**Solution:**
- The function processes users in batches
- For very large user bases (>1000 users), it may take several minutes
- Check logs for progress updates
- The function will continue processing even if it times out (check Firestore for results)

### Issue: Some users don't have support chats

**Solution:**
1. Check function logs for errors
2. Re-run the migration (it will skip existing chats)
3. Manually create chats for users with errors

### Issue: Duplicate support chats

**Solution:**
- The function checks for existing chats before creating new ones
- If duplicates exist, they won't be created again
- You can manually delete duplicates if needed

### Issue: Function not found

**Solution:**
1. Verify deployment was successful:
   ```bash
   firebase functions:list
   ```
2. Check function appears in Firebase Console
3. Redeploy if necessary:
   ```bash
   firebase deploy --only functions:migrateSupportChats
   ```

---

## 📝 Post-Migration

### Clean Up (Optional)

After successful migration, you can:

1. **Delete the migration function** (optional):
   ```bash
   firebase functions:delete migrateSupportChats
   ```

2. **Or keep it** for future migrations if needed

### Verify Future Users

1. Create a test user account
2. Verify support chat is created automatically (via `createSupportChat` function)
3. Check function logs for `createSupportChat` trigger

---

## 🎉 Success!

Once migration completes:
- ✅ All existing users have support chats
- ✅ Future users will get support chats automatically
- ✅ System is ready for production use

---

**Created:** November 7, 2025  
**Status:** ✅ Ready for deployment  
**Project:** guild-4f46b



