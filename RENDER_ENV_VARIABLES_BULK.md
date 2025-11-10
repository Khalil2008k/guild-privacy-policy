# 🔐 Render Environment Variables - Bulk Add Format

## 📋 Copy-Paste Ready Format

Copy the entire block below and paste into Render's **Environment Variables** section:

```
SADAD_MID=2334863
SADAD_SECRET_KEY=kOGQrmkFr5LcNW9c
SADAD_BASE_URL=https://api.sadadqatar.com/api-v4
SADAD_WEBSITE_URL=https://guild-yf7q.onrender.com
```

---

## 🚀 How to Bulk Add in Render

### Method 1: Manual Entry (Recommended)

1. Go to: https://dashboard.render.com
2. Select your service: `guild-yf7q`
3. Click **Environment** tab
4. Click **Add Environment Variable**
5. For each line above:
   - Copy the `KEY=value` part
   - Paste into Render's bulk import field (if available)
   - OR add each one manually

### Method 2: Render CLI (If Available)

If Render CLI supports bulk import, use the file: `RENDER_ENV_VARIABLES_BULK.txt`

---

## ✅ Required Variables

| Key | Value | Description |
|-----|-------|-------------|
| `SADAD_MID` | `2334863` | Sadad Merchant ID |
| `SADAD_SECRET_KEY` | `kOGQrmkFr5LcNW9c` | Sadad Secret Key |
| `SADAD_BASE_URL` | `https://api.sadadqatar.com/api-v4` | Sadad API Base URL |
| `SADAD_WEBSITE_URL` | `https://guild-yf7q.onrender.com` | Your website URL for checksum |

---

## 📝 Complete Block (Copy This)

```
SADAD_MID=2334863
SADAD_SECRET_KEY=kOGQrmkFr5LcNW9c
SADAD_BASE_URL=https://api.sadadqatar.com/api-v4
SADAD_WEBSITE_URL=https://guild-yf7q.onrender.com
```

---

## ⚠️ Important Notes

1. **No Spaces**: Ensure no spaces around `=` sign
2. **Exact Values**: Copy values exactly as shown
3. **Case Sensitive**: Keys are case-sensitive
4. **Save Changes**: After adding, click **Save Changes**
5. **Auto-Redeploy**: Render will automatically redeploy (2-3 minutes)

---

## 🧪 After Adding

Check logs to verify:

```
✅ Sadad Payment Service initialized (PRODUCTION mode)
merchantId: 2334863
baseUrl: https://api.sadadqatar.com/api-v4
websiteUrl: https://guild-yf7q.onrender.com
```

---

**Last Updated:** November 6, 2025



