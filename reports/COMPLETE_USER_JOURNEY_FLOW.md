# 🗺️ COMPLETE USER JOURNEY FLOW - GUILD APP

**Generated**: November 1, 2025  
**Purpose**: Document the complete user process from first launch to end of journey

---

## 📱 **COMPLETE USER FLOW MAP**

### **PHASE 1: APP LAUNCH & AUTHENTICATION**

#### **1. App Launch → Index (`index.tsx`)**
- **Purpose**: Initial routing decision
- **Flow**:
  - Checks if user is authenticated
  - **If authenticated** → Redirects to `/(main)/home`
  - **If NOT authenticated** → Redirects to `/(auth)/splash`

---

#### **2. Splash Screen (`(auth)/splash.tsx`)** ⏱️ 7 seconds
- **Duration**: 7 seconds display time
- **Purpose**: Branding and authentication check
- **Displays**:
  - GUILD logo with Shield icon
  - "Powered by BLACK ENERGY TECH"
  - Version information
- **Navigation**:
  - **If user authenticated** → `/(main)/home`
  - **If new user** → `/(auth)/onboarding/1`
  - **If returning user (not authenticated)** → `/(auth)/onboarding/1`

---

### **PHASE 2: ONBOARDING (New Users Only)**

#### **3. Onboarding Step 1 (`(auth)/onboarding/1.tsx`)**
- **Purpose**: First introduction to app features
- **Content**: Feature highlights and welcome
- **Navigation**:
  - **Next** → `/(auth)/onboarding/2`
  - **Skip** → `/(auth)/welcome`

#### **4. Onboarding Step 2 (`(auth)/onboarding/2.tsx`)**
- **Purpose**: Second feature introduction
- **Navigation**:
  - **Next** → `/(auth)/onboarding/3`
  - **Back** → `/(auth)/onboarding/1`
  - **Skip** → `/(auth)/welcome`

#### **5. Onboarding Step 3 (`(auth)/onboarding/3.tsx`)**
- **Purpose**: Final feature introduction
- **Navigation**:
  - **Get Started** → `/(auth)/welcome`
  - **Back** → `/(auth)/onboarding/2`
  - **Skip** → `/(auth)/welcome`

---

### **PHASE 3: AUTHENTICATION CHOICE**

#### **6. Welcome Screen (`(auth)/welcome.tsx`)**
- **Purpose**: Choose authentication method
- **Options**:
  - ✅ **Sign Up** (Create Account) → `/(auth)/signup-complete`
  - ✅ **Sign In** → `/(auth)/sign-in`
  - ⚠️ **Guest/Anonymous Login** (if available) → `/(main)/home`
- **Features**:
  - Animated logo and tagline
  - "Connect • Collaborate • Conquer"
  - Terms & Privacy Policy notice

---

### **PHASE 4A: SIGN UP FLOW (New User Registration)**

#### **7. Sign Up Complete (`(auth)/signup-complete.tsx`)** 
**Multi-step registration process:**

**Step 1: Personal Information**
- Full name (First & Last)
- Phone number (with country code)
- Date of birth (age verification)
- Gender selection
- Country selection
- **Next** → Step 2

**Step 2: Account Creation**
- Email address
- Password (with strength indicator)
- Confirm password
- Terms & Conditions acceptance
- Privacy Policy acceptance
- **Next** → Step 3

**Step 3: Verification**
- Email verification (6-digit code sent)
- Phone verification (SMS code)
- **Verify** → Step 4

**Step 4: Profile Picture**
- Upload profile photo (optional but recommended)
- Take photo or choose from library
- **Next** → Step 5

**Step 5: Complete**
- Success screen
- **Start Exploring** → `/(auth)/profile-completion`

**Navigation after signup**:
- Success → `/(auth)/profile-completion`
- Error → Stays on signup screen with error message

---

#### **8. Profile Completion (`(auth)/profile-completion.tsx`)**
**Multi-step profile setup:**

**Step 1: Basic Information**
- First name
- Last name  
- Phone number
- Date of birth
- Bio (optional)
- **Next** → Step 2

**Step 2: Profile Photo**
- Upload/take profile photo
- Face detection verification
- **Next** → Step 3

**Step 3: ID Verification**
- Qatar ID front side (photo)
- Qatar ID back side (photo)
- ID number entry
- **Next** → Step 4

**Step 4: Location**
- Current location (GPS)
- Manual location entry
- Map selector (optional)
- **Next** → Step 5

**Step 5: Skills Selection**
- Select relevant skills (multiple)
- Categories: Development, Design, Marketing, etc.
- **Next** → Step 6

**Step 6: Complete**
- Success screen
- **Start Exploring** → `/(auth)/welcome-tutorial`

**Navigation after profile completion**:
- Complete → `/(auth)/welcome-tutorial`

---

#### **9. Welcome Tutorial (`(auth)/welcome-tutorial.tsx`)**
**5-step interactive tutorial:**

**Step 1: Welcome to GUILD**
- Feature 1: Connect with skilled professionals
- Feature 2: Post jobs or apply for opportunities
- Feature 3: Build your professional reputation with RANKING system

**Step 2: Find & Post Jobs**
- Feature 1: Browse jobs filtered by category, budget, and location
- Feature 2: Post detailed job requirements with milestone tracking
- Feature 3: Secure payment system with escrow protection

**Step 3: Join Guilds**
- Feature 1: Join existing Guilds or create your own professional community
- Feature 2: Access Guild-exclusive jobs and collaborative projects
- Feature 3: Share knowledge and learn from experienced Guild members

**Step 4: Build Your Rank**
- Feature 1: Start at rank G and work your way up to SSS
- Feature 2: Higher ranks unlock premium jobs and better rates
- Feature 3: Showcase your expertise with verified skill assessments

**Step 5: You're Ready!**
- Complete your profile to attract better opportunities
- Enable notifications to never miss important updates
- Explore the app and discover all available features

**Navigation after tutorial**:
- **Get Started** → `/(main)/home`

---

### **PHASE 4B: SIGN IN FLOW (Returning Users)**

#### **10. Sign In Screen (`(auth)/sign-in.tsx`)**
- **Purpose**: User login
- **Input Methods**:
  - Email address
  - Phone number
  - GUILD ID (GID)
  - Unified input field (auto-detects type)
- **Features**:
  - Password field (with show/hide toggle)
  - "Remember Me" checkbox
  - Biometric authentication button (if available)
  - "Forgot Password?" link
  - "Create Account" link
- **Navigation**:
  - **Sign In Success** → `/(main)/home`
  - **Sign Up** → `/(auth)/signup-complete`
  - **Forgot Password** → `/(auth)/account-recovery`
  - **Biometric Auth** → Biometric prompt → `/(main)/home` (if successful)

---

### **PHASE 5: MAIN APPLICATION**

#### **11. Home Screen (`(main)/home.tsx`)** 🏠
**Main hub of the application:**

**Header Section**:
- Profile picture (tappable → Profile)
- Notifications icon (badge with unread count)
- Settings icon
- Balance display (if enabled)

**Quick Actions**:
- ✅ **Add Job** → `/(modals)/add-job`
- ✅ **GUILD Map** → `/(modals)/guild-map`
- ✅ **Search** → `/(main)/search`
- ✅ **Notifications** → `/(modals)/notifications`

**Content Sections**:
- Recent jobs feed (scrollable list)
- Featured jobs
- Guild status card
- Performance metrics
- Quick stats

**Bottom Navigation** (Always visible):
- 🏠 **Home** → Current screen
- 💼 **Jobs** → `/(main)/jobs`
- 💬 **Chat** → `/(main)/chat`
- 👤 **Profile** → `/(main)/profile`

---

#### **12. Jobs Screen (`(main)/jobs.tsx`)**
- **Purpose**: Browse all available jobs
- **Features**:
  - Filter by category, budget, location
  - Search functionality
  - Job cards with details
  - Tap job → `/(modals)/job/[id]`

---

#### **13. Chat Screen (`(main)/chat.tsx`)**
- **Purpose**: View all chat conversations
- **Features**:
  - List of active chats
  - Unread message badges
  - Search chats
  - New message button
- **Navigation**:
  - Tap chat → `/(modals)/chat/[jobId]`

---

#### **14. Profile Screen (`(main)/profile.tsx`)**
- **Purpose**: User profile management
- **Sections**:
  - Profile picture and basic info
  - Statistics (jobs posted, applications, completed)
  - Earnings overview
  - Quick actions:
    - ✅ Edit Profile → `/(modals)/profile-edit`
    - ✅ My QR Code → `/(modals)/my-qr-code`
    - ✅ Wallet → `/(modals)/wallet`
    - ✅ My Jobs → `/(modals)/my-jobs`
    - ✅ Guilds → `/(modals)/guilds`
    - ✅ Settings → `/(modals)/settings`
- **Navigation**:
  - Logout → `/(auth)/splash`

---

### **PHASE 6: MODAL SCREENS & FEATURES**

#### **Job Management Flow**:
1. **Add Job** (`(modals)/add-job.tsx`)
   - Multi-step job posting (4 steps)
   - Step 1: Basic info (title, category, description)
   - Step 2: Budget & timeline
   - Step 3: Location requirements
   - Step 4: Visibility & promotion
   - **Success** → Returns to home

2. **Job Details** (`(modals)/job/[id].tsx`)
   - Full job information
   - Apply button
   - Discussion tab
   - Related jobs

3. **My Jobs** (`(modals)/my-jobs.tsx`)
   - Posted jobs list
   - Applications received
   - Status tracking

#### **Chat Flow**:
1. **Chat Screen** (`(modals)/chat/[jobId].tsx`)
   - Real-time messaging
   - File attachments
   - Voice messages
   - Media sharing
   - Typing indicators

#### **Wallet & Payment Flow**:
1. **Wallet** (`(modals)/wallet.tsx`)
   - Balance display
   - Transaction history
   - Withdraw button → `/(modals)/coin-withdrawal`

2. **Coin Store** (`(modals)/coin-store.tsx`)
   - Purchase COINS (Bronze, Silver, Gold, Platinum, Diamond, Ruby)
   - Payment via Fatora PSP

3. **Payment Methods** (`(modals)/payment-methods.tsx`)
   - Add/edit payment cards
   - Set default payment method

4. **Transaction History** (`(modals)/transaction-history.tsx`)
   - All transactions list
   - Filter by type, date

#### **Guild Flow**:
1. **Guilds** (`(modals)/guilds.tsx`)
   - Browse available Guilds
   - Search Guilds

2. **Create Guild** (`(modals)/create-guild.tsx`)
   - Multi-step Guild creation

3. **Guild Details** (`(modals)/guild.tsx`)
   - Guild information
   - Member list
   - Join/Leave button

#### **Settings Flow**:
1. **Settings** (`(modals)/settings.tsx`)
   - Account settings
   - Notification preferences
   - Privacy & security
   - Appearance (theme, language)
   - Help & support
   - About

---

### **PHASE 7: ADDITIONAL FEATURES**

#### **Verification & Security**:
- **Email Verification** (`(auth)/email-verification.tsx`)
- **Phone Verification** (`(auth)/phone-verification.tsx`)
- **Two-Factor Auth Setup** (`(auth)/two-factor-setup.tsx`)
- **Two-Factor Auth Login** (`(auth)/two-factor-auth.tsx`)
- **Biometric Setup** (`(auth)/biometric-setup.tsx`)
- **Account Recovery** (`(auth)/account-recovery.tsx`)

#### **Legal & Compliance**:
- **Terms & Conditions** (`(auth)/terms-conditions.tsx`)
- **Privacy Policy** (`(auth)/privacy-policy.tsx`)

---

## 📊 **COMPLETE FLOW DIAGRAM**

```
APP LAUNCH
    ↓
index.tsx (Auth Check)
    ↓
    ├─→ [Authenticated] → (main)/home
    └─→ [Not Authenticated] → (auth)/splash
                              ↓
                         (auth)/onboarding/1
                              ↓
                         (auth)/onboarding/2
                              ↓
                         (auth)/onboarding/3
                              ↓
                         (auth)/welcome
                              ├─→ [Sign Up] → (auth)/signup-complete
                              │                ↓
                              │           (auth)/profile-completion
                              │                ↓
                              │           (auth)/welcome-tutorial
                              │                ↓
                              │           (main)/home ✅
                              │
                              └─→ [Sign In] → (auth)/sign-in
                                               ↓
                                          (main)/home ✅

MAIN APP (After Authentication)
    ↓
(main)/home (Hub)
    ├─→ (modals)/add-job → [Post Job Flow]
    ├─→ (modals)/guild-map → [Guild Map]
    ├─→ (main)/search → [Search Jobs]
    ├─→ (modals)/notifications → [Notifications]
    ├─→ (main)/jobs → [Browse Jobs]
    ├─→ (main)/chat → (modals)/chat/[jobId]
    └─→ (main)/profile
        ├─→ (modals)/profile-edit
        ├─→ (modals)/my-qr-code
        ├─→ (modals)/wallet
        ├─→ (modals)/coin-store
        ├─→ (modals)/payment-methods
        ├─→ (modals)/my-jobs
        ├─→ (modals)/guilds
        └─→ (modals)/settings
```

---

## 🔄 **KEY NAVIGATION RULES**

1. **Authentication Gate**: All `(main)/` screens require authentication
2. **Modal Screens**: `(modals)/` screens are accessible from main app
3. **Bottom Navigation**: Always visible on `(main)/` screens
4. **Back Navigation**: Expo Router handles back button automatically
5. **Deep Linking**: Supported for job details, chat, profile

---

## ⏱️ **TYPICAL USER JOURNEY TIMELINE**

### **New User (First Time)**:
1. Splash: 7 seconds
2. Onboarding: ~2-3 minutes (can skip)
3. Welcome: ~10 seconds (choice)
4. Sign Up: ~5-7 minutes (multi-step)
5. Profile Completion: ~5-10 minutes
6. Welcome Tutorial: ~3-5 minutes (can skip)
7. **Total**: ~15-25 minutes to reach home screen

### **Returning User**:
1. Splash: 7 seconds (or instant if auto-login)
2. Sign In: ~30 seconds
3. **Total**: ~10-30 seconds to reach home screen

---

## ✅ **END OF JOURNEY - MAIN APP FEATURES**

Once user reaches `(main)/home`, they have access to:

### **Core Features**:
- ✅ Browse and apply for jobs
- ✅ Post jobs and manage applications
- ✅ Real-time chat with employers/freelancers
- ✅ Manage wallet and COINS
- ✅ Join/create Guilds
- ✅ Track rankings and performance
- ✅ View transaction history
- ✅ Manage payment methods
- ✅ Settings and preferences

### **Advanced Features** (Available via modals):
- ✅ Guild management
- ✅ Dispute resolution
- ✅ Contract generation
- ✅ Invoice creation
- ✅ Document verification (KYC)
- ✅ Certificate tracking
- ✅ Performance analytics
- ✅ Help & knowledge base

---

## 📝 **NOTES**

1. **Authentication State**: Managed by `AuthContext`
2. **Navigation**: Expo Router file-based routing
3. **Modal Screens**: Overlay style, accessible from main screens
4. **Bottom Navigation**: Fixed at bottom, 4 main tabs
5. **RTL Support**: All screens support Arabic RTL layout
6. **Theme Support**: Light/Dark mode on all screens

---

---

## 👔 **USER/POSTER JOURNEY** (Job Creator Perspective)

**Role**: User who posts jobs and hires freelancers  
**Goal**: Create jobs, review applications, manage projects, pay freelancers

---

### **PHASE 1: INITIAL SETUP** (Same as General Flow)
- **Screen 1**: `(auth)/splash.tsx` - Splash (7 seconds)
- **Screen 2**: `(auth)/onboarding/1.tsx` → `2.tsx` → `3.tsx` - Onboarding (optional)
- **Screen 3**: `(auth)/welcome.tsx` - Welcome screen
- **Screen 4**: `(auth)/signup-complete.tsx` - Sign up (5 steps)
- **Screen 5**: `(auth)/profile-completion.tsx` - Profile completion (6 steps)
- **Screen 6**: `(auth)/welcome-tutorial.tsx` - Tutorial (optional)
- **Screen 7**: `(main)/home.tsx` - **Main Home Screen** ✅

---

### **PHASE 2: JOB POSTING**

#### **Screen 8: Home Screen** (`(main)/home.tsx`)
**Actions Available**:
- ✅ View profile picture
- ✅ Tap notifications icon → `(modals)/notifications`
- ✅ Tap settings icon → `(modals)/settings`
- ✅ Tap "Add Job" button → `(modals)/add-job`
- ✅ Tap "GUILD Map" button → `(modals)/guild-map`
- ✅ Tap "Search" button → `(main)/search`
- ✅ Browse recent jobs feed
- ✅ Tap job card → `(modals)/job/[id]`

**Navigation**:
- `/(modals)/add-job` - Start posting job
- `/(modals)/my-jobs` - View posted jobs
- `/(main)/jobs` - Browse all jobs

---

#### **Screen 9: Add Job Screen** (`(modals)/add-job.tsx`)
**4-Step Job Creation Process**:

**Step 1: Basic Information**
- **Actions**:
  - Enter job title (English/Arabic)
  - Enter job description (English/Arabic)
  - Select category (Web Dev, Design, Marketing, etc.)
  - Select experience level (Beginner, Intermediate, Expert)
  - Add skills (multiple selection)
  - Toggle language selector (EN/AR/Both)
- **Navigation**:
  - **Next** → Step 2
  - **Back** → `(main)/home`

**Step 2: Budget & Timeline**
- **Actions**:
  - Set budget amount (QR)
  - Select budget type (Fixed Price / Hourly Rate / Negotiable)
  - Set duration/timeline
  - Toggle "Urgent" badge
- **Navigation**:
  - **Next** → Step 3
  - **Back** → Step 1

**Step 3: Location Requirements**
- **Actions**:
  - Enter location address (English/Arabic)
  - Toggle "Remote Work" option
  - Tap "Get Current Location" → GPS location
  - Tap "Select on Map" → `(modals)/guild-map` (coming soon)
  - Toggle "Show on Map"
- **Navigation**:
  - **Next** → Step 4
  - **Back** → Step 2

**Step 4: Visibility & Summary**
- **Actions**:
  - Select visibility (Public / Guild Only / Premium)
  - Toggle "Featured" promotion (costs coins)
  - Toggle "Boost" promotion (costs coins)
  - View wallet balance
  - Review job summary
  - Tap "Coin Store" → `(modals)/coin-store` (if insufficient balance)
- **Navigation**:
  - **Submit** → Job created → `(main)/home` (with success message)
  - **Back** → Step 3

**After Submission**:
- Job created with `adminStatus: 'pending_review'`
- Admin notified automatically
- User sees success message

---

#### **Screen 10: My Jobs Screen** (`(modals)/my-jobs.tsx`)
**Tabs Available**:
1. **Pending Review** (قيد المراجعة)
   - Shows jobs with `adminStatus: 'pending_review'`
   - Badge: "Awaiting Approval"
   - **Actions**: View job details, Wait for approval

2. **Open** (مفتوح)
   - Shows approved jobs with `status: 'open'`
   - Badge: "Active"
   - **Actions**:
     - Tap job → `(modals)/job/[id]` (view applications)
     - See application count

3. **In Progress** (قيد التنفيذ)
   - Shows jobs with `status: 'in-progress'`
   - Badge: "In Progress"
   - **Actions**:
     - Tap job → View progress
     - Chat with freelancer → `(modals)/chat/[jobId]`

4. **Completed** (مكتمل)
   - Shows jobs with `status: 'completed'`
   - Badge: "Completed"
   - **Actions**: View job history, Rate freelancer

**Job Card Actions** (from any tab):
- Tap job card → `(modals)/job/[id]` - View job details and applications

---

#### **Screen 11: Job Details Screen** (`(modals)/job/[id].tsx`)
**When Poster Views Own Job**:
- **Actions Available**:
  - View full job details
  - View applications list (if `status: 'open'`)
  - Tap "Discuss Job" → `(modals)/chat/[jobId]`
  - **Apply button NOT visible** (poster can't apply to own job)

**When Job Has Applications**:
- View applications count
- Tap application → View freelancer profile
- **Accept Application** → Creates escrow → `(modals)/escrow-payment`
- **Reject Application** → Application status changed

**Navigation**:
- `/(modals)/chat/[jobId]` - Discuss with applicants
- `/(modals)/escrow-payment` - After accepting application

---

#### **Screen 12: Escrow Payment Screen** (`(modals)/escrow-payment.tsx`)
**Purpose**: Lock payment securely after accepting freelancer

**Actions**:
- View job details
- View accepted freelancer profile
- Enter payment amount (COINS)
- Select payment method → `(modals)/payment-methods`
- Tap "Lock Payment" → Payment locked in escrow
- View escrow status (Locked / Pending Release / Released)

**After Payment Locked**:
- Job status → `in-progress`
- Freelancer notified
- Payment held until work completed

**Navigation**:
- `/(modals)/wallet` - View transaction
- `/(modals)/payment-methods` - Manage payment methods

---

#### **Screen 13: Chat Screen** (`(modals)/chat/[jobId].tsx`)
**Actions Available**:
- Real-time messaging with freelancer
- Send text messages
- Send file attachments
- Send voice messages
- Send photos/videos
- View typing indicators
- View message delivery status
- Upload documents (contracts, requirements)

**Navigation**:
- Back to job details or home

---

#### **Screen 14: Job Completion Screen** (`(modals)/job-completion.tsx`)
**Purpose**: Review completed work and release payment

**Actions**:
- View freelancer's submitted deliverables
- Review work quality
- **Approve & Release Payment**:
  - Tap "Approve Work" → Payment released from escrow
  - 90% to freelancer, 10% platform fee
  - Job status → `completed`
- **Request Revisions**:
  - Send feedback via chat
  - Wait for freelancer to resubmit
- **Raise Dispute**:
  - Tap "Dispute" → `(modals)/dispute-filing-form`
  - Admin will review

**After Approval**:
- Payment automatically released
- Job marked as completed
- Freelancer notified
- Poster can rate freelancer

**Navigation**:
- `/(modals)/wallet` - View transaction history
- `/(modals)/job-dispute` - If dispute needed

---

#### **Screen 15: Wallet Screen** (`(modals)/wallet.tsx`)
**Actions Available**:
- View total balance (all coin types)
- View transaction history
- Filter by period (1D, 5D, 1W, 1M, 3M, 6M)
- View transaction details
- See escrow payments
- See completed job payments
- Tap "Withdraw" → `(modals)/coin-withdrawal` (if applicable)

**Transaction Types** (Poster View):
- **Debit**: Payment locked in escrow
- **Debit**: Payment released to freelancer
- **Credit**: Refund (if job cancelled)

**Navigation**:
- `/(modals)/coin-store` - Buy more coins
- `/(modals)/transaction-history` - Detailed history

---

### **POSTER JOURNEY SUMMARY**

```
START
  ↓
Home Screen → "Add Job" Button
  ↓
Add Job (4 steps) → Submit
  ↓
My Jobs → "Pending" Tab (awaiting admin approval)
  ↓
[Admin Approves] → "Open" Tab
  ↓
Job Details → View Applications
  ↓
[Accept Application] → Escrow Payment (Lock Payment)
  ↓
Chat Screen (Communication with Freelancer)
  ↓
[Freelancer Completes Work] → Job Completion Screen
  ↓
Approve Work → Payment Released (90% freelancer, 10% platform)
  ↓
Wallet → View Transaction
  ↓
END (Job Completed)
```

**Key Screens**:
1. `(main)/home.tsx` - Home hub
2. `(modals)/add-job.tsx` - Create job (4 steps)
3. `(modals)/my-jobs.tsx` - Manage posted jobs
4. `(modals)/job/[id].tsx` - View job & applications
5. `(modals)/escrow-payment.tsx` - Lock payment
6. `(modals)/chat/[jobId].tsx` - Communication
7. `(modals)/job-completion.tsx` - Review & approve
8. `(modals)/wallet.tsx` - View payments

---

## 👨‍💻 **USER/FREELANCER JOURNEY** (Job Seeker Perspective)

**Role**: User who applies for jobs and completes work  
**Goal**: Find jobs, apply, complete work, earn money

---

### **PHASE 1: INITIAL SETUP** (Same as General Flow)
- **Screen 1**: `(auth)/splash.tsx` - Splash (7 seconds)
- **Screen 2**: `(auth)/onboarding/1.tsx` → `2.tsx` → `3.tsx` - Onboarding (optional)
- **Screen 3**: `(auth)/welcome.tsx` - Welcome screen
- **Screen 4**: `(auth)/signup-complete.tsx` - Sign up (5 steps)
- **Screen 5**: `(auth)/profile-completion.tsx` - **Important**: Complete skills selection
- **Screen 6**: `(auth)/welcome-tutorial.tsx` - Tutorial (optional)
- **Screen 7**: `(main)/home.tsx` - **Main Home Screen** ✅

---

### **PHASE 2: JOB DISCOVERY**

#### **Screen 8: Home Screen** (`(main)/home.tsx`)
**Actions Available** (Freelancer View):
- ✅ Browse job feed (all approved jobs)
- ✅ Tap job card → `(modals)/job/[id]` - View job details
- ✅ Tap "Search" → `(main)/search` - Search jobs
- ✅ Tap "Filter" → Filter by category, budget, location
- ✅ View featured jobs
- ✅ View urgent jobs

**Navigation**:
- `/(modals)/job/[id]` - View job details
- `/(main)/jobs` - Browse all jobs
- `/(main)/search` - Search jobs

---

#### **Screen 9: Jobs Screen** (`(main)/jobs.tsx`)
**Actions Available**:
- Browse all available jobs
- Filter by:
  - Category
  - Budget range
  - Location
  - Experience level
- Sort by:
  - Relevance
  - Date posted
  - Budget
- Search jobs
- Tap job card → `(modals)/job/[id]` - View job details

**Navigation**:
- `/(modals)/job/[id]` - View job details

---

#### **Screen 10: Search Screen** (`(main)/search.tsx`)
**Actions Available**:
- Search jobs by keywords
- Advanced filters
- Location-based search
- Category filters
- Save search preferences

**Navigation**:
- `/(modals)/job/[id]` - View job details

---

#### **Screen 11: Job Details Screen** (`(modals)/job/[id].tsx`)
**Freelancer View**:
- **Actions Available**:
  - View full job description
  - View budget and timeline
  - View required skills
  - View location
  - View poster information
  - Tap "Submit Offer" → `(modals)/apply/[jobId]` - **Apply to job**
  - Tap "Discuss Job" → `(modals)/chat/[jobId]` - Chat with poster
  - Tap "Save" → Save job to favorites

**Important**: 
- "Submit Offer" button only visible if:
  - User is NOT the job poster
  - Job status is `open`
  - User hasn't already applied

**Navigation**:
- `/(modals)/apply/[jobId]` - Submit application
- `/(modals)/chat/[jobId]` - Chat with poster

---

### **PHASE 3: JOB APPLICATION**

#### **Screen 12: Apply Screen** (`(modals)/apply/[jobId].tsx`)
**Purpose**: Submit offer/proposal for job

**Actions Available**:
- **Cover Letter**:
  - Enter proposal message
  - Explain why you're the perfect fit
  - Highlight relevant experience
- **Proposed Price**:
  - Enter bid amount (QR)
  - Can be different from poster's budget
- **Timeline**:
  - Enter estimated completion time
  - Example: "2 weeks", "1 month"
- **Save Job**:
  - Tap heart icon → Save to favorites
- **Submit Offer**:
  - Tap "Submit Offer" button
  - Validates all fields
  - Calls backend API: `POST /v1/jobs/:id/offers`
  - Shows success message

**After Submission**:
- Offer sent to poster
- Application status: `pending`
- Freelancer receives notification when poster responds

**Navigation**:
- Success → Returns to job details
- Cancel → Returns to previous screen

---

#### **Screen 13: Chat Screen** (`(modals)/chat/[jobId].tsx`)
**Purpose**: Communicate with poster about job

**Actions Available**:
- Send messages
- Send files (portfolio, samples)
- Send voice messages
- Send photos/videos
- View typing indicators
- Discuss job requirements
- Negotiate terms

**Navigation**:
- Back to job details or home

---

### **PHASE 4: JOB ACCEPTANCE & WORK**

#### **Screen 14: Notifications** (`(modals)/notifications.tsx`)
**Freelancer Receives**:
- ✅ "Your application was accepted!" → Job status: `accepted`
- ✅ "Client sent a message"
- ✅ "Payment locked in escrow"
- ✅ "Job completed - Payment released"

**Actions**:
- Tap notification → Navigate to relevant screen
- Mark as read

**Navigation**:
- `/(modals)/job/[id]` - View accepted job
- `/(modals)/chat/[jobId]` - Chat with poster
- `/(modals)/wallet.tsx` - View payment

---

#### **Screen 15: Job Details** (`(modals)/job/[id].tsx`) **After Acceptance**
**Freelancer View of Accepted Job**:
- Job status: `in-progress`
- Payment status: "Locked in Escrow"
- **Actions**:
  - View job requirements
  - Access deliverables section
  - Chat with poster → `(modals)/chat/[jobId]`
  - Tap "Mark as Complete" → Submit work

**Navigation**:
- `/(modals)/chat/[jobId]` - Communicate
- `/(modals)/job-completion.tsx` - Submit work

---

#### **Screen 16: Chat Screen** (`(modals)/chat/[jobId].tsx`) **During Work**
**Actions**:
- Ask questions about requirements
- Share progress updates
- Upload work samples
- Request clarification
- Send drafts for review

---

### **PHASE 5: WORK COMPLETION**

#### **Screen 17: Job Completion Screen** (`(modals)/job-completion.tsx`)
**Purpose**: Submit completed work and request payment release

**Actions Available**:
- **Submit Deliverables**:
  - Upload completed files
  - Add completion notes
  - Mark work as complete
- **Status**: Work submitted → `submitted`
- **Waiting**: Poster reviews work

**After Submission**:
- Poster notified
- Poster can:
  - Approve → Payment released
  - Request revisions → Back to work
  - Dispute → Admin review

**Navigation**:
- Wait for poster approval
- `/(modals)/wallet.tsx` - Check payment status

---

### **PHASE 6: PAYMENT RECEIVED**

#### **Screen 18: Wallet Screen** (`(modals)/wallet.tsx`)
**Freelancer View**:
- **Actions Available**:
  - View total earnings (all coin types)
  - View transaction history
  - Filter by period (1D, 5D, 1W, 1M, 3M, 6M)
  - View payment details:
    - Job name
    - Amount received (90% of total)
    - Platform fee deducted (10%)
    - Payment date
  - Tap "Withdraw" → `(modals)/coin-withdrawal` (if KYC verified)

**Transaction Types** (Freelancer View):
- **Credit**: Payment received from completed job (90% of total)
- **Credit**: Guild bonus (if applicable)
- **Debit**: Coin purchase
- **Debit**: Withdrawal (if applicable)

**Navigation**:
- `/(modals)/coin-store` - Buy coins (if needed)
- `/(modals)/coin-withdrawal` - Withdraw earnings
- `/(modals)/transaction-history` - Detailed history

---

#### **Screen 19: Transaction History** (`(modals)/transaction-history.tsx`)
**Actions**:
- View all transactions
- Filter by type (Credits / Debits)
- Filter by date
- View transaction details:
  - Job ID
  - Amount
  - Status (Completed / Pending / Failed)
  - Timestamp

---

### **FREELANCER JOURNEY SUMMARY**

```
START
  ↓
Home Screen → Browse Job Feed
  ↓
Job Details → Tap "Submit Offer"
  ↓
Apply Screen → Enter Cover Letter, Price, Timeline → Submit
  ↓
[Wait for Poster Response] → Notifications
  ↓
[Application Accepted] → Escrow Payment Locked
  ↓
Chat Screen (Communication with Poster)
  ↓
Complete Work → Job Completion Screen (Submit Deliverables)
  ↓
[Poster Approves] → Payment Released (90% to freelancer)
  ↓
Wallet → View Payment Received
  ↓
[Optional] Withdraw → Coin Withdrawal (if KYC verified)
  ↓
END (Payment Received)
```

**Key Screens**:
1. `(main)/home.tsx` - Browse jobs
2. `(main)/jobs.tsx` - All jobs list
3. `(main)/search.tsx` - Search jobs
4. `(modals)/job/[id].tsx` - View job details
5. `(modals)/apply/[jobId].tsx` - Submit application
6. `(modals)/chat/[jobId].tsx` - Communication
7. `(modals)/job-completion.tsx` - Submit work
8. `(modals)/wallet.tsx` - View earnings
9. `(modals)/notifications.tsx` - Application updates

---

## 🔄 **COMPARISON: POSTER vs FREELANCER**

| Aspect | Poster | Freelancer |
|--------|--------|------------|
| **Main Goal** | Post jobs, hire freelancers | Find jobs, complete work, earn money |
| **Primary Screens** | `add-job.tsx`, `my-jobs.tsx`, `escrow-payment.tsx` | `jobs.tsx`, `apply/[jobId].tsx`, `wallet.tsx` |
| **Job Creation** | ✅ Creates jobs (4 steps) | ❌ Cannot create jobs |
| **Application** | ✅ Reviews applications | ✅ Submits applications |
| **Payment Flow** | 🔒 Locks payment in escrow | 💰 Receives payment after completion |
| **Work Management** | ✅ Reviews & approves work | ✅ Completes & submits work |
| **Communication** | ✅ Chats with freelancers | ✅ Chats with posters |
| **Wallet Focus** | Debits (payments made) | Credits (payments received) |

---

## 📊 **COMPLETE ACTION MATRIX**

### **Screen Actions Reference**

| Screen Name | File Path | Poster Actions | Freelancer Actions |
|------------|-----------|----------------|-------------------|
| **Home** | `(main)/home.tsx` | Add Job, View Posted Jobs | Browse Jobs, Search |
| **Add Job** | `(modals)/add-job.tsx` | ✅ Create Job (4 steps) | ❌ N/A |
| **My Jobs** | `(modals)/my-jobs.tsx` | ✅ Manage Posted Jobs | ❌ N/A |
| **Jobs** | `(main)/jobs.tsx` | Browse Jobs | ✅ Browse & Filter Jobs |
| **Job Details** | `(modals)/job/[id].tsx` | ✅ View Applications | ✅ Apply to Job |
| **Apply** | `(modals)/apply/[jobId].tsx` | ❌ N/A | ✅ Submit Application |
| **Escrow Payment** | `(modals)/escrow-payment.tsx` | ✅ Lock Payment | ❌ N/A |
| **Chat** | `(modals)/chat/[jobId].tsx` | ✅ Communicate | ✅ Communicate |
| **Job Completion** | `(modals)/job-completion.tsx` | ✅ Approve Work | ✅ Submit Work |
| **Wallet** | `(modals)/wallet.tsx` | ✅ View Payments Made | ✅ View Earnings |
| **Notifications** | `(modals)/notifications.tsx` | ✅ Application Alerts | ✅ Acceptance Alerts |

---

**End of User Journey Flow Documentation**

