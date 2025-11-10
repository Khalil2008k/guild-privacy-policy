# 🔧 ERR_CONNECTION_CLOSED Fix Guide

**Error:** `ERR_CONNECTION_CLOSED`  
**Cause:** Connection closed prematurely (server crashed, network issue, or tunnel instability)

---

## ✅ **IMMEDIATE FIX: RESTART WITH LAN MODE**

### **Step 1: Kill All Node Processes**
```powershell
# Kill all Node processes (careful!)
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
```

### **Step 2: Wait 5 Seconds**
Let processes fully terminate.

### **Step 3: Start with LAN Mode (MORE STABLE)**
```bash
cd C:\Users\Admin\GUILD\GUILD-3
npx expo start --lan --clear
```

**Why LAN Mode?**
- ✅ More stable than tunnel
- ✅ Faster connection
- ✅ Less prone to connection drops
- ✅ Direct connection (no tunnel dependency)

**Requirements:**
- ✅ iPad and computer on **same Wi-Fi network**

---

## 🔍 **WHY THIS ERROR HAPPENS**

### **Common Causes:**
1. **Tunnel connection unstable** - Expo tunnel service issues
2. **Server crashed** - Metro bundler process died
3. **Network interruption** - Wi-Fi dropped or changed
4. **Port conflict** - Another process using port 8081
5. **Firewall blocking** - Windows Firewall closing connection
6. **Timeout** - Connection idle too long

---

## 🎯 **ALTERNATIVE SOLUTIONS**

### **Option 1: Use LAN Mode (RECOMMENDED)**

**If iPad and computer on same Wi-Fi:**

```bash
# Stop current Expo (Ctrl+C)
# Then:
cd C:\Users\Admin\GUILD\GUILD-3
npx expo start --lan --clear
```

**Benefits:**
- ✅ More stable than tunnel
- ✅ Faster connection
- ✅ Direct connection (no tunnel)
- ✅ Less prone to drops

---

### **Option 2: Use Localhost (USB Connection)**

**If iPad connected via USB:**

```bash
cd C:\Users\GUILD\GUILD-3
npx expo start --localhost --clear
```

**Benefits:**
- ✅ Most stable
- ✅ Fastest connection
- ✅ No network dependency
- ✅ Best for testing

**Requirements:**
- ✅ iPad connected via USB
- ✅ iTunes/iCloud sync enabled

---

### **Option 3: Try Different Port**

**If port 8081 is busy:**

```bash
# Expo will ask for different port automatically
npx expo start --lan --clear
# When asked: "Use port 8082 instead?" → Yes
```

---

### **Option 4: Manual URL Entry**

**If QR code keeps failing:**

1. **Get IP address:**
   ```powershell
   ipconfig | findstr IPv4
   ```
   Example: `192.168.1.100`

2. **Get port from terminal:**
   Example: `8081`

3. **Manual URL:**
   ```
   exp://192.168.1.100:8081
   ```

4. **In Expo Go:**
   - Tap "Enter URL manually"
   - Paste: `exp://192.168.1.100:8081`
   - Tap "Connect"

---

## 🔧 **TROUBLESHOOTING**

### **Issue 1: Connection Keeps Closing**

**Fix:**
1. **Kill all Node processes:**
   ```powershell
   Stop-Process -Name node -Force -ErrorAction SilentlyContinue
   ```

2. **Wait 5 seconds**

3. **Restart with LAN:**
   ```bash
   npx expo start --lan --clear
   ```

---

### **Issue 2: Port Already in Use**

**Fix:**
```bash
# Find what's using port 8081
netstat -ano | findstr :8081

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Restart Expo
npx expo start --lan --clear
```

---

### **Issue 3: Firewall Blocking**

**Fix:**
1. **Open Windows Firewall**
2. **Allow Node.js through firewall**
3. **Or temporarily disable firewall** (for testing only)
4. **Restart Expo**

---

### **Issue 4: Network Changed**

**Fix:**
1. **Ensure iPad and computer on same Wi-Fi**
2. **Check IP addresses match network**
3. **Restart Expo:**
   ```bash
   npx expo start --lan --clear
   ```

---

### **Issue 5: Metro Bundler Crashed**

**Fix:**
1. **Kill all Node processes:**
   ```powershell
   Stop-Process -Name node -Force
   ```

2. **Clear cache:**
   ```bash
   npx expo start --clear --lan
   ```

3. **Restart Expo**

---

## 📊 **CONNECTION MODES (STABILITY ORDER)**

| Mode | Stability | Speed | Network | Best For |
|------|-----------|-------|---------|----------|
| **Localhost** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | USB | Most stable |
| **LAN** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Same Wi-Fi | Recommended |
| **Tunnel** | ⭐⭐⭐ | ⭐⭐⭐ | Any network | Last resort |

---

## ✅ **RECOMMENDED WORKFLOW**

### **For iPad Testing:**

1. **Try LAN Mode First:**
   ```bash
   npx expo start --lan --clear
   ```
   *(Requires same Wi-Fi)*

2. **If LAN Fails, Try Localhost:**
   ```bash
   npx expo start --localhost --clear
   ```
   *(Requires USB connection)*

3. **If Both Fail, Try Tunnel:**
   ```bash
   npx expo start --tunnel --clear
   ```
   *(Works on any network, but less stable)*

---

## 🎯 **IMMEDIATE ACTION**

**I'm checking your system now and will restart Expo with LAN mode (more stable).**

**Next Steps:**
1. ✅ **Kill all Node processes** (if any running)
2. ✅ **Start Expo with LAN mode**
3. ✅ **Get new QR code**
4. ✅ **Scan with Expo Go**

---

## 💡 **PRO TIP**

**If connection keeps closing:**
- Use **LAN mode** (most stable for same Wi-Fi)
- Use **localhost** (most stable for USB)
- Avoid **tunnel mode** if possible (less stable)

---

## 🔍 **VERIFICATION**

**After restarting, check:**
- ✅ Metro bundler started successfully
- ✅ QR code appears in terminal
- ✅ URL shows `exp://192.168.x.x:8081` (LAN mode)
- ✅ No error messages in terminal

**Then scan QR code with Expo Go!**

---

**I'm fixing this now. Wait for the new QR code!** 🚀

