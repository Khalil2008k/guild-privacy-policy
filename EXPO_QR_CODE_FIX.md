# 🔧 Expo QR Code Platform Error Fix

**Issue:** `{"error":"CommandError: Must specify \"expo-platform\" header or \"platform\" query parameter"}`

**Cause:** Expo Go needs to know which platform (iOS/Android) when scanning the QR code.

---

## ✅ **QUICK FIXES**

### **Option 1: Start with Platform Flag (RECOMMENDED)**

**For iPad (iOS):**
```bash
cd GUILD-3
npx expo start --ios
```

**For Android:**
```bash
cd GUILD-3
npx expo start --android
```

**For Both:**
```bash
cd GUILD-3
npx expo start
# Then press 'i' for iOS or 'a' for Android in the terminal
```

---

### **Option 2: Use Tunnel Mode**

**Tunnel mode works better for devices on different networks:**
```bash
cd GUILD-3
npx expo start --tunnel
```

**Note:** Tunnel mode requires Expo account login.

---

### **Option 3: Manual URL with Platform Parameter**

If you see a URL like:
```
exp://192.168.1.100:8081
```

Add `?platform=ios`:
```
exp://192.168.1.100:8081?platform=ios
```

Then open this URL in Expo Go manually.

---

## 🎯 **RECOMMENDED WORKFLOW**

### **For iPad Testing:**

1. **Start Expo with iOS flag:**
   ```bash
   cd GUILD-3
   npx expo start --ios
   ```

2. **Scan the QR code** with Expo Go on your iPad

3. **If it still fails**, try tunnel mode:
   ```bash
   npx expo start --tunnel
   ```

---

## 🔍 **TROUBLESHOOTING**

### **Still Getting Error?**

1. **Clear Expo cache:**
   ```bash
   npx expo start --clear
   ```

2. **Check network connection:**
   - Ensure iPad and computer are on same Wi-Fi
   - Try tunnel mode if on different networks

3. **Update Expo Go:**
   - Update Expo Go app from App Store
   - Ensure it's the latest version

4. **Restart Metro bundler:**
   - Press `r` in the Expo terminal to reload
   - Or press `shift+r` to clear cache and reload

---

## 📱 **ALTERNATIVE: Development Build**

If Expo Go continues to have issues, use a development build:

```bash
# Install dev client
npx expo install expo-dev-client

# Build for iOS
npx expo run:ios

# Or build for Android
npx expo run:android
```

**Benefits:**
- ✅ Full native functionality
- ✅ No platform detection issues
- ✅ Better performance
- ✅ Production-like environment

---

## ✅ **VERIFICATION**

After starting with `--ios` flag, you should see:

```
› Metro waiting on exp://192.168.1.100:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
```

**The QR code should now work on your iPad!** ✅

---

## 🎉 **SUCCESS**

Once the app loads on your iPad:
- ✅ No more platform error
- ✅ App should load normally
- ✅ You can test all features

---

**Next:** Test the external payment flow on your iPad! 🚀

