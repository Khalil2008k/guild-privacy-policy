# 📋 GOOGLE PLAY STORE - DATA SAFETY FORM
## Complete Answers for GUILD App

---

## 🔍 SECTION 1: DATA COLLECTION & SECURITY

### **Does your app collect or share any of the required user data types?**
✅ **YES**

---

## 📊 SECTION 2: DATA TYPES COLLECTED

### **1. Personal Information**

#### ✅ **Name**
- **Collected:** YES
- **Required/Optional:** Required for account creation
- **Purpose:** Account management, App functionality
- **Shared with third parties:** NO
- **Can user request deletion:** YES
- **Data encrypted in transit:** YES
- **Data encrypted at rest:** YES

#### ✅ **Email address**
- **Collected:** YES  
- **Required/Optional:** Required for account creation
- **Purpose:** Account management, Communications, App functionality
- **Shared with third parties:** NO
- **Can user request deletion:** YES
- **Data encrypted in transit:** YES
- **Data encrypted at rest:** YES

#### ✅ **Phone number**
- **Collected:** YES
- **Required/Optional:** Optional (for verification)
- **Purpose:** Account management, Fraud prevention, Communications
- **Shared with third parties:** NO
- **Can user request deletion:** YES
- **Data encrypted in transit:** YES
- **Data encrypted at rest:** YES

---

### **2. Financial Info**

#### ✅ **Payment info**
- **Collected:** YES
- **Required/Optional:** Optional (only when making payments)
- **Purpose:** Payment processing
- **Shared with third parties:** YES (Payment processor: Fatora PSP)
- **Can user request deletion:** YES
- **Data encrypted in transit:** YES
- **Data encrypted at rest:** YES
- **Note:** Credit card data is NOT stored on our servers. Processed by PCI-compliant payment processor (Fatora).

#### ✅ **Purchase history**
- **Collected:** YES
- **Required/Optional:** Automatic when transactions occur
- **Purpose:** App functionality, Account management, Fraud prevention
- **Shared with third parties:** NO
- **Can user request deletion:** YES
- **Data encrypted in transit:** YES
- **Data encrypted at rest:** YES

---

### **3. Location**

#### ✅ **Approximate location**
- **Collected:** YES
- **Required/Optional:** Optional (user-provided for job postings)
- **Purpose:** App functionality (job matching by location)
- **Shared with third parties:** NO
- **Can user request deletion:** YES
- **Data encrypted in transit:** YES
- **Data encrypted at rest:** YES
- **Note:** Location is ONLY collected when user chooses to add it to job postings. No background location tracking.

#### ❌ **Precise location**
- **Collected:** NO

---

### **4. Personal Communications**

#### ✅ **Messages**
- **Collected:** YES
- **Required/Optional:** Optional (when using in-app chat)
- **Purpose:** App functionality (communication between users)
- **Shared with third parties:** NO
- **Can user request deletion:** YES
- **Data encrypted in transit:** YES
- **Data encrypted at rest:** YES

---

### **5. Photos and Videos**

#### ✅ **Photos**
- **Collected:** YES
- **Required/Optional:** Optional (profile pictures, job attachments)
- **Purpose:** App functionality, Personalization
- **Shared with third parties:** YES (Cloud storage: Cloudinary for hosting)
- **Can user request deletion:** YES
- **Data encrypted in transit:** YES
- **Data encrypted at rest:** NO (stored on Cloudinary CDN)

---

### **6. Files and Docs**

#### ✅ **Files and docs**
- **Collected:** YES
- **Required/Optional:** Optional (job attachments, contracts)
- **Purpose:** App functionality
- **Shared with third parties:** YES (Cloud storage: Cloudinary)
- **Can user request deletion:** YES
- **Data encrypted in transit:** YES
- **Data encrypted at rest:** NO (stored on Cloudinary CDN)

---

### **7. App Activity**

#### ✅ **App interactions**
- **Collected:** YES
- **Required/Optional:** Automatic
- **Purpose:** Analytics, App functionality
- **Shared with third parties:** NO
- **Can user request deletion:** YES
- **Data encrypted in transit:** YES
- **Data encrypted at rest:** YES

#### ✅ **In-app search history**
- **Collected:** YES
- **Required/Optional:** Automatic
- **Purpose:** App functionality (job search)
- **Shared with third parties:** NO
- **Can user request deletion:** YES
- **Data encrypted in transit:** YES
- **Data encrypted at rest:** YES

---

### **8. App Info and Performance**

#### ✅ **Crash logs**
- **Collected:** YES
- **Required/Optional:** Automatic
- **Purpose:** Analytics, App functionality
- **Shared with third parties:** YES (Sentry for error monitoring)
- **Can user request deletion:** YES
- **Data encrypted in transit:** YES
- **Data encrypted at rest:** YES

#### ✅ **Diagnostics**
- **Collected:** YES
- **Required/Optional:** Automatic
- **Purpose:** Analytics, App functionality
- **Shared with third parties:** YES (Sentry, OpenTelemetry)
- **Can user request deletion:** YES
- **Data encrypted in transit:** YES
- **Data encrypted at rest:** YES

---

### **9. Device or Other IDs**

#### ✅ **Device or other IDs**
- **Collected:** YES
- **Required/Optional:** Automatic
- **Purpose:** App functionality (push notifications), Fraud prevention
- **Shared with third parties:** YES (Firebase for push notifications)
- **Can user request deletion:** YES
- **Data encrypted in transit:** YES
- **Data encrypted at rest:** YES

---

## ❌ DATA TYPES **NOT** COLLECTED

- ❌ User IDs (other than Firebase UID)
- ❌ Address (physical address)
- ❌ Credit info (credit score, etc.)
- ❌ Other financial info
- ❌ Precise location
- ❌ Emails (content)
- ❌ SMS or MMS
- ❌ Other in-app messages
- ❌ Audio files
- ❌ Music files
- ❌ Other audio files
- ❌ Videos
- ❌ Voice or sound recordings
- ❌ Health info
- ❌ Fitness info
- ❌ Contacts
- ❌ Calendar events
- ❌ Web browsing history
- ❌ Other user-generated content
- ❌ Other actions
- ❌ Other app performance data

---

## 🔐 SECTION 3: SECURITY PRACTICES

### **All user data is:**

✅ **Encrypted in transit**
- Data transferred between user's device and servers uses HTTPS/TLS encryption

✅ **Encrypted at rest** (for sensitive data)
- User credentials, financial data, and personal information are encrypted in Firebase

✅ **Users can request data deletion**
- Users can request deletion through app settings or by contacting support

✅ **Committed to Google Play Families Policy**
- App follows all Google Play policies for user data protection

---

## 🌐 SECTION 4: THIRD-PARTY DATA SHARING

### **Third parties that receive user data:**

1. **Firebase (Google)**
   - **Purpose:** Authentication, Database, Push Notifications
   - **Data shared:** Email, Name, Phone, Device IDs, App Activity
   - **Link:** https://firebase.google.com/support/privacy

2. **Fatora PSP**
   - **Purpose:** Payment Processing
   - **Data shared:** Payment information (processed, not stored by us)
   - **Link:** https://maktapp.credit

3. **Cloudinary**
   - **Purpose:** Image/File Hosting
   - **Data shared:** Photos, Files uploaded by users
   - **Link:** https://cloudinary.com/privacy

4. **Sentry**
   - **Purpose:** Error Monitoring & Crash Reporting
   - **Data shared:** Crash logs, Diagnostics, Device info
   - **Link:** https://sentry.io/privacy/

5. **Nodemailer (SMTP)**
   - **Purpose:** Email Notifications
   - **Data shared:** Email addresses
   - **Link:** Depends on SMTP provider

---

## 📝 SECTION 5: DATA USAGE & PURPOSE

### **Why we collect data:**

1. **App functionality**
   - Core features like job posting, applications, messaging, payments

2. **Analytics**
   - Understanding app usage to improve user experience

3. **Developer communications**
   - Sending notifications about jobs, messages, and platform updates

4. **Fraud prevention, security, and compliance**
   - Protecting users and preventing abuse

5. **Personalization**
   - Customizing user experience (profile pictures, preferences)

6. **Account management**
   - Managing user accounts and authentication

---

## 🗑️ SECTION 6: DATA DELETION

### **Users can request deletion of their data:**
✅ **YES**

### **How users can request deletion:**
1. **In-app:** Settings → Account → Delete Account
2. **Email:** support@guildapp.com (or your support email)
3. **Response time:** Within 30 days

### **What gets deleted:**
- Personal information (name, email, phone)
- Profile data
- Job postings
- Messages
- Transaction history
- All associated data

### **What may be retained:**
- Anonymized analytics data (no personal identifiers)
- Data required for legal/compliance purposes (7 years for financial records)

---

## 📱 SECTION 7: APP CATEGORY

**Primary Category:** Business  
**Content Rating:** Everyone (with in-app purchases)

---

## ✅ SECTION 8: COMPLIANCE

### **Your app complies with:**
✅ Google Play Developer Program Policies  
✅ Google Play Families Policy (if applicable)  
✅ GDPR (for EU users)  
✅ CCPA (for California users)  
✅ PCI DSS (for payment processing)

---

## 📞 SECTION 9: CONTACT & PRIVACY POLICY

### **Privacy Policy URL:**
`https://guildapp.com/privacy` (Update with your actual URL)

### **Support Email:**
`support@guildapp.com` (Update with your actual email)

### **Data Protection Officer (if applicable):**
`dpo@guildapp.com` (Optional, for GDPR compliance)

---

## 🎯 QUICK SUMMARY FOR GOOGLE PLAY

**Data collected:** Personal info, Financial info, Location (optional), Messages, Photos, App activity, Device IDs

**Data shared:** Only with essential service providers (Firebase, Fatora PSP, Cloudinary, Sentry)

**Security:** All data encrypted in transit, sensitive data encrypted at rest

**User control:** Users can request data deletion at any time

**Purpose:** App functionality, Analytics, Communications, Fraud prevention

---

## 📋 CHECKLIST BEFORE SUBMISSION

- [ ] Privacy Policy URL is live and accessible
- [ ] Support email is monitored and responsive
- [ ] Data deletion process is implemented in app
- [ ] All third-party integrations are documented
- [ ] Encryption is properly implemented
- [ ] GDPR/CCPA compliance measures are in place
- [ ] Payment processing is PCI-compliant
- [ ] User consent mechanisms are in place
- [ ] Data retention policies are documented

---

**Last Updated:** October 18, 2025  
**App Version:** 1.0.0  
**Review this document before each app update!**















