# 🔧 **RENDER ENVIRONMENT VARIABLES - EXACT STEPS**

> **What to do in Render Dashboard - Step by Step**

---

## 📋 **STEP 1: GENERATE SECURE VALUES**

Open your terminal/PowerShell and run these commands **one at a time**:

### **Command 1: Generate COIN_ENCRYPTION_KEY**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
**Copy the output** (should be 64 characters long)

Example output:
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

---

### **Command 2: Generate COIN_SIGNATURE_SECRET**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
**Copy the output** (should be 128 characters long)

Example output:
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

---

### **Command 3: Generate COIN_SALT**
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```
**Copy the output** (should be 32 characters long)

Example output:
```
a1b2c3d4e5f6789012345678901234
```

---

## 🌐 **STEP 2: GO TO RENDER DASHBOARD**

1. Open your browser
2. Go to: **https://dashboard.render.com**
3. Log in to your account

---

## 🎯 **STEP 3: FIND YOUR BACKEND SERVICE**

1. You'll see a list of your services
2. Look for your backend service (probably named something like **"guild-backend"** or **"guild-yf7q"**)
3. **Click on it**

---

## ⚙️ **STEP 4: GO TO ENVIRONMENT SECTION**

On the left sidebar, you'll see:
- Overview
- Events
- Logs
- Shell
- **Environment** ← **CLICK THIS**
- Settings
- etc.

**Click on "Environment"**

---

## ➕ **STEP 5: ADD THE 3 ENVIRONMENT VARIABLES**

You'll see a section that says **"Environment Variables"** with existing variables like:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- etc.

### **Add Variable 1:**
1. Click the **"Add Environment Variable"** button
2. In the **Key** field, type: `COIN_ENCRYPTION_KEY`
3. In the **Value** field, paste the **64-character hex** from Command 1
4. Click **"Save Changes"** (or it might auto-save)

### **Add Variable 2:**
1. Click **"Add Environment Variable"** again
2. In the **Key** field, type: `COIN_SIGNATURE_SECRET`
3. In the **Value** field, paste the **128-character hex** from Command 2
4. Click **"Save Changes"**

### **Add Variable 3:**
1. Click **"Add Environment Variable"** again
2. In the **Key** field, type: `COIN_SALT`
3. In the **Value** field, paste the **32-character hex** from Command 3
4. Click **"Save Changes"**

---

## 💾 **STEP 6: SAVE AND DEPLOY**

After adding all 3 variables:

1. Look for a **"Save Changes"** button at the top or bottom
2. **Click it**
3. Render will show a message like: **"Your service will be redeployed with the new environment variables"**
4. Click **"Yes, redeploy"** or **"Confirm"**

---

## ⏳ **STEP 7: WAIT FOR DEPLOYMENT**

1. Render will automatically redeploy your backend
2. You'll see the deployment progress in the **"Events"** tab
3. Wait for it to show: **"Deploy succeeded"** (usually takes 2-5 minutes)
4. Status will change from **"Building"** → **"Deploying"** → **"Live"**

---

## ✅ **STEP 8: VERIFY IT WORKED**

### **Check Environment Variables:**
1. Go back to **"Environment"** tab
2. You should see all 3 new variables:
   ```
   COIN_ENCRYPTION_KEY     ••••••••••••••••••••••••
   COIN_SIGNATURE_SECRET   ••••••••••••••••••••••••
   COIN_SALT               ••••••••••••••••••••••••
   ```
   (Values will be hidden with dots for security)

### **Check Backend Health:**
Open your browser and go to:
```
https://guild-yf7q.onrender.com/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2025-10-22T..."
}
```

---

## 🧪 **STEP 9: TEST COIN SYSTEM (OPTIONAL)**

If you want to test that the coin system is working:

### **Option 1: Test via Browser (Easy)**
Go to:
```
https://guild-yf7q.onrender.com/api/coins/catalog
```

You should see:
```json
{
  "GBC": {"value": 5, "name": "Guild Bronze Coin", ...},
  "GSC": {"value": 10, "name": "Guild Silver Coin", ...},
  ...
}
```

### **Option 2: Test Coin Purchase (Advanced)**
You'll need a Firebase authentication token for this. Skip for now if you don't have one.

---

## 📸 **VISUAL GUIDE**

### **What the Environment Tab Looks Like:**

```
┌─────────────────────────────────────────────────────┐
│  Environment Variables                              │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │ Key                    │ Value              │  │
│  ├─────────────────────────────────────────────┤  │
│  │ FIREBASE_PROJECT_ID    │ guild-4f46b        │  │
│  │ FIREBASE_CLIENT_EMAIL  │ firebase-admin...  │  │
│  │ COIN_ENCRYPTION_KEY    │ ••••••••••••••••   │  │ ← NEW
│  │ COIN_SIGNATURE_SECRET  │ ••••••••••••••••   │  │ ← NEW
│  │ COIN_SALT              │ ••••••••••••••••   │  │ ← NEW
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  [+ Add Environment Variable]                      │
│                                                     │
│  [Save Changes]                                    │
└─────────────────────────────────────────────────────┘
```

---

## ⚠️ **IMPORTANT NOTES**

### **Security:**
- ✅ Never share these values with anyone
- ✅ Never commit them to Git
- ✅ Keep them secret and secure
- ✅ Render hides them automatically (shows as dots)

### **Length Check:**
- `COIN_ENCRYPTION_KEY`: Must be **exactly 64 characters**
- `COIN_SIGNATURE_SECRET`: Must be **exactly 128 characters**
- `COIN_SALT`: Must be **exactly 32 characters**

If they're not the right length, the coin system won't work!

### **After Adding:**
- ✅ Render will automatically redeploy
- ✅ Wait for deployment to complete
- ✅ Backend will restart with new variables
- ✅ Coin system will be fully operational

---

## 🆘 **TROUBLESHOOTING**

### **Problem: Can't find "Environment" tab**
- Make sure you clicked on your backend service (not frontend)
- Look for the service with URL: `guild-yf7q.onrender.com`

### **Problem: "Save Changes" button is grayed out**
- Make sure all 3 variables have both Key and Value filled
- Try refreshing the page

### **Problem: Deployment failed**
- Check the "Logs" tab for errors
- Make sure the values are the correct length
- Try redeploying manually from "Manual Deploy" button

### **Problem: Backend still not working**
- Wait 5 minutes for full deployment
- Check health endpoint: `https://guild-yf7q.onrender.com/health`
- Check logs for any errors

---

## ✅ **CHECKLIST**

Before you're done, verify:

- [ ] Generated all 3 secure values
- [ ] Added `COIN_ENCRYPTION_KEY` (64 chars)
- [ ] Added `COIN_SIGNATURE_SECRET` (128 chars)
- [ ] Added `COIN_SALT` (32 chars)
- [ ] Clicked "Save Changes"
- [ ] Waited for deployment to complete
- [ ] Verified backend health endpoint works
- [ ] Verified coin catalog endpoint works

---

## 🎉 **DONE!**

Once all 3 variables are added and the backend is redeployed:

**Your advanced coin system is LIVE! 🚀**

The coin system will now:
- ✅ Mint serialized coins with unique serial numbers
- ✅ Encrypt coin data with AES-256-GCM
- ✅ Sign coins with HMAC-SHA256
- ✅ Detect fake coins automatically
- ✅ Track complete ownership history
- ✅ Maintain forensic-grade audit trail

---

**Need help? Check the logs in Render → Your Service → Logs**


