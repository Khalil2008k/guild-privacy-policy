# 🍎 APP STORE CONNECT - IAP SETUP GUIDE

**Date:** November 7, 2025  
**Updated:** Corrected with 10% platform fee  
**Priority:** 🔴 CRITICAL for iOS IAP functionality

---

## ✅ **CORRECT PRICING** (With 10% Platform Fee)

| Coin | Coin Value | Platform Fee | **User Pays** | Apple Tier |
|------|-----------|-------------|--------------|------------|
| Bronze | 5 QAR | 0.50 QAR (10%) | **5.50 QAR** | Tier 1 |
| Silver | 10 QAR | 1 QAR (10%) | **11 QAR** | Tier 3 |
| Gold | 50 QAR | 5 QAR (10%) | **55 QAR** | Tier 13 |
| Platinum | 100 QAR | 10 QAR (10%) | **110 QAR** | Tier 23 |
| Diamond | 200 QAR | 20 QAR (10%) | **220 QAR** | Tier 34 |

**Note:** Apple prices are approximate and may vary slightly by region.

---

## 📝 **STEP-BY-STEP IAP CREATION**

### **Access App Store Connect**
1. Go to https://appstoreconnect.apple.com
2. Sign in with: `guild1@guild-app.net`
3. Navigate to: **My Apps** → **GUILD**
4. Click: **In-App Purchases** (left sidebar)

---

## 🟤 **PRODUCT 1: Bronze Coins**

### Create Product
1. Click **"+"** or **"Create In-App Purchase"**
2. Select **Type:** `Consumable`
3. Click **"Create"**

### Product Information
**Reference Name:** `GUILD Bronze Coins`  
**Product ID:** `com.guild.coins.bronze`

**Click "Save" and continue to next page**

### Pricing and Availability
**Base Price:**
- **Tier:** Look for ~5.50 QAR (approximately **Tier 1**)
- May show as $1.49 USD (varies by region)
- Price in Qatar should be close to 5.50 QAR

**Availability:** All territories (or select Qatar specifically)

### Localization
**Add English Localization:**
- **Display Name:** `Bronze Coins`
- **Description:** `5 QAR worth of Guild Coins for posting jobs, sending offers, and accessing premium features on the GUILD platform.`

**Add Arabic Localization:**
- Click **"+"** to add language
- Select: **Arabic**
- **Display Name:** `عملات برونزية`
- **Description:** `عملات جيلد بقيمة 5 ريال قطري لنشر الوظائف وإرسال العروض والوصول إلى الميزات المميزة على منصة جيلد.`

### Review Information
**Screenshot:** Not required for consumables (optional)

**Review Notes:** 
```
Bronze tier consumable coin package. 
Value: 5 QAR of in-app coins
Price: 5.50 QAR (includes 10% platform fee)
Used for job postings, offers, and platform services.
```

**Click "Submit for Review" or "Save" (depending on app status)**

---

## ⚪ **PRODUCT 2: Silver Coins**

**Type:** Consumable  
**Reference Name:** `GUILD Silver Coins`  
**Product ID:** `com.guild.coins.silver`

**Pricing:** Tier ~3 (≈11 QAR / $2.99 USD)

**Display Name (EN):** `Silver Coins`  
**Description (EN):** `10 QAR worth of Guild Coins for posting jobs, sending offers, and accessing premium features on the GUILD platform.`

**Display Name (AR):** `عملات فضية`  
**Description (AR):** `عملات جيلد بقيمة 10 ريال قطري لنشر الوظائف وإرسال العروض والوصول إلى الميزات المميزة على منصة جيلد.`

**Review Notes:** 
```
Silver tier consumable coin package.
Value: 10 QAR of in-app coins
Price: 11 QAR (includes 10% platform fee)
Used for job postings, offers, and platform services.
```

---

## 🟡 **PRODUCT 3: Gold Coins**

**Type:** Consumable  
**Reference Name:** `GUILD Gold Coins`  
**Product ID:** `com.guild.coins.gold`

**Pricing:** Tier ~13 (≈55 QAR / $14.99 USD)

**Display Name (EN):** `Gold Coins`  
**Description (EN):** `50 QAR worth of Guild Coins for posting jobs, sending offers, and accessing premium features on the GUILD platform.`

**Display Name (AR):** `عملات ذهبية`  
**Description (AR):** `عملات جيلد بقيمة 50 ريال قطري لنشر الوظائف وإرسال العروض والوصول إلى الميزات المميزة على منصة جيلد.`

**Review Notes:**
```
Gold tier consumable coin package.
Value: 50 QAR of in-app coins
Price: 55 QAR (includes 10% platform fee)
Used for job postings, offers, and platform services.
```

---

## 💎 **PRODUCT 4: Platinum Coins**

**Type:** Consumable  
**Reference Name:** `GUILD Platinum Coins`  
**Product ID:** `com.guild.coins.platinum`

**Pricing:** Tier ~23 (≈110 QAR / $29.99 USD)

**Display Name (EN):** `Platinum Coins`  
**Description (EN):** `100 QAR worth of Guild Coins for posting jobs, sending offers, and accessing premium features on the GUILD platform.`

**Display Name (AR):** `عملات بلاتينية`  
**Description (AR):** `عملات جيلد بقيمة 100 ريال قطري لنشر الوظائف وإرسال العروض والوصول إلى الميزات المميزة على منصة جيلد.`

**Review Notes:**
```
Platinum tier consumable coin package.
Value: 100 QAR of in-app coins
Price: 110 QAR (includes 10% platform fee)
Used for job postings, offers, and platform services.
```

---

## 💎 **PRODUCT 5: Diamond Coins**

**Type:** Consumable  
**Reference Name:** `GUILD Diamond Coins`  
**Product ID:** `com.guild.coins.diamond`

**Pricing:** Tier ~34 (≈220 QAR / $59.99 USD)

**Display Name (EN):** `Diamond Coins`  
**Description (EN):** `200 QAR worth of Guild Coins for posting jobs, sending offers, and accessing premium features on the GUILD platform.`

**Display Name (AR):** `عملات ألماسية`  
**Description (AR):** `عملات جيلد بقيمة 200 ريال قطري لنشر الوظائف وإرسال العروض والوصول إلى الميزات المميزة على منصة جيلد.`

**Review Notes:**
```
Diamond tier consumable coin package.
Value: 200 QAR of in-app coins
Price: 220 QAR (includes 10% platform fee)
Used for job postings, offers, and platform services.
```

---

## 🔐 **APP-SPECIFIC SHARED SECRET**

### Generate Shared Secret
1. In App Store Connect, go to: **My Apps** → **GUILD**
2. Click: **App Information** (left sidebar)
3. Scroll to: **App-Specific Shared Secret**
4. Click: **"Generate"** (or **"View"** if already exists)
5. **Copy the secret** (format: `a1b2c3d4e5f6...`)

### Add to Backend
```bash
# Edit backend/.env
APPLE_SHARED_SECRET=a1b2c3d4e5f6g7h8i9j0...
```

**⚠️ Important:** Keep this secret secure! Never commit to Git.

---

## 🧪 **SANDBOX TEST ACCOUNT**

### Create Sandbox Tester
1. Go to: **Users and Access** (top right)
2. Click: **Sandbox** tab
3. Click: **Testers** (left sidebar)
4. Click: **"+"** to add tester

### Tester Information
**First Name:** `GUILD`  
**Last Name:** `Tester`  
**Email:** `guild.iap.test@icloud.com` (or create unique email)  
**Password:** Create strong password (save it!)  
**Secret Question:** Any  
**Secret Answer:** Any  
**Country/Region:** **Qatar** (QA)  
**App Store Territory:** **Qatar**

**Click "Create"**

### Save Credentials
```
Sandbox Account:
Email: guild.iap.test@icloud.com
Password: [your strong password]
Region: Qatar
```

---

## ✅ **VERIFICATION CHECKLIST**

### Products Created
- [ ] Bronze (com.guild.coins.bronze) - Tier 1 (~5.50 QAR)
- [ ] Silver (com.guild.coins.silver) - Tier 3 (~11 QAR)
- [ ] Gold (com.guild.coins.gold) - Tier 13 (~55 QAR)
- [ ] Platinum (com.guild.coins.platinum) - Tier 23 (~110 QAR)
- [ ] Diamond (com.guild.coins.diamond) - Tier 34 (~220 QAR)

### Product Details
- [ ] All types set to "Consumable"
- [ ] English localizations complete
- [ ] Arabic localizations complete
- [ ] Prices/tiers set correctly
- [ ] Review notes added

### Configuration
- [ ] Shared secret generated
- [ ] Shared secret copied
- [ ] Shared secret added to backend `.env`
- [ ] Sandbox account created
- [ ] Sandbox credentials saved

### Agreements
- [ ] Paid Apps Agreement signed
- [ ] Banking information complete
- [ ] Tax forms submitted

---

## 📊 **PRICE COMPARISON**

### What User Pays (iOS IAP):
| Package | Price | Apple's 30% | You Receive |
|---------|-------|-------------|-------------|
| Bronze | 5.50 QAR | 1.65 QAR | 3.85 QAR |
| Silver | 11 QAR | 3.30 QAR | 7.70 QAR |
| Gold | 55 QAR | 16.50 QAR | 38.50 QAR |
| Platinum | 110 QAR | 33 QAR | 77 QAR |
| Diamond | 220 QAR | 66 QAR | 154 QAR |

### What User Gets (Coin Value):
| Package | Pays | Gets Coins Worth | Effective Rate |
|---------|------|------------------|----------------|
| Bronze | 5.50 QAR | 5 QAR | 91% |
| Silver | 11 QAR | 10 QAR | 91% |
| Gold | 55 QAR | 50 QAR | 91% |
| Platinum | 110 QAR | 100 QAR | 91% |
| Diamond | 220 QAR | 200 QAR | 91% |

**Platform Economics:**
- User pays: 100% (e.g., 5.50 QAR)
- Apple takes: 30% (e.g., 1.65 QAR)
- Platform gets: 70% (e.g., 3.85 QAR)
- User receives coins worth: 91% of what they paid (e.g., 5 QAR)
- Net platform margin: -21% (subsidizing users)

**Note:** This is a loss leader strategy to build user base. Consider adjusting platform fee or coin values for profitability.

---

## ⏭️ **NEXT STEPS AFTER SETUP**

1. ✅ **Deploy Backend** with `APPLE_SHARED_SECRET`
2. ✅ **Build iOS App** (need Mac/Xcode or EAS Build)
3. ✅ **Test with Sandbox** account
4. ✅ **Capture Screenshots**
5. ✅ **Submit to App Store**

---

## 🐛 **TROUBLESHOOTING**

### Products Not Appearing in App
**Wait Time:** Products can take **24 hours** to propagate after creation  
**Solution:** Wait and retry, or use sandbox account

### Cannot Find Correct Price Tier
**Problem:** Exact QAR amounts not available  
**Solution:** Select closest tier, document discrepancy in review notes

### Shared Secret Not Working
**Problem:** Receipt verification fails  
**Solution:** Regenerate secret, ensure no extra spaces when copying

### Sandbox Purchase Fails
**Problem:** "Cannot connect to iTunes Store"  
**Solution:** 
- Sign out of regular Apple ID on device
- Sign in with sandbox account when prompted
- Ensure sandbox account region matches (Qatar)

---

## 📋 **QUICK REFERENCE**

```
=== GUILD iOS IAP PRODUCTS ===

Bundle ID: com.mazen123333.guild

Product IDs (all Consumable):
1. com.guild.coins.bronze   | ~5.50 QAR  | 5 QAR value
2. com.guild.coins.silver   | ~11 QAR    | 10 QAR value
3. com.guild.coins.gold     | ~55 QAR    | 50 QAR value
4. com.guild.coins.platinum | ~110 QAR   | 100 QAR value
5. com.guild.coins.diamond  | ~220 QAR   | 200 QAR value

Platform Fee: 10%
Apple Commission: 30%
Net to Platform: ~70% of price - coin value

Shared Secret: [in backend/.env]
Sandbox Account: guild.iap.test@icloud.com
```

---

**SETUP STATUS:** Ready to configure  
**Estimated Time:** 45-60 minutes  
**Priority:** CRITICAL for iOS launch

*Updated: November 7, 2025*

