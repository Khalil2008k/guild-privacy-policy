# 🔧 Sadad Checkout URL Fix

## Issue
The HTML form is still showing the old URL: `https://www.sadadqatar.com/checkout`
This domain doesn't resolve (`ERR_NAME_NOT_RESOLVED`).

## Solution
The code has been updated to use: `https://api.sadadqatar.com/api-v4/payment`

## Action Required

### Option 1: Wait for Deployment (Recommended)
The code fix has been pushed (commit `bd99dcd`). Wait 2-3 minutes for Render to automatically redeploy.

### Option 2: Set Environment Variable in Render
If you want to override the default, set this in Render dashboard:

```
SADAD_CHECKOUT_URL=https://api.sadadqatar.com/api-v4/payment
```

## Verify Deployment
After deployment, check Render logs for:
```
✅ Using default Sadad checkout URL: https://api.sadadqatar.com/api-v4/payment
```

## Test Again
Once deployed, try purchasing coins again. The form should now submit to:
```
https://api.sadadqatar.com/api-v4/payment
```

## If Still Fails
If `api.sadadqatar.com/api-v4/payment` also doesn't work, you need to:
1. Contact Sadad support to get the correct Web Checkout 2.1 URL
2. Ask them for the exact endpoint for form-based checkout
3. Verify if Web Checkout 2.1 uses form submission or redirect URL

---

**Note:** The form generation is working correctly. The only issue is the checkout URL domain.


