# 🚨 URGENT: Fix SADAD_CHECKOUT_URL in Render

## Issue Confirmed
Render logs show:
```
"checkoutUrl":"https://www.sadadqatar.com/checkout"
```

This URL doesn't resolve (`ERR_NAME_NOT_RESOLVED`).

## Root Cause
There's an environment variable `SADAD_CHECKOUT_URL` set in Render to the old URL, which overrides the code default.

## Immediate Fix Required

### Step 1: Go to Render Dashboard
1. Open: https://dashboard.render.com
2. Select your backend service: `guild-yf7q`
3. Click on **Environment** tab

### Step 2: Find and Update SADAD_CHECKOUT_URL
Look for this variable:
```
SADAD_CHECKOUT_URL=https://www.sadadqatar.com/checkout
```

### Step 3: Update to Correct URL
**Change it to:**
```
SADAD_CHECKOUT_URL=https://api.sadadqatar.com/api-v4/payment
```

**OR Remove it entirely** (the code will use the correct default)

### Step 4: Save and Wait
1. Click **Save Changes**
2. Render will automatically redeploy (2-3 minutes)
3. Wait for deployment to complete

## Verify Fix
After deployment, check Render logs for:
```
✅ Using SADAD_CHECKOUT_URL from environment: https://api.sadadqatar.com/api-v4/payment
```
OR (if removed):
```
✅ Using default Sadad checkout URL: https://api.sadadqatar.com/api-v4/payment
```

## Test Again
Once deployed, try purchasing coins again. The form should now submit to:
```
https://api.sadadqatar.com/api-v4/payment
```

---

**Note:** The code is correct. The issue is the environment variable override in Render. This must be fixed in Render dashboard - I cannot fix it from here.


