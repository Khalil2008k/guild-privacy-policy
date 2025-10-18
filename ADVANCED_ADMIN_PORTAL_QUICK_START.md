# 🚀 Advanced Admin Portal - Quick Start Guide

## 📋 **Prerequisites**

- Node.js 16+ installed
- Redis server running
- Firebase project configured
- Backend server running

---

## ⚡ **Quick Setup (5 Minutes)**

### **1. Start Backend**
```bash
cd GUILD-3/backend

# Install dependencies (first time only)
npm install

# Start the backend server
npm start
```

Backend will run on `http://localhost:5000`

### **2. Start Admin Portal**
```bash
cd GUILD-3/admin-portal

# Install dependencies (first time only)
npm install

# Start the admin portal
npm start
```

Admin portal will open at `http://localhost:3001`

### **3. Login**
Use your Firebase admin credentials:
- Email: `admin@guild.app`
- Password: Your admin password

---

## 📱 **New Pages**

### **1. Advanced Monitoring** 
**Route**: `/advanced-monitoring`

**What you'll see**:
- ✅ Real-time system metrics (CPU, Memory, Disk, Network)
- ✅ Security monitoring (threats, blocked IPs, suspicious activity)
- ✅ Performance metrics (API response times, database queries, cache hit rates)
- ✅ User activity (active users, registrations, engagement)
- ✅ Financial metrics (revenue, transactions, escrow)
- ✅ Anomaly alerts (automatic detection of unusual patterns)

**Features**:
- 🔴 **Live Updates**: Every 5 seconds via WebSocket
- 📊 **5 Tabs**: System, Security, Performance, Users, Financial
- 🎨 **Color-Coded**: Green (good), Yellow (warning), Red (critical)
- 📈 **Progress Bars**: Visual representation of resource usage
- 🔔 **Anomaly Alerts**: Automatic notifications for issues

### **2. System Control**
**Route**: `/system-control`

**Available Actions**:

1. **Clear Cache**
   - Clear all cache or specific patterns
   - Frees memory and forces data refresh

2. **Optimize Database**
   - Clean expired sessions
   - Remove old verification codes
   - Optimize indexes

3. **Create Backup**
   - Full system backup
   - All Firestore collections
   - Downloadable backup files

4. **Maintenance Mode**
   - Enable/disable maintenance
   - Custom message
   - Schedule maintenance window
   - IP whitelist for admins

5. **Restart Services**
   - Restart all services or individual ones
   - Redis, Cache, Database connections

6. **Emergency Shutdown**
   - Immediately shut down all services
   - Enable maintenance mode
   - Use only in critical situations

7. **Block/Unblock IP**
   - Block suspicious IP addresses
   - Set duration (temporary block)
   - Specify reason

8. **Export User Data (GDPR)**
   - Export complete user data
   - JSON or CSV format
   - GDPR compliance ready

### **3. Audit Logs**
**Route**: `/audit-logs`

**Features**:
- 📜 **Complete Audit Trail**: Every admin action logged
- 🔍 **Advanced Search**: Full-text search across all logs
- 🎯 **Filters**: Date range, category, severity, actor
- 📊 **Statistics**: Dashboard with key metrics
- 📥 **Export**: Download as JSON or CSV
- 🔎 **Detail View**: Click any log for full details

**Filter Options**:
- **Date Range**: Start and end date
- **Category**: System, User, Financial, Security, Data
- **Severity**: Info, Warning, Critical
- **Actor**: Search by admin ID or email

---

## 🔧 **Common Tasks**

### **Monitor System Health**
1. Go to Advanced Monitoring page
2. Check System tab for CPU, Memory, Disk usage
3. Look for red warnings (over 75% usage)
4. Check anomaly alerts at the top

### **Block Suspicious IP**
1. Go to System Control page
2. Find "IP Management" card
3. Enter IP address and reason
4. Click "Block IP"
5. Confirm action

### **Create System Backup**
1. Go to System Control page
2. Find "System Backup" card
3. Click "Create Backup"
4. Wait for completion
5. Backup saved in `backend/backups/`

### **Enable Maintenance Mode**
1. Go to System Control page
2. Find "Maintenance Mode" card
3. Enter maintenance message
4. Click "Enable"
5. Users will see maintenance page

### **Search Audit Logs**
1. Go to Audit Logs page
2. Enter search term in search box
3. Press Enter or click Apply Filters
4. View results
5. Click any log for details

### **Export Compliance Report**
1. Go to Audit Logs page
2. Select date range
3. Select filters (category, severity)
4. Click "Export JSON" or "Export CSV"
5. File downloads automatically

---

## 📊 **Understanding Metrics**

### **System Metrics**

**CPU Usage**:
- 🟢 0-50%: Normal
- 🟡 50-75%: Moderate
- 🔴 75-100%: High (investigate)

**Memory Usage**:
- 🟢 0-60%: Normal
- 🟡 60-80%: Moderate
- 🔴 80-100%: High (add more RAM or optimize)

**Disk Usage**:
- 🟢 0-70%: Normal
- 🟡 70-85%: Moderate
- 🔴 85-100%: Critical (add more storage)

### **Security Metrics**

**Authentication Attempts**:
- Monitor failed login attempts
- High failure rate = possible attack
- Blocked attempts show security working

**Suspicious Activity**:
- Flagged users: Unusual behavior detected
- Blocked IPs: Known threats or repeated failures
- Count: Number of suspicious events

### **Performance Metrics**

**API Response Time**:
- 🟢 0-100ms: Excellent
- 🟡 100-500ms: Good
- 🔴 500ms+: Slow (optimize)

**Cache Hit Rate**:
- 🟢 80-100%: Excellent
- 🟡 60-80%: Good
- 🔴 0-60%: Poor (check cache strategy)

**Database Queries**:
- Monitor slow queries
- High count = optimize indexes
- Avg query time should be < 50ms

---

## 🚨 **Emergency Procedures**

### **High CPU Usage**
1. Check anomaly alerts
2. Go to System Control
3. Restart services
4. If persists, enable maintenance mode
5. Investigate in logs

### **Security Threat Detected**
1. Check Security tab in monitoring
2. Review blocked IPs
3. Check suspicious activity
4. Block additional IPs if needed
5. Review audit logs for details

### **System Unresponsive**
1. Check system health in monitoring
2. Try restarting services
3. If critical, use Emergency Shutdown
4. Enable maintenance mode
5. Contact technical support

### **Database Performance Issues**
1. Check slow queries in Performance tab
2. Run Database Optimization
3. Check disk space
4. Consider scaling database

---

## 🎓 **Best Practices**

### **Daily Tasks**
✅ Check Advanced Monitoring dashboard
✅ Review anomaly alerts
✅ Check critical audit logs
✅ Verify system health

### **Weekly Tasks**
✅ Create system backup
✅ Review audit statistics
✅ Optimize database
✅ Clear old cache

### **Monthly Tasks**
✅ Export compliance report
✅ Review top active admins
✅ Analyze user activity trends
✅ Review security incidents

### **As Needed**
✅ Block/unblock IPs
✅ Export user data (GDPR requests)
✅ Enable maintenance mode (updates)
✅ Emergency actions (critical issues)

---

## 🔐 **Security Notes**

### **Permissions Required**
- **Super Admin**: All actions
- **Admin**: Most actions (no emergency shutdown)
- **Moderator**: View-only

### **Logged Actions**
Every action is logged with:
- Who performed it (admin ID, email)
- What was done (action, resource)
- When it happened (timestamp)
- IP address and user agent
- Success/failure status

### **Critical Actions**
These actions require extra confirmation:
- ⚠️ Emergency Shutdown
- ⚠️ Maintenance Mode
- ⚠️ Delete actions
- ⚠️ Block IPs

---

## 📞 **Support**

### **Documentation**
- **Full Documentation**: `ADVANCED_ADMIN_PORTAL_DOCUMENTATION.md`
- **Implementation Details**: `ADVANCED_ADMIN_PORTAL_IMPLEMENTATION_COMPLETE.md`
- **This Guide**: `ADVANCED_ADMIN_PORTAL_QUICK_START.md`

### **API Endpoints**
- **Monitoring**: `/api/admin-system/monitoring/*`
- **Control**: `/api/admin-system/control/*`
- **Audit**: `/api/admin-system/audit/*`
- **WebSocket**: `ws://localhost:5000/admin-ws`

### **Troubleshooting**

**WebSocket not connecting?**
- Check backend is running
- Check firewall settings
- Verify WebSocket port is open

**Metrics not updating?**
- Check WebSocket connection status (top right)
- Refresh the page
- Check browser console for errors

**Actions failing?**
- Verify admin permissions
- Check backend logs
- Ensure services are running

---

## 🎯 **Quick Reference**

### **Keyboard Shortcuts**
- `Ctrl/Cmd + R`: Refresh page
- `Escape`: Close modals
- `Enter`: Submit forms/searches

### **Status Indicators**
- 🟢 **Green**: Normal/Success
- 🟡 **Yellow**: Warning/Moderate
- 🔴 **Red**: Critical/Error
- ⚪ **Gray**: Inactive/Disabled

### **Common Icons**
- 📊 Chart: Metrics/Analytics
- ⚙️ Gear: Settings/Configuration
- 🔒 Lock: Security/Authentication
- 💾 Disk: Storage/Backup
- 🔄 Refresh: Update/Restart
- ⚠️ Warning: Alert/Caution
- ✓ Check: Success/Completed
- ✗ Cross: Failed/Error

---

## ✨ **Pro Tips**

1. **Keep monitoring open**: Leave it open in a separate tab for real-time alerts
2. **Regular backups**: Create backups before major changes
3. **Check logs daily**: Review audit logs for unusual activity
4. **Monitor trends**: Watch for patterns in metrics over time
5. **Test maintenance mode**: Test it during off-peak hours first
6. **Document actions**: Add notes when performing critical actions
7. **Use search**: Audit log search is powerful - use it!
8. **Export data**: Regular exports for compliance and analysis
9. **Watch anomalies**: AI detection is early warning system
10. **Stay updated**: Check documentation for new features

---

## 🚀 **You're Ready!**

You now have everything you need to use the advanced admin portal effectively. 

Remember:
- ✅ Monitor regularly
- ✅ Act on alerts
- ✅ Document actions
- ✅ Create backups
- ✅ Review logs

**Happy Administrating! 🎉**

---

*Quick Start Guide*  
*Version: 2.0.0*  
*Last Updated: October 13, 2025*  
*For Full Documentation, see: ADVANCED_ADMIN_PORTAL_DOCUMENTATION.md*

