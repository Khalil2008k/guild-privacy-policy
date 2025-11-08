# 🔐 Generate Environment Variables for Render

## ✅ Quick Generation Commands

Run these commands in your terminal to generate secure random values:

### 1. Generate SADAD_WEBHOOK_SECRET

**Windows PowerShell:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Or using Node.js directly:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Example Output:**
```
SADAD_WEBHOOK_SECRET=Kj8mN2pQ9rT5vWxYzA3bC6dE8fG1hI4jK7lM0nO2pQ5rS8tU1vW4xY7zA0b
```

---

### 2. Generate PAYMENT_ENCRYPTION_KEY

**Windows PowerShell:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Or using Node.js directly:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Example Output:**
```
PAYMENT_ENCRYPTION_KEY=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

---

## 📋 Complete Environment Variables List

### Required Variables for Render:

1. **SADAD_API_KEY**
   - Value: `kOGQrmkFr5LcNW9c`
   - Type: String
   - Description: Your Sadad API secret key

2. **SADAD_WEBHOOK_SECRET**
   - Value: (Generate using command above)
   - Type: Base64 string (44 characters)
   - Description: Secret key for verifying webhook signatures from Sadad

3. **PAYMENT_ENCRYPTION_KEY**
   - Value: (Generate using command above)
   - Type: Hex string (64 characters)
   - Description: 32-byte encryption key for payment tokenization (AES-256-CBC)

---

## 🔧 Alternative: Generate All at Once

Create a file `generate-env.js`:

```javascript
const crypto = require('crypto');

console.log('=== SADAD ENVIRONMENT VARIABLES ===\n');
console.log('SADAD_API_KEY=kOGQrmkFr5LcNW9c');
console.log('SADAD_WEBHOOK_SECRET=' + crypto.randomBytes(32).toString('base64'));
console.log('PAYMENT_ENCRYPTION_KEY=' + crypto.randomBytes(32).toString('hex'));
console.log('\n=== COPY THESE TO RENDER ===');
```

Then run:
```bash
node generate-env.js
```

---

## 📝 Steps to Add to Render

1. **Go to Render Dashboard**
   - https://dashboard.render.com
   - Select your backend service

2. **Go to Environment Tab**
   - Click "Environment" tab

3. **Add Each Variable**
   - Click "Add Environment Variable"
   - Enter the **Key** (e.g., `SADAD_API_KEY`)
   - Enter the **Value** (e.g., `kOGQrmkFr5LcNW9c`)
   - Click "Save Changes"

4. **Repeat for All Variables**
   - Add `SADAD_API_KEY`
   - Add `SADAD_WEBHOOK_SECRET` (generated value)
   - Add `PAYMENT_ENCRYPTION_KEY` (generated value)

5. **Save and Deploy**
   - Click "Save Changes"
   - Render will automatically redeploy

---

## 🔒 Security Notes

- **Never commit these values to Git**
- **Keep them secure** - they're used for payment processing
- **Don't share them** publicly
- **Store them securely** in Render's environment variables

---

## ✅ Verification

After adding variables, check deployment logs:
- Should show: `✅ Sadad payment service initialized`
- Should NOT show: `⚠️ SADAD_API_KEY not set`

---

## 🚀 Quick Copy-Paste

After generating, you'll have something like:

```
SADAD_API_KEY=kOGQrmkFr5LcNW9c
SADAD_WEBHOOK_SECRET=Kj8mN2pQ9rT5vWxYzA3bC6dE8fG1hI4jK7lM0nO2pQ5rS8tU1vW4xY7zA0b
PAYMENT_ENCRYPTION_KEY=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

Copy each line and add to Render as separate environment variables.

---

**Status:** ✅ **Ready to generate and add to Render**


