# Complete Screen List - GUILD App

## 📱 SCREEN CATEGORIES

---

## 1️⃣ AUTH SCREENS (24 screens)

### Onboarding Flow
- `(auth)/splash.tsx` - Splash/Launch screen
- `(auth)/welcome.tsx` - Welcome screen
- `(auth)/welcome-tutorial.tsx` - Welcome tutorial
- `(auth)/onboarding/1.tsx` - Onboarding step 1
- `(auth)/onboarding/2.tsx` - Onboarding step 2
- `(auth)/onboarding/3.tsx` - Onboarding step 3

### Authentication
- `(auth)/sign-in.tsx` - Sign in screen
- `(auth)/sign-up.tsx` - Sign up screen
- `(auth)/signup-complete.tsx` - Sign up completion
- `(auth)/email-verification.tsx` - Email verification
- `(auth)/phone-verification.tsx` - Phone verification
- `(auth)/two-factor-auth.tsx` - 2FA authentication
- `(auth)/two-factor-setup.tsx` - 2FA setup
- `(auth)/biometric-setup.tsx` - Biometric setup

### Account Recovery
- `(auth)/account-recovery.tsx` - Account recovery
- `(auth)/account-recovery-complete.tsx` - Recovery completion

### Profile Setup
- `(auth)/profile-completion.tsx` - Profile completion

### Legal
- `(auth)/terms-conditions.tsx` - Terms & conditions
- `(auth)/privacy-policy.tsx` - Privacy policy

### Security
- `(auth)/backup-code-generator.tsx` - Backup code generator

---

## 2️⃣ MAIN APP SCREENS (8 screens)

### Core Screens
- `(main)/home.tsx` - Home screen
- `(main)/jobs.tsx` - Jobs screen
- `(main)/profile.tsx` - Profile screen
- `(main)/chat.tsx` - Chat screen
- `(main)/search.tsx` - Search screen
- `(main)/map.tsx` - Map screen
- `(main)/post.tsx` - Post screen

---

## 3️⃣ MODAL SCREENS (95 screens)

### Job Related (19 screens)
- `(modals)/add-job.tsx` - Add job screen
- `(modals)/job-posting.tsx` - Job posting
- `(modals)/job-posting-help.tsx` - Job posting help
- `(modals)/job-search.tsx` - Job search
- `(modals)/job-details.tsx` - Job details
- `(modals)/job-discussion.tsx` - Job discussion
- `(modals)/job-templates.tsx` - Job templates
- `(modals)/my-jobs.tsx` - My jobs
- `(modals)/job/[id].tsx` - Job detail modal
- `(modals)/job-accept/[jobId].tsx` - Accept job
- `(modals)/apply/[jobId].tsx` - Apply for job
- `(modals)/leads-feed.tsx` - Leads feed

### Wallet & Payments (15 screens)
- `(modals)/wallet.tsx` - Wallet main
- `(modals)/wallet/[userId].tsx` - User wallet
- `(modals)/wallet-dashboard.tsx` - Wallet dashboard
- `(modals)/wallet-settings.tsx` - Wallet settings
- `(modals)/coin-wallet.tsx` - Coin wallet
- `(modals)/coin-store.tsx` - Coin store
- `(modals)/coin-transactions.tsx` - Coin transactions
- `(modals)/coin-withdrawal.tsx` - Coin withdrawal
- `(modals)/payment.tsx` - Payment screen
- `(modals)/payment-methods.tsx` - Payment methods
- `(modals)/bank-account-setup.tsx` - Bank account setup
- `(modals)/escrow-payment.tsx` - Escrow payment
- `(modals)/currency-conversion-history.tsx` - Currency conversion
- `(modals)/currency-manager.tsx` - Currency manager
- `(modals)/transaction-history.tsx` - Transaction history

### Guild Related (17 screens)
- `(modals)/guild.tsx` - Guild main
- `(modals)/guilds.tsx` - Guilds list
- `(modals)/create-guild.tsx` - Create guild
- `(modals)/guild-map.tsx` - Guild map
- `(modals)/guild-master.tsx` - Guild master
- `(modals)/guild-vice-master.tsx` - Guild vice master
- `(modals)/guild-member.tsx` - Guild member
- `(modals)/guild-chat/[guildId].tsx` - Guild chat
- `(modals)/guild-analytics.tsx` - Guild analytics
- `(modals)/guild-court.tsx` - Guild court
- `(modals)/guild-creation-wizard.tsx` - Guild creation wizard
- `(modals)/member-management.tsx` - Member management
- `(modals)/permission-matrix.tsx` - Permission matrix
- `(modals)/leaderboards.tsx` - Leaderboards
- `(modals)/performance-benchmarks.tsx` - Performance benchmarks
- `(modals)/performance-dashboard.tsx` - Performance dashboard
- `(modals)/offer-submission.tsx` - Offer submission

### Profile & User (13 screens)
- `(modals)/profile-edit.tsx` - Edit profile
- `(modals)/profile-settings.tsx` - Profile settings
- `(modals)/profile-stats.tsx` - Profile stats
- `(modals)/profile-qr.tsx` - Profile QR code
- `(modals)/user-profile.tsx` - User profile
- `(modals)/user-profile/[userId].tsx` - User profile dynamic
- `(modals)/user-settings.tsx` - User settings
- `(modals)/qr-scanner.tsx` - QR scanner
- `(modals)/scan-history.tsx` - Scan history
- `(modals)/scanned-user-profile.tsx` - Scanned user profile
- `(modals)/my-qr-code.tsx` - My QR code
- `(modals)/contacts.tsx` - Contacts
- `(modals)/identity-verification.tsx` - Identity verification

### Chat & Communication (4 screens)
- `(modals)/chat/[jobId].tsx` - Job chat
- `(modals)/chat-options.tsx` - Chat options
- `(modals)/contacts.tsx` - Contacts

### Notifications (4 screens)
- `(modals)/notifications.tsx` - Notifications
- `(modals)/notifications-center.tsx` - Notifications center
- `(modals)/notification-preferences.tsx` - Notification preferences
- `(modals)/notification-test.tsx` - Notification test

### Settings & Preferences (7 screens)
- `(modals)/settings.tsx` - Settings main
- `(modals)/security-center.tsx` - Security center
- `(modals)/demo-mode-controller.tsx` - Demo mode controller

### Help & Support (3 screens)
- `(modals)/help.tsx` - Help screen
- `(modals)/knowledge-base.tsx` - Knowledge base
- `(modals)/announcement-center.tsx` - Announcement center

### Contracts & Documents (6 screens)
- `(modals)/contract-generator.tsx` - Contract generator
- `(modals)/contract-test.tsx` - Contract test
- `(modals)/contract-view.tsx` - Contract view
- `(modals)/document-quality-check.tsx` - Document quality check
- `(modals)/invoice-generator.tsx` - Invoice generator
- `(modals)/invoice-line-items.tsx` - Invoice line items

### Disputes & Legal (3 screens)
- `(modals)/dispute-filing-form.tsx` - Dispute filing
- `(modals)/evidence-upload.tsx` - Evidence upload
- `(modals)/refund-processing-status.tsx` - Refund status

### Other Features (6 screens)
- `(modals)/feedback-system.tsx` - Feedback system
- `(modals)/certificate-expiry-tracker.tsx` - Certificate tracker

---

## 4️⃣ COMPONENT SCREENS (sub-screens within larger screens)

### Job Posting Wizard (3 steps)
- `screens/job-posting/JobPostingWizard.tsx` - Main wizard
- `screens/job-posting/Step1Category.tsx` - Step 1: Category
- `screens/job-posting/Step2Details.tsx` - Step 2: Details
- `screens/job-posting/Step3Schedule.tsx` - Step 3: Schedule

### Leads Feed (4 components)
- `screens/leads-feed/LeadsFeedScreen.tsx` - Main feed
- `screens/leads-feed/JobCard.tsx` - Job card
- `screens/leads-feed/JobCardMemo.tsx` - Job card memo
- `screens/leads-feed/FilterModal.tsx` - Filter modal

### Escrow Payment
- `screens/escrow-payment/EscrowPaymentScreen.tsx` - Escrow payment screen

### Offer Submission
- `screens/offer-submission/OfferSubmissionScreen.tsx` - Offer submission screen

### Settings
- `screens/settings/SettingsScreen.tsx` - Settings screen

---

## 5️⃣ REUSABLE COMPONENTS (40+ components)

### Atoms (Small components)
- `components/atoms/AlertFadeModal.tsx`
- `components/atoms/Avatar.tsx`
- `components/atoms/HeaderText.tsx`
- `components/atoms/ProfileText.tsx`
- `components/atoms/SectionTitle.tsx`
- `components/atoms/SettingsSwitch.tsx`

### Molecules (Medium components)
- `components/molecules/FeatureCard.tsx`
- `components/molecules/FeatureModal.tsx`
- `components/molecules/ProfileAction.tsx`
- `components/molecules/ReminderTimeModal.tsx`
- `components/molecules/SettingItem.tsx`

### Organisms (Large components)
- `components/organisms/BottomMenuSection.tsx`
- `components/organisms/FeaturesSection.tsx`
- `components/organisms/HomeHeader.tsx`
- `components/organisms/LanguageSettingsSection.tsx`
- `components/organisms/NotificationsSection.tsx`
- `components/organisms/ProfileHeader.tsx`
- `components/organisms/ThemeSettingsSection.tsx`

### Navigation Components
- `components/BottomNavigation.tsx` - Bottom nav bar
- `components/AppBottomNavigation.tsx` - App bottom nav
- `components/Logo.tsx` - Logo component
- `components/ModalHeader.tsx` - Modal header

### Functional Components
- `components/JobCard.tsx` - Job card
- `components/FilterBar.tsx` - Filter bar
- `components/CustomAlert.tsx` - Custom alert
- `components/BiometricLoginModal.tsx` - Biometric modal

### RTL Support Components
- `components/RTLWrapper.tsx` - RTL wrapper HOC
- `components/ScreenLayout.tsx` - Screen layout wrapper
- `components/primitives/RTLText.tsx` - RTL text
- `components/primitives/RTLView.tsx` - RTL view
- `components/primitives/RTLButton.tsx` - RTL button
- `components/primitives/RTLInput.tsx` - RTL input
- `components/primitives/AlertFadeModal.tsx` - Alert modal

### Debug Components
- `components/primitives/debug/DebugBottomNavigation.tsx`
- `components/primitives/debug/DebugStorageSection.tsx`
- `components/primitives/ContextViewer/ContextViewer.tsx`

---

## 📊 SCREEN COUNT SUMMARY

| Category | Count |
|----------|-------|
| **Auth Screens** | 24 |
| **Main App Screens** | 8 |
| **Modal Screens** | 95 |
| **Component Screens** | 11 |
| **Reusable Components** | 40+ |
| **Test Files** | 3 |
| **Layout Files** | 4 |
| **TOTAL** | **~185 files** |

---

## 🎯 NOTES

### Test Files (Not actual screens)
- `(auth)/__tests__/sign-in.test.tsx`
- `(main)/__tests__/home.test.tsx`
- `(modals)/__tests__/wallet.test.tsx`

### Layout Files (Navigation wrappers)
- `(auth)/_layout.tsx` - Auth layout
- `(main)/_layout.tsx` - Main layout
- `(modals)/_layout.tsx` - Modals layout
- `_layout.tsx` - Root layout
- `_layout_optimized.tsx` - Optimized layout

### Entry Point
- `index.tsx` - App entry point

---

## 🔍 DUPLICATE/UNUSED FILES TO CLEAN UP

Based on investigation, these might be duplicates or unused:
- `add-job-modern.tsx` (if exists) - Duplicate of add-job.tsx
- `guild-map-complex-backup.tsx` (if exists) - Backup file
- Test files - Should be in separate test directory
- Debug components - Should be in separate debug directory

---

**Last Updated:** Today
**Total Screens:** ~185 files (including components)
**Actual User-Facing Screens:** ~127 screens

