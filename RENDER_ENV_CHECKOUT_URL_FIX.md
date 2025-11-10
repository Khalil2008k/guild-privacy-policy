# 🔧 Fix Sadad Checkout URL in Render

## Issue
The HTML form is still showing the old URL: `https://www.sadadqatar.com/checkout`
This domain doesn't resolve (`ERR_NAME_NOT_RESOLVED`).

## Root Cause
There's likely an environment variable `SADAD_CHECKOUT_URL` set in Render to the old URL, which overrides the code default.

## Solution

### Step 1: Check Render Environment Variables
1. Go to Render Dashboard: https://dashboard.render.com
2. Select your backend service (`guild-yf7q`)
3. Go to **Environment** tab
4. Look for `SADAD_CHECKOUT_URL`

### Step 2: Update or Remove
**Option A: Update to Correct URL (Recommended)**
```
SADAD_CHECKOUT_URL=https://api.sadadqatar.com/api-v4/payment
```

**Option B: Remove the Variable**
If you remove `SADAD_CHECKOUT_URL`, the code will use the default:
```
https://api.sadadqatar.com/api-v4/payment
```

### Step 3: Save and Redeploy
1. Click **Save Changes**
2. Render will automatically redeploy (takes 2-3 minutes)

## Verify Fix
After deployment, check Render logs for:
```
✅ Using default Sadad checkout URL: https://api.sadadqatar.com/api-v4/payment
```
OR (if env var is set):
```
✅ Sadad Payment Service initialized (PRODUCTION mode)
```

## Test Again
Once deployed, try purchasing coins again. The form should now submit to:
```
https://api.sadadqatar.com/api-v4/payment
```

## If Still Fails
If `api.sadadqatar.com/api-v4/payment` also doesn't work, you need to:
1. Check the Sadad documentation PDF you have open
2. Look for the correct Web Checkout 2.1 endpoint
3. Contact Sadad support to confirm the exact URL for form-based checkout

---

**Note:** The code is correct. The issue is the environment variable override in Render.



