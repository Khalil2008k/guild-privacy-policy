# 🔧 Expo on Windows + iPad Testing Fix

**Issue:** `--ios` flag requires Xcode (macOS only), but you're on Windows.

**Solution:** Use `expo start` or `expo start --tunnel` (no `--ios` flag needed).

---

## ✅ **CORRECT COMMAND FOR WINDOWS**

### **Option 1: Regular Start (Same Network)**
```bash
cd C:\Users\Admin\GUILD\GUILD-3
npx expo start
```

Then scan the QR code with Expo Go on your iPad.

---

### **Option 2: Tunnel Mode (Different Networks) - RECOMMENDED**
```bash
cd C:\Users\Admin\GUILD\GUILD-3
npx expo start --tunnel
```

**Benefits:**
- ✅ Works even if iPad and computer are on different Wi-Fi networks
- ✅ More reliable connection
- ✅ Better for testing on physical devices

**Note:** Tunnel mode requires Expo account login (free).

---

## 🎯 **WHY `--ios` DOESN'T WORK ON WINDOWS**

- ❌ `--ios` flag tries to open iOS Simulator (requires Xcode)
- ❌ Xcode only runs on macOS
- ✅ **You don't need it!** Expo Go on iPad will detect iOS automatically

---

## 📱 **HOW TO TEST ON IPAD FROM WINDOWS**

### **Step 1: Start Expo Server**
```bash
cd C:\Users\Admin\GUILD\GUILD-3
npx expo start --tunnel
```

### **Step 2: Wait for QR Code**
You'll see:
```
› Metro waiting on exp://...
› Scan the QR code above with Expo Go
```

### **Step 3: Scan QR Code**
1. Open **Expo Go** app on your iPad
2. Tap **"Scan QR Code"**
3. Scan the QR code from terminal
4. App will load automatically

---

## 🔍 **TROUBLESHOOTING**

### **Port Already in Use?**
If you see:
```
› Port 8081 is being used by another process
√ Use port 8083 instead? ... yes
```

**Just say "yes"** - it will use a different port automatically.

---

### **Still Getting Platform Error?**

**Try these:**

1. **Clear cache and restart:**
   ```bash
   npx expo start --clear --tunnel
   ```

2. **Check Expo Go version:**
   - Update Expo Go from App Store
   - Ensure it's the latest version

3. **Manual URL (if QR fails):**
   - Copy the `exp://...` URL from terminal
   - Open Expo Go
   - Tap "Enter URL manually"
   - Paste the URL
   - Add `?platform=ios` at the end if needed

---

### **Connection Issues?**

**If app doesn't load:**

1. **Check network:**
   - Ensure iPad and computer are on same Wi-Fi (for regular mode)
   - Or use tunnel mode (works on any network)

2. **Restart Metro:**
   - Press `r` in terminal to reload
   - Press `shift+r` to clear cache and reload

3. **Check firewall:**
   - Windows Firewall might block Metro bundler
   - Allow Node.js through firewall if prompted

---

## ✅ **VERIFICATION**

After starting with `--tunnel`, you should see:

```
› Metro waiting on exp://...
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator (won't work on Windows)
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
```

**The QR code should work on your iPad!** ✅

---

## 🎉 **SUCCESS**

Once the app loads on your iPad:
- ✅ No more platform error
- ✅ App should load normally
- ✅ You can test all features including external payment

---

## 💡 **PRO TIPS**

1. **Use tunnel mode** for better reliability
2. **Keep terminal open** while testing
3. **Press `r` to reload** after code changes
4. **Press `shift+r`** to clear cache if app acts weird

---

## 🚀 **NEXT STEPS**

1. ✅ Start Expo with `--tunnel`
2. ✅ Scan QR code with Expo Go on iPad
3. ✅ Test external payment flow
4. ✅ Verify "Credits" terminology appears correctly

---

**Your app should now load on your iPad!** 🎉

