# ⚡ GUILD Admin Portal - Quick Start

## 🚀 5-Minute Setup

### **Step 1: Environment File**

Create `.env.local` in `admin-portal` directory:

```bash
cd admin-portal
copy ENV_TEMPLATE.txt .env.local
```

Then update these 2 values:

1. **Your IP Address** (Line 17):
   ```bash
   # Windows:
   ipconfig
   # Look for IPv4 Address
   
   # Mac/Linux:
   ifconfig
   ```
   Update:
   ```env
   REACT_APP_BACKEND_URL=http://YOUR_IP_HERE:5000
   ```

2. **Firebase API Key** (Line 30):
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select `guild-4f46b` project
   - Settings → Project settings → Web app
   - Copy API key
   - Paste in `.env.local`

### **Step 2: Install & Run**

```bash
# Install dependencies
npm install

# Start server
npm start
```

**Access:** `http://localhost:3000`

### **Step 3: Login**

Use your Firebase admin credentials

---

## ✅ Demo Mode (Default)

The portal starts with **demo mode enabled** automatically!

You'll see realistic data:
- ✅ 156 users
- ✅ 89 jobs  
- ✅ 23 guilds
- ✅ 15 transactions

**To disable:** Click the [X] on yellow banner at top

---

## 📊 What You Get

### **Immediate Access To:**

✅ **Dashboard** - Platform statistics & charts  
✅ **Users** - All registered users  
✅ **Jobs** - Job listings & approvals  
✅ **Guilds** - Guild management  
✅ **Analytics** - Performance metrics  
✅ **Fatora Payments** - Transaction monitoring  
✅ **Demo Mode Controller** - Settings & configuration  
✅ **Backend Monitor** - Server health  

---

## 🆘 Quick Fixes

### **Can't Connect to Backend?**
```bash
# Start backend first:
cd backend
.\start-server-fixed.ps1
```

### **Firebase Errors?**
- Verify Firebase API key in `.env.local`
- Check Firebase Console for correct project

### **Dashboard Shows 0?**
- Enable demo mode (yellow banner toggle)
- OR create data in mobile app

---

## 📚 Full Documentation

Complete guide: `ADMIN_PORTAL_GUIDE.md` (50+ pages)

---

**That's it! You're ready to go! 🎉**

