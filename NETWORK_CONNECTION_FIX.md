# 🔧 Network Connection Lost - Fix Guide

**Error:** "The network connection was lost"  
**URL:** `exp://am3eiv8-mazen123333-8082.exp.direct`

---

## ✅ **QUICK FIX: RESTART EXPO**

### **Step 1: Stop Current Expo Server**
Press `Ctrl+C` in the terminal where Expo is running

### **Step 2: Restart with Tunnel**
```bash
cd C:\Users\Admin\GUILD\GUILD-3
npx expo start --tunnel --clear
```

### **Step 3: Wait for New QR Code**
- ✅ Wait for "Metro waiting on exp://..."
- ✅ New QR code will appear
- ✅ New URL will be different (tunnel ID changes)

### **Step 4: Scan New QR Code**
1. **Open Expo Go** on iPad
2. **Tap "Scan QR Code"**
3. **Scan the NEW QR code** from terminal
4. **App should connect** ✅

---

## 🔍 **WHY THIS HAPPENS**

### **Common Causes:**
1. **Tunnel connection timeout** - Tunnel URLs expire after inactivity
2. **Network interruption** - Wi-Fi dropped or changed
3. **Expo server stopped** - Process crashed or was killed
4. **Firewall blocking** - Windows Firewall blocking connection
5. **Tunnel service issue** - Expo's tunnel service had a hiccup

---

## 🎯 **ALTERNATIVE SOLUTIONS**

### **Option 1: Use LAN Mode (Same Network)**

If iPad and computer are on **same Wi-Fi**:

```bash
# Stop tunnel mode
# Press Ctrl+C

# Start in LAN mode
npx expo start --lan
```

**Benefits:**
- ✅ Faster connection
- ✅ More reliable
- ✅ No tunnel dependency

**Requirements:**
- ✅ iPad and computer on same Wi-Fi network

---

### **Option 2: Use Localhost (USB Connection)**

If you have **USB connection** to iPad:

```bash
# Start in localhost mode
npx expo start --localhost
```

**Benefits:**
- ✅ Most reliable
- ✅ Fastest connection
- ✅ No network issues

**Requirements:**
- ✅ iPad connected via USB
- ✅ iTunes/iCloud sync enabled

---

### **Option 3: Manual URL Entry**

If QR code keeps failing:

1. **Get the URL from terminal:**
   ```
   exp://192.168.1.100:8081
   ```

2. **Open Expo Go** on iPad
3. **Tap "Enter URL manually"**
4. **Paste the URL**
5. **Tap "Connect"**

---

## 🔧 **TROUBLESHOOTING**

### **Issue 1: Tunnel Keeps Disconnecting**

**Fix:**
```bash
# Use LAN mode instead
npx expo start --lan
```

**Or:**
```bash
# Try tunnel again with fresh connection
npx expo start --tunnel --clear
```

---

### **Issue 2: Firewall Blocking**

**Fix:**
1. **Open Windows Firewall**
2. **Allow Node.js through firewall**
3. **Restart Expo**

**Or:**
```bash
# Try LAN mode (less firewall issues)
npx expo start --lan
```

---

### **Issue 3: Network Changed**

**Fix:**
1. **Ensure iPad and computer on same Wi-Fi**
2. **Restart Expo:**
   ```bash
   npx expo start --tunnel --clear
   ```

---

### **Issue 4: Expo Server Crashed**

**Fix:**
1. **Check if process is running:**
   ```bash
   # In PowerShell
   Get-Process | Where-Object {$_.ProcessName -like "*node*"}
   ```

2. **Kill old processes:**
   ```bash
   # Kill all Node processes (careful!)
   Stop-Process -Name node -Force
   ```

3. **Restart Expo:**
   ```bash
   npx expo start --tunnel --clear
   ```

---

## 📊 **CONNECTION MODES COMPARISON**

| Mode | Command | Speed | Reliability | Network |
|------|---------|-------|-------------|---------|
| **Tunnel** | `--tunnel` | Medium | Medium | Any network |
| **LAN** | `--lan` | Fast | High | Same Wi-Fi |
| **Localhost** | `--localhost` | Fastest | Highest | USB/Simulator |

---

## ✅ **RECOMMENDED WORKFLOW**

### **For iPad Testing:**

1. **Try Tunnel First:**
   ```bash
   npx expo start --tunnel --clear
   ```

2. **If Tunnel Fails, Use LAN:**
   ```bash
   npx expo start --lan
   ```
   *(Requires same Wi-Fi)*

3. **If LAN Fails, Use Localhost:**
   ```bash
   npx expo start --localhost
   ```
   *(Requires USB connection)*

---

## 🎯 **IMMEDIATE ACTION**

**I've restarted Expo with tunnel mode for you!**

**Now:**
1. ✅ **Wait for new QR code** in terminal
2. ✅ **Scan NEW QR code** with Expo Go
3. ✅ **App should connect** ✅

**If it still fails:**
- Try LAN mode: `npx expo start --lan`
- Or share the new error message

---

## 💡 **PRO TIP**

**If tunnel keeps disconnecting:**
- Use **LAN mode** if on same Wi-Fi (more reliable)
- Use **localhost** if connected via USB (most reliable)

---

**The Expo server is restarting now. Wait for the new QR code and scan it!** 🚀

