# 🚀 GUILD - Quick Start to Google Play Store

**Ready in 3 Steps!**

---

## ⚡ **Super Quick Start (5 minutes)**

```powershell
# Step 1: Run the automated script
.\build-for-play-store.ps1

# That's it! The script will guide you through everything
```

---

## 📱 **Manual Steps (if you prefer)**

### 1. Install EAS CLI
```powershell
npm install -g eas-cli
```

### 2. Login to Expo
```powershell
eas login
```
**Use your Expo account:** mazen123333

### 3. Build Production AAB
```powershell
eas build --platform android --profile production
```

**Time:** 10-30 minutes  
**Output:** `.aab` file ready for Play Store

---

## 📋 **What You Need Next**

After the build completes, you'll need:

### 1. Google Play Console Account
- Cost: $25 (one-time)
- Sign up: https://play.google.com/console/signup

### 2. App Assets
- [ ] App icon (512x512px) - You already have this!
- [ ] Screenshots (4-8 images)
- [ ] Feature graphic (1024x500px)
- [ ] Privacy policy URL

### 3. Store Listing Info
- App name: **GUILD**
- Category: **Business**
- Description: See `GOOGLE_PLAY_LAUNCH_GUIDE.md`

---

## 🎯 **Your App Info**

✅ **Already Configured:**
```
Name: GUILD
Package: com.mazen123333.guild2
Version: 1.0.0
Owner: mazen123333
```

✅ **Build Settings:**
```json
{
  "production": {
    "android": {
      "buildType": "aab"  // Perfect for Play Store!
    }
  }
}
```

---

## 🔍 **Check Build Status**

```powershell
# List all builds
eas build:list

# Or visit your dashboard
# https://expo.dev/accounts/mazen123333/projects/guild/builds
```

---

## 📥 **After Build Completes**

1. **Download the AAB file** from EAS dashboard
2. **Create Google Play Console account** ($25)
3. **Upload AAB** to Play Console
4. **Complete store listing**
5. **Submit for review** (1-7 days)

---

## 📖 **Need More Details?**

See the complete guide:
```
GOOGLE_PLAY_LAUNCH_GUIDE.md
```

It includes:
- Detailed steps for each phase
- Store listing template
- Asset requirements
- Common issues & solutions
- Timeline estimates

---

## ⏱️ **Timeline**

| Task | Time |
|------|------|
| Run build script | 5 min |
| Wait for build | 10-30 min |
| Create Play Console | 10 min |
| Complete store listing | 1-2 hours |
| Review process | 1-7 days |
| **Total** | **~3-10 days** |

---

## 🆘 **Need Help?**

**Build Issues:**
```powershell
# View build logs
eas build:list
# Click on the build to see detailed logs
```

**Login Issues:**
```powershell
# Re-login
eas logout
eas login
```

**Can't find AAB file:**
- Check your email from Expo
- Visit: https://expo.dev/accounts/mazen123333/projects/guild/builds
- Download from "Artifacts" section

---

## ✅ **Ready?**

Just run:
```powershell
.\build-for-play-store.ps1
```

And follow the prompts! 🚀

---

**Next:** Once build completes, see `GOOGLE_PLAY_LAUNCH_GUIDE.md` for store submission steps.


