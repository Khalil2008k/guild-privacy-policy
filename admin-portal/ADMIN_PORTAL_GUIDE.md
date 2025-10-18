# 🎯 GUILD Admin Portal - Complete Guide

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Setup](#environment-setup)
3. [Features Overview](#features-overview)
4. [Demo Mode](#demo-mode)
5. [Fatora Payment Monitoring](#fatora-payment-monitoring)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### **Prerequisites:**
```
✅ Node.js 18+ installed
✅ npm or yarn installed
✅ Backend server running (port 5000)
✅ Firebase project configured
```

### **Installation:**

```bash
# Navigate to admin portal directory
cd admin-portal

# Install dependencies
npm install

# Create environment file
# Copy .env.example to .env.local and update values

# Start development server
npm start
```

**Access:** `http://localhost:3000`

---

## ⚙️ Environment Setup

### **1. Create `.env.local` File:**

Create a file named `.env.local` in the `admin-portal` directory:

```env
# ============================================
# GUILD Admin Portal - Environment Configuration
# ============================================

# Environment
NODE_ENV=development

# Backend API Configuration
REACT_APP_BACKEND_URL=http://192.168.1.34:5000
REACT_APP_API_URL=http://192.168.1.34:5000/api/v1
REACT_APP_WEBSOCKET_URL=ws://192.168.1.34:5000

# Firebase Configuration
REACT_APP_FIREBASE_PROJECT_ID=guild-4f46b
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=guild-4f46b.firebaseapp.com
REACT_APP_FIREBASE_STORAGE_BUCKET=guild-4f46b.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id

# Admin Portal Settings
REACT_APP_ENABLE_DEV_MODE=true
REACT_APP_ENABLE_DEMO_MODE=true
REACT_APP_DEMO_PASSWORD=demo@2025

# Fatora Payment Integration
REACT_APP_FATORA_ENABLED=true
REACT_APP_FATORA_TEST_MODE=true

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_NOTIFICATIONS=true
REACT_APP_ENABLE_CHAT_MONITOR=true
REACT_APP_ENABLE_ADVANCED_MONITORING=true

# Cache Settings
REACT_APP_CACHE_DURATION=300000
REACT_APP_ENABLE_CACHE=true
```

### **2. Update Backend URL:**

Replace `192.168.1.34` with your local machine's IP address:

**Windows:**
```bash
ipconfig
# Look for IPv4 Address under your active network adapter
```

**Mac/Linux:**
```bash
ifconfig
# or
ip addr show
```

### **3. Get Firebase Configuration:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`guild-4f46b`)
3. Click ⚙️ (Settings) → Project settings
4. Scroll down to "Your apps" section
5. Click on the web app (or add one if not exists)
6. Copy the config values to `.env.local`

---

## 🎨 Features Overview

### **Dashboard**
- Real-time platform statistics
- User growth charts
- Revenue analytics
- Recent activity feed
- Pending job approvals

**Features:**
- ✅ Live data from Firebase
- ✅ Demo mode support
- ✅ Caching for performance
- ✅ Time range selection (24h, 7d, 30d, 90d)
- ✅ Export reports

### **Users Management**
- View all registered users
- User profiles and details
- Status management (active/suspended)
- Search and filter
- Bulk actions

### **Jobs Management**
- All job listings
- Job approval workflow
- Status tracking
- Budget monitoring
- Client/Freelancer details

### **Guilds Management**
- View all guilds
- Guild members
- Performance metrics
- Active/Inactive status

### **Analytics**
- Platform-wide metrics
- User engagement
- Revenue trends
- Conversion rates
- Custom date ranges

### **Backend Monitor**
- Real-time server status
- WebSocket connection
- Service health checks
- Error logs
- Performance metrics

### **Fatora Payments** 🆕
- Transaction monitoring
- Payment status tracking
- Revenue analytics
- Search and filter
- Export reports

### **Demo Mode Controller**
- Enable/disable demo mode
- Guild Coins configuration
- PSP configuration
- Demo data seeding
- User coin distribution

### **Advanced Monitoring**
- System metrics
- Database performance
- API response times
- Error tracking
- Custom alerts

### **System Control**
- Server management
- Database backups
- Cache management
- Service restart
- Emergency controls

### **Audit Logs**
- Admin actions log
- User activity tracking
- System events
- Security monitoring

---

## 🧪 Demo Mode

### **What is Demo Mode?**

Demo mode allows you to test the admin portal with realistic sample data without affecting real user information.

### **Features:**
- ✅ 156 realistic demo users
- ✅ 89 demo jobs
- ✅ 23 demo guilds
- ✅ 15 demo transactions
- ✅ Real-time activity simulation
- ✅ Chart data generation

### **How to Enable:**

#### **Method 1: Automatic (Default)**
Demo mode is automatically enabled if:
- `REACT_APP_ENABLE_DEMO_MODE=true` in `.env.local`
- OR localStorage has `adminDemoMode=true`

#### **Method 2: Manual Toggle**
1. Navigate to **Demo Mode Controller** page
2. Click the toggle switch at the top
3. Demo data will be instantly available

### **How to Disable:**

1. Click the **X** button on the demo mode indicator (yellow banner at top)
2. OR navigate to **Demo Mode Controller** and toggle off
3. Page will reload with real Firebase data

### **Demo Mode Indicator:**

When active, you'll see a yellow banner:
```
🧪 DEMO MODE ACTIVE - Using sample data for demonstration [X]
```

### **What Data is Generated?**

**Users:**
- Ahmed Al-Mansoori
- Fatima Al-Khalifa
- Mohammed Al-Thani
- Sarah Al-Attiyah
- Khalid Al-Sulaiti
- Noora Al-Marri
- +150 more...

**Jobs:**
- Mobile App Development
- Logo Design for Startup
- Content Writing
- Website Redesign
- Social Media Management
- +84 more...

**Guilds:**
- Tech Innovators Guild
- Creative Designers Hub
- Digital Marketing Pros
- Content Creators Alliance
- Full-Stack Developers

**Transactions:**
- Various payment statuses
- Different amounts
- Multiple payment methods
- Realistic timestamps

---

## 💳 Fatora Payment Monitoring

### **Overview:**

Monitor all Fatora payment transactions in real-time.

### **Features:**

#### **Statistics Dashboard:**
- Total Transactions
- Successful Payments
- Pending Payments
- Total Revenue
- Success Rate

#### **Transaction List:**
- Transaction ID
- Order ID
- User name
- Amount
- Payment method
- Status
- Timestamp

#### **Filters:**
- Search by Order ID, User, or Transaction ID
- Filter by status (All, Completed, Pending, Failed)
- Date range selection

#### **Actions:**
- View transaction details
- Export reports
- Refresh data
- Real-time updates

### **How to Access:**

1. Navigate to **Fatora Payments** from the sidebar
2. View live transaction data
3. Use filters to find specific transactions
4. Click "View" on any transaction for details
5. Export reports as needed

### **Integration with Backend:**

The payment monitoring page connects to:
- **Endpoint:** `/api/payments/fatora/transactions`
- **WebSocket:** Real-time updates
- **Demo Data:** When demo mode is active

---

## 🔧 Troubleshooting

### **Issue: "Cannot connect to backend"**

**Solution:**
1. Check if backend server is running:
   ```bash
   cd backend
   .\start-server-fixed.ps1
   ```
2. Verify `REACT_APP_BACKEND_URL` in `.env.local`
3. Check your local IP address hasn't changed
4. Disable firewall temporarily to test
5. Try `http://localhost:5000` if on same machine

### **Issue: "Firebase initialization failed"**

**Solution:**
1. Verify Firebase config in `.env.local`
2. Check Firebase Console for correct values
3. Ensure Firebase project is active
4. Check browser console for specific errors

### **Issue: "Dashboard shows 0 values"**

**Solution:**
1. **If in production mode:**
   - This means no data exists in Firebase
   - Create data through the mobile app
   - OR enable demo mode to see sample data

2. **If should have data:**
   - Check Firebase security rules
   - Verify Firebase connection
   - Check browser console for errors

3. **Quick fix:**
   - Enable demo mode to see populated dashboard
   - Navigate to **Demo Mode Controller**
   - Toggle demo mode ON

### **Issue: "Page not loading / White screen"**

**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Check browser console for errors (F12)
3. Restart development server:
   ```bash
   # Stop with Ctrl+C
   npm start
   ```
4. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules
   npm install
   ```

### **Issue: "TypeScript errors"**

**Solution:**
1. Restart TypeScript server in VSCode:
   - Press `Ctrl+Shift+P`
   - Type: "TypeScript: Restart TS Server"
   - Press Enter

2. OR reinstall dependencies:
   ```bash
   npm install --force
   ```

### **Issue: "WebSocket connection failed"**

**Solution:**
1. Check backend server is running
2. Verify `REACT_APP_WEBSOCKET_URL` in `.env.local`
3. Check if port 5000 is available
4. Temporarily disable antivirus/firewall
5. Try using `ws://localhost:5000` if same machine

### **Issue: "Login not working"**

**Solution:**
1. Verify Firebase Authentication is enabled
2. Check email/password in Firebase Console
3. Ensure admin user exists in Firebase Auth
4. Check browser console for auth errors
5. Try password reset if needed

### **Issue: "Demo mode not showing data"**

**Solution:**
1. Check demo mode is enabled (yellow banner visible)
2. Open browser console and check for errors
3. Verify `demoDataService` is imported correctly
4. Try hard refresh (Ctrl+Shift+R)
5. Clear localStorage:
   ```javascript
   // In browser console
   localStorage.clear()
   // Then refresh page
   ```

---

## 📊 Performance Tips

### **1. Enable Caching:**
```env
REACT_APP_ENABLE_CACHE=true
REACT_APP_CACHE_DURATION=300000  # 5 minutes
```

### **2. Use Demo Mode for Testing:**
- Faster than loading real Firebase data
- No rate limits
- Consistent test data

### **3. Optimize Firebase Queries:**
- Dashboard caches data for 5 minutes
- Refresh manually when needed
- Use appropriate time ranges

### **4. Monitor Performance:**
- Check Network tab in DevTools
- Use React DevTools Profiler
- Monitor backend response times

---

## 🔐 Security Best Practices

### **1. Environment Variables:**
- Never commit `.env.local` to Git
- Use different values for dev/prod
- Rotate API keys regularly

### **2. Firebase Security:**
- Enable security rules
- Use admin-only access
- Monitor auth attempts

### **3. API Access:**
- Use HTTPS in production
- Implement rate limiting
- Log all admin actions

### **4. Demo Mode:**
- Clearly indicate when active
- Separate from production data
- Disable in production builds

---

## 📱 Browser Support

**Recommended:**
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

**Not Supported:**
- ❌ Internet Explorer (any version)

---

## 🆘 Support

### **Get Help:**

1. **Check this guide** - Most issues are covered here
2. **Browser Console** - Check for error messages (F12)
3. **Backend Logs** - Check server console output
4. **Firebase Console** - Verify data and rules

### **Common Commands:**

```bash
# Start admin portal
npm start

# Build for production
npm run build

# Run tests
npm test

# Check for updates
npm outdated

# Update dependencies
npm update
```

---

## ✅ Checklist for Launch

### **Before Going Live:**

- [ ] Update `.env.local` with production values
- [ ] Disable demo mode (`REACT_APP_ENABLE_DEMO_MODE=false`)
- [ ] Configure production Firebase project
- [ ] Set up Fatora production API keys
- [ ] Enable Firebase security rules
- [ ] Test all features with real data
- [ ] Set up SSL certificate (HTTPS)
- [ ] Configure production domain
- [ ] Set up monitoring and alerts
- [ ] Create admin user accounts
- [ ] Document admin procedures
- [ ] Train admin staff
- [ ] Set up backup procedures

---

## 🎉 You're Ready!

The admin portal is now fully configured with:

✅ **Demo Mode** - Test with realistic data  
✅ **Fatora Payments** - Monitor transactions  
✅ **Real-time Dashboard** - Live statistics  
✅ **Backend Connection** - Verified and working  
✅ **Firebase Integration** - Connected  
✅ **Performance Optimized** - Caching enabled  

**Start the portal:** `npm start`  
**Access:** `http://localhost:3000`  

Happy administrating! 🚀

