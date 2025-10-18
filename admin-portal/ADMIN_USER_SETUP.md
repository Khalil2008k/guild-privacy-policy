# 🔧 Admin User Setup Guide

## 🚨 **IMPORTANT: Admin User Required**

The admin portal now requires a **real Firebase admin user** with proper custom claims. The demo mode has been completely removed.

---

## 🎯 **OPTION 1: Quick Setup (Recommended)**

### **Create Admin User in Firebase Console**

1. **Go to Firebase Console**: https://console.firebase.google.com/project/guild-4f46b
2. **Navigate to Authentication > Users**
3. **Click "Add User"**
4. **Enter:**
   - Email: `admin@guild.app`
   - Password: `admin123`
5. **Click "Add User"**

### **Set Admin Role**

1. **Find the created user** in the Users list
2. **Click on the user**
3. **Go to "Custom Claims" tab**
4. **Add custom claim:**
   ```json
   {
     "role": "super_admin"
   }
   ```
5. **Save the custom claims**

---

## 🎯 **OPTION 2: Automated Setup (Advanced)**

### **Using Firebase Admin SDK**

1. **Download Service Account Key:**
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file securely

2. **Update setup script:**
   ```javascript
   // Edit admin-portal/setup-admin-user.js
   const serviceAccount = require('./path-to-your-service-account-key.json');
   ```

3. **Run setup script:**
   ```bash
   cd admin-portal
   npm install firebase-admin
   node setup-admin-user.js
   ```

---

## 🎯 **OPTION 3: Use Your Own Account**

### **Make Your Guild App Account an Admin**

1. **Create account in Guild mobile app** (if not already done)
2. **Find your user ID** in Firebase Console > Authentication
3. **Set custom claims** for your user:
   ```json
   {
     "role": "super_admin"
   }
   ```
4. **Login to admin portal** with your Guild app credentials

---

## 🔍 **VERIFICATION STEPS**

### **Test Admin Access:**

1. **Open admin portal**: `http://localhost:3000`
2. **Login** with your admin credentials
3. **Verify access** to all pages:
   - Dashboard (analytics)
   - Users (user management)
   - Job Approval (job moderation)
   - Analytics (platform insights)

### **Test Real Data Integration:**

1. **Create a test user** in Guild mobile app
2. **Post a test job** in Guild mobile app
3. **Check admin portal** - you should see:
   - Real user in Users page
   - Real job in Job Approval page
   - Real analytics on Dashboard

---

## 🚨 **TROUBLESHOOTING**

### **Login Fails with "Unauthorized"**
- **Cause**: User doesn't have admin role custom claims
- **Solution**: Set custom claims in Firebase Console

### **"User not found" Error**
- **Cause**: Admin user doesn't exist in Firebase Auth
- **Solution**: Create user in Firebase Console Authentication

### **Empty Data in Admin Portal**
- **Cause**: No users/jobs exist in Firebase yet
- **Solution**: Create test data in Guild mobile app

### **Permission Denied Errors**
- **Cause**: Firestore rules not deployed
- **Solution**: Run `firebase deploy --only firestore:rules`

---

## 🔐 **SECURITY NOTES**

### **Production Security:**
- **Change default password** after first login
- **Use strong passwords** for all admin accounts
- **Enable 2FA** for admin accounts (recommended)
- **Regularly audit** admin access logs

### **Role Hierarchy:**
- **super_admin**: Full access to everything
- **admin**: User management, job approval, analytics
- **moderator**: Limited to content moderation

### **Custom Claims Structure:**
```json
{
  "role": "super_admin",  // or "admin" or "moderator"
  "department": "operations",  // optional
  "permissions": ["*"]  // optional custom permissions
}
```

---

## ✅ **AFTER SETUP COMPLETE**

Once you have an admin user set up with proper custom claims:

1. **Login to admin portal** with real Firebase credentials
2. **All dummy data removed** - portal shows only real Firebase data
3. **Complete integration** with Guild mobile app
4. **Real-time synchronization** between app and portal
5. **Production-ready** admin functionality

The admin portal will now work exclusively with real Firebase data and require proper admin authentication! 🎉
