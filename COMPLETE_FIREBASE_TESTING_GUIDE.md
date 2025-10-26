# 🧪 Complete Firebase Testing Guide - All 120 Collections

## 📊 COMPREHENSIVE COLLECTION MAPPING

This document maps **EVERY** Firebase collection to its usage in the app, so you can test them systematically.

---

## 🎯 CRITICAL: Before Testing

1. ✅ **Update Backend Service Account**
   - Download from: https://console.firebase.google.com/project/guild-4f46b/settings/serviceaccounts/adminsdk
   - Replace: `GUILD-3/backend/serviceAccountKey.json`
   - Restart backend server

2. ✅ **Verify Project Configuration**
   - Frontend: `guild-4f46b` ✅
   - Admin Portal: `guild-4f46b` ✅
   - Backend: `guild-4f46b` ⚠️ (needs service account update)

3. ✅ **Wait for Rules Propagation**
   - Wait 1-2 minutes after deployment
   - Rules are already deployed

---

## 📋 TESTING BY FEATURE (Organized by User Flow)

### 1. 👤 USER AUTHENTICATION & PROFILE (10 Collections)

#### Collections:
1. **`users`** - Main user profiles
2. **`users/{userId}/blockedUsers`** - Blocked users subcollection
3. **`userProfiles`** - Extended user profiles
4. **`userSkills`** - User skills and expertise
5. **`userAttributes`** - User metadata
6. **`verification_status`** - Verification status
7. **`verificationDocuments`** - KYC documents
8. **`verification_codes`** - Email/SMS codes
9. **`user_blocks`** - System-level blocks
10. **`qrScans`** - QR code scan history

#### Test Steps:
```
✅ Sign Up
- File: src/contexts/AuthContext.tsx
- Creates: users, wallets, userProfiles
- Test: Create new account with email/password

✅ Sign In
- File: src/contexts/AuthContext.tsx
- Reads: users
- Test: Login with existing account

✅ Update Profile
- File: src/contexts/UserProfileContext.tsx
- Updates: users, userProfiles
- Test: Edit name, bio, avatar

✅ Upload Profile Image
- File: src/services/firebase/FirebaseInitService.ts
- Writes to: Storage /users/{userId}/profile/
- Test: Upload profile picture

✅ Add Skills
- File: src/services/jobService.ts
- Writes to: userSkills
- Test: Add skills to profile

✅ Block User
- File: src/app/(modals)/user-profile/[userId].tsx
- Writes to: users/{userId}/blockedUsers
- Test: Block another user

✅ QR Code Scan
- File: src/app/(modals)/qr-scanner.tsx
- Writes to: qrScans
- Test: Scan user QR code
```

---

### 2. 💰 WALLET & COINS (20 Collections)

#### Collections:
11. **`wallets`** - User coin wallets
12. **`user_wallets`** - Alternative wallet collection
13. **`coins`** - Coin definitions
14. **`coin_instances`** - Individual coin instances
15. **`coin_counters`** - Coin minting counters
16. **`mint_batches`** - Coin minting batches
17. **`quarantined_coins`** - Suspicious coins
18. **`coin_purchases`** - Coin purchase history
19. **`coin_withdrawals`** - Withdrawal requests
20. **`wallet_transactions`** - Transaction history
21. **`transactions`** - General transactions
22. **`transaction_records`** - Transaction records
23. **`payments`** - Payment records
24. **`payment_records`** - Payment metadata
25. **`paymentReleaseTimers`** - Auto-release timers
26. **`paymentReleases`** - Payment releases
27. **`balanceReconciliations`** - Balance checks
28. **`ledger`** - Financial ledger
29. **`fakeWallets`** - Test wallets
30. **`savingsPlans`** - Savings plans
31. **`savingsTransactions`** - Savings transactions

#### Test Steps:
```
✅ View Wallet
- File: src/app/(modals)/wallet.tsx
- Reads: wallets, wallet_transactions
- Test: Open wallet screen

✅ Purchase Coins
- File: src/app/(modals)/coin-store.tsx
- Writes to: coin_purchases, wallet_transactions, wallets
- Test: Buy coins with Fatora payment

✅ View Coin Inventory
- File: src/app/(modals)/coin-wallet.tsx
- Reads: wallets, coins, coin_instances
- Test: View individual coins

✅ Request Withdrawal
- File: src/app/(modals)/coin-withdrawal.tsx
- Writes to: coin_withdrawals
- Test: Request coin withdrawal

✅ View Transaction History
- File: src/app/(modals)/coin-transactions.tsx
- Reads: wallet_transactions
- Test: View all transactions

✅ View Detailed History
- File: src/app/(modals)/transaction-history.tsx
- Reads: wallet_transactions, transaction_records
- Test: Search and filter transactions

✅ Wallet Settings
- File: src/app/(modals)/wallet-settings.tsx
- Reads/Writes: Local storage (no Firestore)
- Test: Toggle notifications, biometric
```

---

### 3. 💼 JOBS & OFFERS (13 Collections)

#### Collections:
32. **`jobs`** - Main jobs collection
33. **`jobs/{jobId}/offers`** - Job offers subcollection
34. **`job_offers`** - Alternative offers collection
35. **`offers`** - Standalone offers
36. **`jobApplications`** - Job applications
37. **`applications`** - Alternative applications
38. **`contracts`** - Job contracts
39. **`escrows`** - Payment escrows
40. **`escrow`** - Alternative escrow collection
41. **`disputes`** - Job disputes
42. **`disputes/{disputeId}/messages`** - Dispute messages subcollection
43. **`reviews`** - Job reviews
44. **`courtSessions`** - Guild court sessions

#### Test Steps:
```
✅ Browse Jobs
- File: src/app/(main)/jobs.tsx
- Reads: jobs (where status='open', adminStatus='approved')
- Test: View job list

✅ Search Jobs
- File: src/app/(modals)/job-search.tsx
- Reads: jobs (with filters)
- Test: Search with filters

✅ View Job Details
- File: src/app/(modals)/job-details.tsx
- Reads: jobs
- Test: Open job details

✅ Create Job
- File: src/app/(modals)/add-job.tsx
- Writes to: jobs, notifications (admin)
- Test: Post new job

✅ Submit Offer
- File: src/app/(modals)/apply/[jobId].tsx
- Writes to: jobs/{jobId}/offers, notifications
- Test: Submit job offer

✅ Accept Offer (Create Escrow)
- File: src/app/(modals)/job-accept/[jobId].tsx
- Writes to: escrows, jobs (update status)
- Test: Accept offer, coins locked

✅ Complete Job (Release Escrow)
- File: src/app/(modals)/job-completion.tsx
- Writes to: escrows (release), wallet_transactions
- Test: Complete job, 90% to doer, 10% platform fee

✅ Raise Dispute
- File: src/app/(modals)/job-dispute.tsx
- Writes to: disputes, escrows (flag)
- Test: Raise dispute on job

✅ Job Discussion
- File: src/app/(modals)/job-discussion.tsx
- Reads/Writes: chats/{chatId}/messages
- Test: Chat about job

✅ Review Job
- File: src/services/jobService.ts (submitReview)
- Writes to: reviews
- Test: Leave review after completion

✅ My Jobs
- File: src/app/(modals)/my-jobs.tsx
- Reads: jobs (where clientId=userId)
- Test: View your posted jobs
```

---

### 4. 🏰 GUILDS (11 Collections)

#### Collections:
45. **`guilds`** - Main guilds collection
46. **`guildMembers`** - Guild members
47. **`guildMemberships`** - Guild memberships
48. **`guild_members`** - Alternative members collection
49. **`guildAnnouncements`** - Guild announcements
50. **`guildInvitations`** - Guild invitations
51. **`guildIds`** - Guild ID registry
52. **`gids`** - Guild IDs
53. **`gidContainers`** - GID containers
54. **`gidSequences`** - GID sequences
55. **`guild_vault_daily`** - Guild vault

#### Test Steps:
```
✅ Browse Guilds
- File: src/app/(modals)/guilds.tsx
- Reads: guilds (where isPublic=true)
- Test: View guild list

✅ Create Guild (2500 QR Coins)
- File: src/app/(modals)/create-guild.tsx
- Writes to: guilds, guildMembers, wallets (deduct 2500)
- Test: Create guild, verify coin deduction

✅ Join Guild
- File: src/services/firebase/GuildService.ts
- Writes to: guildMembers, guildMemberships
- Test: Join existing guild

✅ View Guild Members
- File: src/services/firebase/GuildService.ts
- Reads: guilds/{guildId}/members
- Test: View member list

✅ Guild Invitations
- File: src/services/firebase/GuildService.ts
- Reads/Writes: guildInvitations
- Test: Send/receive invitations

✅ Guild Announcements
- File: src/services/firebase/GuildService.ts
- Reads/Writes: guildAnnouncements
- Test: Post guild announcement

✅ Guild Map
- File: src/app/(modals)/guild-map.tsx
- Reads: guilds (with location)
- Test: View guilds on map
```

---

### 5. 💬 CHAT & MESSAGING (7 Collections)

#### Collections:
56. **`chats`** - Main chats collection
57. **`chats/{chatId}/messages`** - Chat messages subcollection
58. **`messages`** - Standalone messages
59. **`file_uploads`** - File upload metadata
60. **`message-audit-trail`** - Message audit trail
61. **`messageSearch`** - Message search index
62. **`chatOptions`** - Chat options

#### Test Steps:
```
✅ View Chat List
- File: src/app/(main)/chat.tsx
- Reads: chats (where participants contains userId)
- Test: View all chats

✅ Start New Chat
- File: src/services/chatService.ts
- Writes to: chats
- Test: Start chat with user

✅ Send Text Message
- File: src/services/chatService.ts
- Writes to: chats/{chatId}/messages
- Test: Send text message

✅ Upload Image
- File: src/services/chatFileService.ts
- Writes to: Storage /chats/{chatId}/files/, file_uploads
- Test: Send image in chat

✅ Upload File
- File: src/services/chatFileService.ts
- Writes to: Storage /chats/{chatId}/files/, file_uploads
- Test: Send document in chat

✅ Share Location
- File: src/components/ChatInput.tsx
- Writes to: chats/{chatId}/messages (type: location)
- Test: Share location in chat

✅ Admin Chat
- File: src/services/AdminChatService.ts
- Reads/Writes: admin_chats, admin_chats/{chatId}/messages
- Test: Chat with support (auto-created on signup)

✅ Search Messages
- File: src/services/messageSearchService.ts
- Reads: chats/{chatId}/messages, messageSearch
- Test: Search within chat
```

---

### 6. 🔔 NOTIFICATIONS (5 Collections)

#### Collections:
63. **`notifications`** - User notifications
64. **`notificationPreferences`** - Notification preferences
65. **`notificationSettings`** - Notification settings
66. **`deviceTokens`** - Push notification tokens
67. **`notificationActionLogs`** - Notification action logs

#### Test Steps:
```
✅ View Notifications
- File: src/app/(modals)/notifications.tsx
- Reads: notifications (where userId=currentUser)
- Test: View notification list

✅ Notification Preferences
- File: src/services/firebaseNotificationService.ts
- Reads/Writes: notificationPreferences
- Test: Toggle notification types

✅ Device Token Registration
- File: src/services/firebaseNotificationService.ts
- Writes to: deviceTokens
- Test: Register for push notifications

✅ Mark as Read
- File: src/services/firebaseNotificationService.ts
- Updates: notifications (isRead=true)
- Test: Mark notification as read

✅ Notification Actions
- File: src/services/firebaseNotificationService.ts
- Writes to: notificationActionLogs
- Test: Click notification
```

---

### 7. 📢 ANNOUNCEMENTS & SUPPORT (5 Collections)

#### Collections:
68. **`announcements`** - System announcements
69. **`admin_chats`** - Admin support chats
70. **`admin_chats/{chatId}/messages`** - Admin chat messages subcollection
71. **`feedback`** - User feedback
72. **`knowledgeBase`** - Knowledge base articles
73. **`faqs`** - FAQ questions

#### Test Steps:
```
✅ View Announcements
- File: src/app/(modals)/announcement-center.tsx
- Reads: announcements
- Test: View system announcements

✅ Admin Chat (Support)
- File: src/services/AdminChatService.ts
- Reads/Writes: admin_chats, admin_chats/{chatId}/messages
- Test: Chat with support

✅ Submit Feedback
- File: src/app/(modals)/feedback-system.tsx
- Writes to: feedback
- Test: Submit feedback

✅ View Feedback History
- File: src/app/(modals)/feedback-system.tsx
- Reads: feedback (where userId=currentUser)
- Test: View your feedback

✅ Knowledge Base
- File: src/app/(modals)/knowledge-base.tsx
- Reads: knowledgeBase, faqs
- Test: Browse help articles

✅ FAQs
- File: src/app/(modals)/knowledge-base.tsx
- Reads: faqs
- Test: View FAQ list
```

---

### 8. 🏆 ACHIEVEMENTS & LEADERBOARDS (5 Collections)

#### Collections:
74. **`achievements`** - User achievements
75. **`leaderboards`** - Leaderboards
76. **`leaderboardEntries`** - Leaderboard entries
77. **`competitions`** - Competitions
78. **`badges`** - User badges

#### Test Steps:
```
✅ View Leaderboards
- File: src/app/(modals)/leaderboards.tsx
- Reads: leaderboards, leaderboardEntries
- Test: View leaderboard rankings

✅ View Achievements
- File: src/app/(modals)/profile-stats.tsx
- Reads: achievements (where userId=currentUser)
- Test: View your achievements

✅ View Badges
- File: src/app/(modals)/profile-stats.tsx
- Reads: badges (where userId=currentUser)
- Test: View earned badges

✅ Competitions
- File: Backend auto-creates
- Reads: competitions
- Test: View active competitions
```

---

### 9. 💵 TAX & CURRENCY (6 Collections)

#### Collections:
79. **`taxConfigurations`** - Tax configurations
80. **`taxCalculations`** - Tax calculations
81. **`taxDocuments`** - Tax documents
82. **`userTaxProfiles`** - User tax profiles
83. **`currencies`** - Currency definitions
84. **`currencyConversions`** - Currency conversions
85. **`exchangeRates`** - Exchange rates
86. **`userCurrencyPreferences`** - Currency preferences

#### Test Steps:
```
✅ View Tax Profile
- File: src/app/(modals)/user-settings.tsx
- Reads: userTaxProfiles
- Test: View tax settings

✅ Tax Calculations
- File: Backend auto-calculates
- Writes to: taxCalculations
- Test: Complete job, verify tax calculation

✅ Currency Conversion
- File: Backend services
- Reads: exchangeRates, currencies
- Test: View prices in different currencies

✅ Currency Preferences
- File: src/app/(modals)/user-settings.tsx
- Reads/Writes: userCurrencyPreferences
- Test: Change preferred currency
```

---

### 10. 📊 INVOICES & SAVINGS (6 Collections)

#### Collections:
87. **`invoices`** - Invoices
88. **`invoiceSettings`** - Invoice settings
89. **`invoiceTemplates`** - Invoice templates
90. **`savingsPlans`** - Savings plans
91. **`savingsTransactions`** - Savings transactions

#### Test Steps:
```
✅ Generate Invoice
- File: Backend auto-generates
- Writes to: invoices
- Test: Complete job, verify invoice creation

✅ Invoice Settings
- File: src/app/(modals)/user-settings.tsx
- Reads/Writes: invoiceSettings
- Test: Configure invoice details

✅ Savings Plan
- File: src/app/(modals)/wallet-dashboard.tsx
- Reads/Writes: savingsPlans, savingsTransactions
- Test: Create savings plan
```

---

### 11. 🔐 SECURITY & MONITORING (11 Collections)

#### Collections:
92. **`security_events`** - Security events
93. **`security_alerts`** - Security alerts
94. **`admin_escalations`** - Admin escalations
95. **`audit_logs`** - Audit logs
96. **`auditLogs`** - Alternative audit logs
97. **`behavioral_profiles`** - User behavior
98. **`transaction_monitoring_results`** - Transaction monitoring
99. **`data_integrity_checks`** - Data integrity
100. **`compliance_reports`** - Compliance reports
101. **`audit_exports`** - Audit exports
102. **`suspicious_activities`** - Suspicious activities
103. **`virtual_currency_reports`** - Currency reports
104. **`compliance_audit_logs`** - Compliance logs

#### Test Steps:
```
✅ Security Events (Auto-logged)
- File: src/services/securityMonitoring.ts
- Writes to: security_events
- Test: Login, logout, profile changes

✅ Security Alerts (Admin-only)
- File: src/services/securityMonitoring.ts
- Writes to: security_alerts
- Test: Suspicious activity triggers alert

✅ Admin Escalations (Admin-only)
- File: src/services/securityMonitoring.ts
- Writes to: admin_escalations
- Test: Critical security event

✅ Audit Logs (Admin-only)
- File: Backend auto-logs
- Writes to: audit_logs, auditLogs
- Test: Admin actions logged
```

---

### 12. 🛡️ DATA PROTECTION (4 Collections)

#### Collections:
105. **`privacy_consents`** - Privacy consents
106. **`data_processing_records`** - GDPR compliance
107. **`data_export_requests`** - Data export requests
108. **`data_deletion_requests`** - Data deletion requests

#### Test Steps:
```
✅ Privacy Consent
- File: src/app/(auth)/privacy-policy.tsx
- Writes to: privacy_consents
- Test: Accept privacy policy

✅ Data Export Request
- File: src/services/dataProtection.ts
- Writes to: data_export_requests
- Test: Request data export (GDPR)

✅ Data Deletion Request
- File: src/services/dataProtection.ts
- Writes to: data_deletion_requests
- Test: Request account deletion (GDPR)
```

---

### 13. ⚙️ ADMIN & SYSTEM (13 Collections)

#### Collections:
109. **`systemSettings`** - System settings
110. **`system`** - System data
111. **`apiKeys`** - API keys
112. **`rateLimitRules`** - Rate limit rules
113. **`apiRequests`** - API request logs
114. **`apiAnalytics`** - API analytics
115. **`analytics`** - General analytics
116. **`analyticsEvents`** - Analytics events
117. **`appRules`** - App rules
118. **`adminConfig`** - Admin configuration
119. **`adminPreferences`** - Admin preferences
120. **`adminNotifications`** - Admin notifications
121. **`reports`** - Reports

#### Test Steps:
```
✅ System Settings (Admin-only)
- File: Admin Portal
- Reads/Writes: systemSettings
- Test: Admin changes settings

✅ API Analytics (Admin-only)
- File: Backend auto-logs
- Writes to: apiRequests, apiAnalytics
- Test: API calls logged

✅ Admin Notifications (Admin-only)
- File: Admin Portal
- Reads: adminNotifications
- Test: Admin receives notifications

✅ Reports (Admin-only)
- File: Admin Portal
- Reads/Writes: reports
- Test: Generate reports
```

---

### 14. 🧪 TESTING COLLECTIONS (3 Collections)

#### Collections:
122. **`test-triggers`** - Test triggers
123. **`test-trigger-responses`** - Test responses
124. **`test-documents`** - Test documents

#### Test Steps:
```
✅ These are DENIED by rules (dev only)
- All test collections have: allow read, write: if false;
- Test: Verify access is denied
```

---

## 🎯 PRIORITY TESTING ORDER

### Phase 1: Critical Features (Must Work)
1. ✅ User Authentication (users, wallets)
2. ✅ Coin Purchase (coin_purchases, wallet_transactions)
3. ✅ Job Creation (jobs, notifications)
4. ✅ Job Offers (jobs/{jobId}/offers)
5. ✅ Escrow System (escrows, wallet_transactions)
6. ✅ Chat Messages (chats, messages)
7. ✅ File Uploads (file_uploads, Storage)

### Phase 2: Important Features
8. ✅ Guild Creation (guilds, guildMembers)
9. ✅ Admin Chat (admin_chats)
10. ✅ Notifications (notifications)
11. ✅ Job Completion (escrows, reviews)
12. ✅ Disputes (disputes)

### Phase 3: Secondary Features
13. ✅ Announcements (announcements)
14. ✅ Feedback (feedback)
15. ✅ Knowledge Base (knowledgeBase, faqs)
16. ✅ Leaderboards (leaderboards)
17. ✅ Achievements (achievements)

### Phase 4: Admin Features
18. ✅ Security Monitoring (security_events, security_alerts)
19. ✅ Audit Logs (audit_logs)
20. ✅ System Settings (systemSettings)
21. ✅ Reports (reports)

---

## 🚨 COMMON ERRORS TO WATCH FOR

### Permission Errors
```
❌ Missing or insufficient permissions
✅ Fixed: All 120 collections have proper rules

❌ storage/unauthorized
✅ Fixed: Storage rules deployed

❌ User does not have permission to access
✅ Fixed: Ownership checks in place
```

### Backend Errors
```
❌ Backend using guild-dev-7f06e
✅ Fix: Update serviceAccountKey.json

❌ Firebase Admin SDK not initialized
✅ Fix: Restart backend after updating service account
```

---

## ✅ SUCCESS CRITERIA

After testing, you should have:
- [ ] No permission errors in any screen
- [ ] All file uploads working (images, documents)
- [ ] All coin operations working (purchase, withdraw, escrow)
- [ ] All job operations working (create, offer, accept, complete)
- [ ] All chat features working (text, images, files, location)
- [ ] All guild operations working (create, join, announce)
- [ ] All admin features accessible (for admin users)
- [ ] Backend logs show `guild-4f46b` project ID

---

## 📊 TESTING CHECKLIST

Print this and check off as you test:

```
AUTHENTICATION & PROFILE
[ ] Sign up new user
[ ] Sign in existing user
[ ] Update profile
[ ] Upload profile image
[ ] Block user
[ ] QR code scan

WALLET & COINS
[ ] View wallet
[ ] Purchase coins
[ ] View coin inventory
[ ] Request withdrawal
[ ] View transaction history

JOBS
[ ] Browse jobs
[ ] Search jobs
[ ] View job details
[ ] Create job
[ ] Submit offer
[ ] Accept offer (escrow)
[ ] Complete job (release)
[ ] Raise dispute
[ ] Job discussion
[ ] Review job

GUILDS
[ ] Browse guilds
[ ] Create guild (2500 coins)
[ ] Join guild
[ ] View members
[ ] Guild invitations
[ ] Guild announcements
[ ] Guild map

CHAT
[ ] View chat list
[ ] Start new chat
[ ] Send text message
[ ] Upload image
[ ] Upload file
[ ] Share location
[ ] Admin chat

NOTIFICATIONS
[ ] View notifications
[ ] Mark as read
[ ] Notification preferences

SUPPORT
[ ] View announcements
[ ] Submit feedback
[ ] Knowledge base
[ ] FAQs

ADMIN (if admin user)
[ ] View audit logs
[ ] View analytics
[ ] System settings
[ ] Resolve disputes
```

---

**🎉 This is the COMPLETE testing guide for all 120 Firebase collections!**

Test systematically, and report any permission errors immediately.

