# 📱 Android Phone Connection Fix

## ⚠️ Can't Connect to Backend?

If `http://192.168.1.34:5000/health` doesn't work in your phone's browser, here's how to fix it:

---

## 🔥 **Solution 1: Disable Windows Firewall (Temporary)**

### **Quick Test:**

1. Open **Windows Security**
2. Go to **Firewall & network protection**
3. Click **Private network** (or your active network)
4. Turn **Windows Defender Firewall** to **OFF** (temporarily)
5. Test again on phone: `http://192.168.1.34:5000/health`

**Works now?** → Firewall was blocking it!

**Keep firewall OFF while testing, then:**

---

## 🛡️ **Solution 2: Allow Port 5000 in Firewall**

### **Permanent Fix (Recommended):**

1. Open **Windows Security**
2. **Firewall & network protection** → **Advanced settings**
3. Click **Inbound Rules** → **New Rule**
4. Select **Port** → Click **Next**
5. Select **TCP** → Specific local ports: **5000**
6. Select **Allow the connection**
7. Check all: **Domain, Private, Public**
8. Name: **GUILD Backend**
9. Click **Finish**

Now test: `http://192.168.1.34:5000/health`

---

## 📶 **Solution 3: Check WiFi Network**

### **Both devices must be on SAME WiFi:**

**Phone:**
- Settings → Network & Internet → WiFi
- Check network name

**Computer:**
- System tray → WiFi icon
- Check network name

**Must match!**

**Common issue:**
- Computer on **5GHz** band
- Phone on **2.4GHz** band
- Different bands = can't communicate

**Fix:** Connect both to same WiFi band

---

## 🔄 **Solution 4: Restart Backend with All Interfaces**

Backend already listens on `0.0.0.0` (all interfaces), but verify:

```bash
cd backend
npm start
```

**Should show:**
```
✅ Server listening on http://0.0.0.0:5000
```

**Not showing this?** Check `backend/.env`:

```
HOST=0.0.0.0  # Not localhost!
PORT=5000
```

---

## 🧪 **Test Checklist**

Run these tests in order:

### **1. Test on Computer:**

```bash
curl http://localhost:5000/health
```

**Should work!** ✅

### **2. Test Computer's IP:**

```bash
curl http://192.168.1.34:5000/health
```

**Should work!** ✅

### **3. Test from Phone Browser:**

Open Chrome on phone:
```
http://192.168.1.34:5000/health
```

**Should work!** ✅

### **4. Test from App:**

Open GUILD app, check console for:
```
✅ Backend connection successful
```

---

## 🎯 **Quick Fix Summary**

**Most Common Issue:** Windows Firewall blocking port 5000

**Quick Test:** Temporarily disable firewall
**Permanent Fix:** Add firewall rule for port 5000

**Try this first:**
1. Disable Windows Firewall
2. Test on phone browser: `http://192.168.1.34:5000/health`
3. If works → Add firewall rule
4. Re-enable firewall

---

## ✅ **After Connection Works**

1. **Close GUILD app completely** (swipe away)
2. **Reopen app**
3. **Sign in if needed**
4. **Test payment** 🚀

No more "Backend connection failed" warnings!

---

**Still having issues?** Try:
- Different WiFi network
- Mobile hotspot from phone
- USB tethering

