# 🚨 CRITICAL: Fix Environment Variable Format in Render

## Issue
The environment variable value includes the variable name itself, causing "Invalid URL" error.

**Current (WRONG):**
```
SADAD_BASE_URL=SADAD_BASE_URL=https://api-sandbox.sadad.qa/api-v4
```

**Should be (CORRECT):**
```
SADAD_BASE_URL=https://api-sandbox.sadad.qa/api-v4
```

## Error in Logs
```
"baseUrl":"SADAD_BASE_URL=https://api-sandbox.sadad.qa/api-v4"
"url":"SADAD_BASE_URL=https://api-sandbox.sadad.qa/api-v4/userbusinesses/generateChecksum"
```

This causes "Invalid URL" because the URL literally contains `SADAD_BASE_URL=` prefix.

## Fix in Render Dashboard

### Step 1: Go to Render Dashboard
1. Open: https://dashboard.render.com
2. Select your backend service: `guild-yf7q`
3. Click **Environment** tab

### Step 2: Fix Each Environment Variable

For each variable, make sure the **VALUE** field contains **ONLY the value**, not `KEY=VALUE`.

#### SADAD_BASE_URL
**Variable Name:** `SADAD_BASE_URL`  
**Value (ONLY):** `https://api-sandbox.sadad.qa/api-v4`

**NOT:** `SADAD_BASE_URL=https://api-sandbox.sadad.qa/api-v4`

#### SADAD_CHECKOUT_URL
**Variable Name:** `SADAD_CHECKOUT_URL`  
**Value (ONLY):** `https://api-sandbox.sadad.qa/api-v4/payment`

**NOT:** `SADAD_CHECKOUT_URL=https://api-sandbox.sadad.qa/api-v4/payment`

#### SADAD_MID
**Variable Name:** `SADAD_MID`  
**Value (ONLY):** `2334863`

**NOT:** `SADAD_MID=2334863`

#### SADAD_SECRET_KEY
**Variable Name:** `SADAD_SECRET_KEY`  
**Value (ONLY):** `+efrWl1GCKwPzJaR`

**NOT:** `SADAD_SECRET_KEY=+efrWl1GCKwPzJaR`

#### SADAD_WEBSITE_URL
**Variable Name:** `SADAD_WEBSITE_URL`  
**Value (ONLY):** `https://guild-yf7q.onrender.com`

**NOT:** `SADAD_WEBSITE_URL=https://guild-yf7q.onrender.com`

### Step 3: Verify Format
In Render, when you edit an environment variable, you should see:
- **Key:** `SADAD_BASE_URL`
- **Value:** `https://api-sandbox.sadad.qa/api-v4` (just the URL, no key name)

### Step 4: Save and Wait
1. Click **Save Changes**
2. Render will automatically redeploy (2-3 minutes)
3. Wait for deployment to complete

## Verify Fix
After deployment, check Render logs for:
```
"baseUrl":"https://api-sandbox.sadad.qa/api-v4"
"url":"https://api-sadbox.sadad.qa/api-v4/userbusinesses/generateChecksum"
```

**NOT:**
```
"baseUrl":"SADAD_BASE_URL=https://api-sandbox.sadad.qa/api-v4"
```

## Test Again
Once fixed, try the payment flow again. The "Invalid URL" error should be resolved.

---

**Important:** In Render, environment variables are set as **Key** and **Value** separately. The **Value** field should contain **ONLY the value**, not `KEY=VALUE`.



