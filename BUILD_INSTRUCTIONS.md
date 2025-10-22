# 🚀 GUILD App - Production Build Instructions

## ✅ Configuration Complete!

Your app is now configured for **App Store** and **Google Play Store** deployment.

---

## 📱 **APP DETAILS**

### iOS (App Store)
- **Bundle ID:** `com.mazen123333.guild`
- **App Name:** GUILD
- **Version:** 1.0.0
- **Build Type:** Release (IPA)

### Android (Play Store)
- **Package Name:** `com.mazen123333.guild`
- **App Name:** GUILD
- **Version:** 1.0.0
- **Version Code:** 1
- **Build Type:** AAB (Android App Bundle)

---

## 🔧 **PREREQUISITES**

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
```
**Use your Expo account:** mazen123333

### 3. Verify Configuration
```bash
cd GUILD-3
eas build:configure
```

---

## 🏗️ **BUILD COMMANDS**

### Option 1: Build Both Platforms (Recommended)
```bash
cd GUILD-3
eas build --platform all --profile production
```

### Option 2: Build iOS Only
```bash
cd GUILD-3
eas build --platform ios --profile production
```

### Option 3: Build Android Only
```bash
cd GUILD-3
eas build --platform android --profile production
```

---

## ⏱️ **BUILD PROCESS**

### What Happens:
1. **Upload:** EAS uploads your code to Expo servers
2. **Build:** Expo builds your app on their cloud infrastructure
3. **Sign:** Apps are signed with your credentials
4. **Download:** You get download links for the built apps

### Timeline:
- **iOS:** 15-30 minutes
- **Android:** 10-20 minutes
- **Both:** 20-40 minutes (parallel builds)

### Build Status:
You can monitor builds at: https://expo.dev/accounts/mazen123333/projects/guild/builds

---

## 📦 **BUILD OUTPUTS**

### iOS (App Store)
- **File Type:** `.ipa` (iOS App Archive)
- **Use For:** Uploading to App Store Connect
- **Tool:** Transporter app or `eas submit`

### Android (Play Store)
- **File Type:** `.aab` (Android App Bundle)
- **Use For:** Uploading to Google Play Console
- **Tool:** Play Console web interface or `eas submit`

---

## 🔐 **CREDENTIALS**

### iOS Credentials (Apple Developer Account Required)
EAS will ask you to:
1. **Apple ID:** Your Apple Developer account email
2. **App Store Connect API Key:** (Optional, recommended)
3. **Distribution Certificate:** EAS can generate this
4. **Provisioning Profile:** EAS can generate this

**Don't have credentials?** EAS can generate them for you automatically!

### Android Credentials
EAS will ask you to:
1. **Keystore:** EAS can generate this automatically
2. **Keystore Password:** You'll set this
3. **Key Alias:** You'll set this
4. **Key Password:** You'll set this

**Important:** Save these credentials! You'll need them for all future updates.

---

## 🚀 **STEP-BY-STEP: FIRST BUILD**

### Step 1: Navigate to Project
```bash
cd GUILD-3
```

### Step 2: Start Production Build
```bash
eas build --platform all --profile production
```

### Step 3: Answer Prompts

#### For iOS:
```
? What would you like your bundle identifier to be?
✓ Use: com.mazen123333.guild (already configured)

? Generate a new Apple Distribution Certificate?
✓ Yes (recommended for first build)

? Generate a new Apple Provisioning Profile?
✓ Yes (recommended for first build)
```

#### For Android:
```
? Generate a new Android Keystore?
✓ Yes (recommended for first build)

? Keystore password:
✓ Enter a strong password (save this!)

? Key alias:
✓ Enter: guild-key

? Key password:
✓ Enter a strong password (save this!)
```

### Step 4: Wait for Build
- Monitor progress in terminal
- Or visit: https://expo.dev/accounts/mazen123333/projects/guild/builds

### Step 5: Download Builds
Once complete, you'll get download links:
- **iOS:** `guild-1.0.0.ipa`
- **Android:** `guild-1.0.0.aab`

---

## 📤 **SUBMIT TO STORES**

### iOS App Store

#### Option A: Using EAS Submit (Easiest)
```bash
eas submit --platform ios --profile production
```

You'll need:
- Apple ID
- App-specific password
- App Store Connect App ID

#### Option B: Manual Upload
1. Download the `.ipa` file
2. Open **Transporter** app (Mac only)
3. Drag and drop the `.ipa` file
4. Wait for upload to complete
5. Go to App Store Connect to submit for review

### Android Play Store

#### Option A: Using EAS Submit (Easiest)
```bash
eas submit --platform android --profile production
```

You'll need:
- Google Service Account JSON key
- Play Console access

#### Option B: Manual Upload
1. Download the `.aab` file
2. Go to Google Play Console
3. Navigate to your app → Production → Create new release
4. Upload the `.aab` file
5. Fill in release notes
6. Submit for review

---

## 🔄 **FUTURE UPDATES**

### Update Version Numbers
Edit `GUILD-3/app.config.js`:
```javascript
version: "1.0.1",  // Increment this
```

For Android, also update:
```javascript
android: {
  versionCode: 2,  // Increment this (must be higher than previous)
}
```

### Build Updated Version
```bash
cd GUILD-3
eas build --platform all --profile production
```

### Submit Update
```bash
eas submit --platform all --profile production
```

---

## 🎨 **ASSETS NEEDED**

Before submitting to stores, you need:

### App Icon
- **iOS:** 1024x1024 PNG (no transparency, no rounded corners)
- **Android:** 512x512 PNG
- **Location:** `GUILD-3/assets/icon.png`

### Adaptive Icon (Android)
- **Size:** 1024x1024 PNG
- **Location:** `GUILD-3/assets/adaptive-icon.png`

### Splash Screen
- **Size:** 1284x2778 PNG (iPhone 13 Pro Max)
- **Location:** `GUILD-3/assets/splash.png`

### Screenshots (Required for Stores)
- **iOS:** 6.7" (iPhone 14 Pro Max) - 1290x2796
- **Android:** Various sizes for different devices
- **Minimum:** 5-8 screenshots per platform

---

## ✅ **PRE-SUBMISSION CHECKLIST**

### Technical
- [x] App builds successfully
- [x] Backend is live and operational
- [x] Firebase is configured
- [x] All API endpoints working
- [x] Authentication tested
- [x] Payment system configured

### Assets
- [ ] App icon (1024x1024)
- [ ] Adaptive icon (Android)
- [ ] Splash screen
- [ ] Screenshots (5-8 per platform)

### Store Listings
- [ ] App name: GUILD
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] Keywords (100 chars)
- [ ] Category: Productivity / Business
- [ ] Age rating: 17+ (or appropriate)
- [ ] Privacy policy URL
- [ ] Support email
- [ ] Support website

### Legal
- [ ] Privacy policy created and hosted
- [ ] Terms of service created
- [ ] Content rating questionnaire completed

---

## 🆘 **TROUBLESHOOTING**

### Build Failed?

#### "Invalid bundle identifier"
- Check `app.config.js` → `ios.bundleIdentifier`
- Must match Apple Developer Portal

#### "Keystore not found"
- Run: `eas credentials` to manage credentials
- Generate new keystore if needed

#### "Build timeout"
- Check your internet connection
- Try building one platform at a time
- Check EAS status: https://status.expo.dev

### Need Help?
- EAS Docs: https://docs.expo.dev/build/introduction/
- Expo Discord: https://chat.expo.dev
- Stack Overflow: Tag `expo` and `eas-build`

---

## 📞 **SUPPORT**

### EAS Build Status
https://expo.dev/accounts/mazen123333/projects/guild/builds

### Expo Account
https://expo.dev/accounts/mazen123333

### Project Dashboard
https://expo.dev/accounts/mazen123333/projects/guild

---

## 🎉 **YOU'RE READY!**

Your app configuration is complete. Just run:

```bash
cd GUILD-3
eas build --platform all --profile production
```

And follow the prompts. EAS will handle the rest!

**Good luck with your launch! 🚀**

---

**Last Updated:** October 22, 2025  
**Configuration Version:** 1.0.0  
**EAS CLI Version:** ≥ 12.0.0

