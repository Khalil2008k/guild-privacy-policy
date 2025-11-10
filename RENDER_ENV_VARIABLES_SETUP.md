# 🔐 Render Environment Variables Setup

## ⚠️ CRITICAL: Missing Environment Variables

Your backend is deployed but **Sadad payment service is not configured**. You need to set these environment variables in Render.

---

## 📋 Required Environment Variables

### 1. Go to Render Dashboard

1. Navigate to: https://dashboard.render.com
2. Select your service: `guild-yf7q` (or your service name)
3. Go to **Environment** tab
4. Click **Add Environment Variable**

### 2. Add These Variables

Add **each variable** one by one:

#### ✅ SADAD_MID
```
Key: SADAD_MID
Value: 2334863
```

#### ✅ SADAD_SECRET_KEY
```
Key: SADAD_SECRET_KEY
Value: kOGQrmkFr5LcNW9c
```

#### ✅ SADAD_BASE_URL
```
Key: SADAD_BASE_URL
Value: https://api.sadadqatar.com/api-v4
```

#### ✅ SADAD_WEBSITE_URL
```
Key: SADAD_WEBSITE_URL
Value: https://guild-yf7q.onrender.com
```

---

## 🔍 Current Status

From your logs, I can see:

```
⚠️ SADAD_SECRET_KEY not set - payment service will not be available
merchantId: "233486"  ← Should be "2334863" (might be truncated or wrong)
```

**Issues:**
1. ❌ `SADAD_SECRET_KEY` is missing
2. ⚠️ `SADAD_MID` might be set incorrectly (showing `233486` instead of `2334863`)

---

## ✅ Step-by-Step Instructions

### Step 1: Open Render Dashboard
- Go to: https://dashboard.render.com
- Find your service: `guild-yf7q`

### Step 2: Navigate to Environment Tab
- Click on your service
- Click **Environment** in the left sidebar
- You'll see a list of current environment variables

### Step 3: Add Each Variable

Click **Add Environment Variable** and add:

**Variable 1:**
```
Key: SADAD_MID
Value: 2334863
```

**Variable 2:**
```
Key: SADAD_SECRET_KEY
Value: kOGQrmkFr5LcNW9c
```

**Variable 3:**
```
Key: SADAD_BASE_URL
Value: https://api.sadadqatar.com/api-v4
```

**Variable 4:**
```
Key: SADAD_WEBSITE_URL
Value: https://guild-yf7q.onrender.com
```

### Step 4: Save and Redeploy

After adding all variables:
1. Click **Save Changes**
2. Render will automatically redeploy your service
3. Wait 2-3 minutes for deployment to complete

---

## 🧪 Verify Setup

After redeployment, check the logs. You should see:

```
✅ Sadad Payment Service initialized (PRODUCTION mode)
merchantId: 2334863  ← Should show full MID
baseUrl: https://api.sadadqatar.com/api-v4
```

**Instead of:**
```
⚠️ SADAD_SECRET_KEY not set
merchantId: 233486  ← Wrong/truncated
```

---

## 📝 Complete Environment Variables List

Here's the complete list of all environment variables you might need:

### Required for Sadad:
```
SADAD_MID=2334863
SADAD_SECRET_KEY=kOGQrmkFr5LcNW9c
SADAD_BASE_URL=https://api.sadadqatar.com/api-v4
SADAD_WEBSITE_URL=https://guild-yf7q.onrender.com
```

### Optional (for testing):
```
SADAD_TEST_MID=2334863
SADAD_TEST_SECRET_KEY=kOGQrmkFr5LcNW9c
SADAD_WEBHOOK_SECRET=your-webhook-secret-here
```

### Other (if not already set):
```
BACKEND_URL=https://guild-yf7q.onrender.com
NODE_ENV=production
PORT=5000
```

---

## ⚠️ Important Notes

1. **No Spaces**: Make sure there are no spaces before or after the `=` sign
2. **Exact Values**: Copy the values exactly as shown (case-sensitive)
3. **Redeploy**: After adding variables, Render will auto-redeploy
4. **Check Logs**: Always verify in logs that variables are loaded correctly

---

## 🚨 Current Error

When you try to purchase coins, you're getting:

```
Error: Missing required environment variables: SADAD_SECRET_KEY
```

This will be fixed once you add `SADAD_SECRET_KEY` in Render.

---

## ✅ After Setup

Once variables are set and service redeploys:

1. ✅ Payment service will initialize correctly
2. ✅ Coin purchases will work
3. ✅ Checksum generation will work
4. ✅ Callback validation will work

---

**Last Updated:** November 6, 2025



