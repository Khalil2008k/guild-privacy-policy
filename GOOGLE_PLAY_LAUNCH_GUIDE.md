# 🚀 GUILD App - Google Play Launch Guide

**Created:** October 15, 2025  
**App:** GUILD Platform - Professional Networking & Job Marketplace  
**Build System:** Expo EAS (v54)

---

## 📋 **Pre-Launch Checklist**

### ✅ **Requirements Completed:**
- [x] App is functional and tested
- [x] Backend server running (http://192.168.1.34:5000)
- [x] Firebase configured and connected
- [x] Expo app configuration exists (app.config.js)
- [x] EAS build configuration exists (eas.json)
- [x] Production build configured for AAB (Android App Bundle)

### ⚠️ **Requirements Needed:**
- [ ] Google Play Console account ($25 one-time fee)
- [ ] App icon (512x512px, 1024x1024px)
- [ ] Feature graphic (1024x500px)
- [ ] Screenshots (4-8 images, various device sizes)
- [ ] Privacy Policy URL
- [ ] App description and metadata
- [ ] Content rating questionnaire
- [ ] Release signing key

---

## 🎯 **Launch Process Overview**

### Phase 1: Prepare App Configuration
### Phase 2: Build Production APK/AAB
### Phase 3: Create Google Play Console Account
### Phase 4: Prepare Store Listing
### Phase 5: Upload & Release

---

## 📱 **PHASE 1: Prepare App Configuration**

### Step 1.1: Update app.config.js

Your app needs proper configuration for Play Store. Let me check your current config and update it.

**Key fields needed:**
- `android.package`: Unique identifier (e.g., `com.guild.app`)
- `android.versionCode`: Integer version (increment for each release)
- `version`: Semver version string (e.g., "1.0.0")
- `android.icon`: 512x512px PNG icon
- `android.adaptiveIcon`: Adaptive icon for Android
- `android.permissions`: Required permissions list

### Step 1.2: Create App Icon

```bash
# Create 512x512px icon
# You'll need a designer or use tools like:
# - Figma
# - Canva
# - Adobe Illustrator
```

**Icon Guidelines:**
- 512x512px PNG
- No transparency in foreground
- Background can have transparency
- Follow Material Design guidelines

### Step 1.3: Configure Permissions

Review and add only necessary permissions in `app.config.js`:
```javascript
"android": {
  "permissions": [
    "CAMERA",
    "READ_EXTERNAL_STORAGE",
    "WRITE_EXTERNAL_STORAGE",
    "ACCESS_FINE_LOCATION",
    "ACCESS_COARSE_LOCATION",
    "NOTIFICATIONS"
  ]
}
```

---

## 🏗️ **PHASE 2: Build Production APK/AAB**

### Step 2.1: Install EAS CLI

```powershell
# Install Expo Application Services CLI
npm install -g eas-cli

# Login to your Expo account (create one if you don't have)
eas login
```

### Step 2.2: Configure EAS Build

Your `eas.json` is already configured! ✅

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "aab"  // Android App Bundle for Play Store
      }
    }
  }
}
```

### Step 2.3: Build Production AAB

```powershell
# Navigate to project directory
cd c:\Users\Admin\GUILD\GUILD-3

# Build Android App Bundle for production
eas build --platform android --profile production

# This will:
# 1. Upload your code to EAS
# 2. Build on Expo's servers
# 3. Generate signed AAB file
# 4. Provide download link
```

**Build Time:** 10-30 minutes

**Output:** 
- `guild-xxx.aab` file ready for Play Store
- Signing key automatically managed by EAS

### Step 2.4: Download the AAB

After build completes:
1. EAS will provide a download link
2. Download the `.aab` file
3. Save it somewhere safe (e.g., `C:\Users\Admin\GUILD\releases\`)

---

## 🏪 **PHASE 3: Create Google Play Console Account**

### Step 3.1: Register Developer Account

1. Go to: https://play.google.com/console/signup
2. Sign in with Google account
3. Accept Developer Distribution Agreement
4. Pay **$25 one-time registration fee**
5. Complete account details

**Time:** 5-10 minutes

### Step 3.2: Create New App

1. Click "Create app"
2. Fill in details:
   - **App name:** GUILD
   - **Default language:** English (US) or Arabic
   - **App type:** Application
   - **Free/Paid:** Free
   - **Category:** Business / Productivity

3. Complete declarations:
   - [ ] Confirm you own distribution rights
   - [ ] Confirm app complies with policies
   - [ ] Confirm it's not targeting children

---

## 📝 **PHASE 4: Prepare Store Listing**

### Step 4.1: App Details

**Short Description** (80 characters max):
```
Professional networking platform connecting businesses with skilled workers
```

**Full Description** (4000 characters max):
```
GUILD - Professional Networking & Job Marketplace

Connect, Collaborate, and Grow Your Professional Network

GUILD is a revolutionary platform that brings together businesses, professionals, and skilled workers in one powerful ecosystem. Whether you're looking to hire talent, find your next project, or expand your professional network, GUILD has you covered.

🎯 KEY FEATURES:

• Job Marketplace: Post jobs or find opportunities that match your skills
• Guild System: Join professional communities and collaborate on projects
• Real-time Chat: Communicate instantly with team members and clients
• Payment Integration: Secure payment system with Guild Coins (beta)
• Smart Matching: AI-powered job recommendations
• Location-based Search: Find opportunities near you
• Contract Management: Digital contracts with e-signature
• Portfolio Showcase: Display your work and achievements
• Real-time Notifications: Stay updated on job status and messages
• Multi-language Support: Available in English and Arabic

💼 FOR BUSINESSES:
• Post unlimited job listings
• Browse verified professional profiles
• Create and manage guilds (teams)
• Secure payment escrow system
• Track project progress
• Review and rate workers

👷 FOR PROFESSIONALS:
• Find jobs matching your skills
• Join relevant guilds
• Build your professional portfolio
• Get paid securely
• Receive job recommendations
• Chat with potential employers

🔒 SECURITY & PRIVACY:
• Verified user profiles
• Secure payment processing
• Data encryption
• Privacy-first design
• GDPR compliant

🌟 WHY CHOOSE GUILD:
• User-friendly interface
• Fast and responsive
• Regular updates
• Dedicated support
• Growing community

Join thousands of professionals and businesses already using GUILD to transform the way they work and connect.

Download GUILD today and unlock your professional potential!

---

For support: support@guild.app
Website: https://guild.app
Terms: https://guild.app/terms
Privacy: https://guild.app/privacy
```

### Step 4.2: Graphics Assets

**Required Images:**

1. **App Icon** (Required)
   - 512x512px PNG
   - No transparency

2. **Feature Graphic** (Required)
   - 1024x500px PNG/JPG
   - Promotional banner shown on Play Store

3. **Screenshots** (Minimum 2, Maximum 8)
   - Phone: 320-3840px on any side
   - Recommended: 1080x1920px or 1080x2340px
   - Show key app features

4. **Promotional Video** (Optional)
   - YouTube URL
   - 30 seconds - 2 minutes

**Screenshot Ideas:**
1. Home screen with job listings
2. Job details and application screen
3. Guild/community screen
4. Chat interface
5. User profile screen
6. Payment/wallet screen
7. Map view with nearby jobs
8. Notifications screen

### Step 4.3: Categorization

- **Application Type:** App
- **Category:** Business
- **Tags:** Jobs, Networking, Professional, Marketplace

### Step 4.4: Contact Details

```
Email: support@guild.app
Phone: (optional)
Website: https://guild.app
Privacy Policy: https://guild.app/privacy (REQUIRED)
```

**⚠️ IMPORTANT:** You MUST have a privacy policy URL before submitting!

### Step 4.5: Content Rating

Complete the content rating questionnaire:
- Violence: None
- Sexual Content: None
- Language: None
- Controlled Substances: None
- Gambling: None

Expected rating: **Everyone** or **Teen**

---

## 📤 **PHASE 5: Upload & Release**

### Step 5.1: Create Internal Test Release

1. Go to: **Testing > Internal testing**
2. Click "Create new release"
3. Upload your `.aab` file
4. Add release notes:
   ```
   Initial release of GUILD platform
   
   Features:
   - Job marketplace
   - Guild system
   - Real-time chat
   - Payment integration
   - Location-based search
   ```

5. Add testers (email addresses)
6. Click "Review release"
7. Click "Start rollout to Internal testing"

**Test with real users for 1-2 weeks**

### Step 5.2: Create Open/Closed Beta (Optional)

1. Go to: **Testing > Closed testing** or **Open testing**
2. Create new track
3. Upload new release
4. Invite beta testers
5. Collect feedback

**Beta testing: 2-4 weeks recommended**

### Step 5.3: Create Production Release

Once testing is complete:

1. Go to: **Production > Releases**
2. Click "Create new release"
3. Upload your final `.aab` file
4. Add release notes
5. Set rollout percentage (start with 10-20%)
6. Review and publish

**Review Time:** 1-7 days (usually 1-3 days)

### Step 5.4: Publish!

1. Complete all required sections:
   - [ ] App content
   - [ ] Store listing
   - [ ] Content rating
   - [ ] Target audience
   - [ ] News apps declaration (if applicable)
   - [ ] COVID-19 contact tracing declaration
   - [ ] Data safety section

2. Click **"Publish app"**

3. Wait for Google Play review

---

## 🚀 **Quick Command Reference**

```powershell
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS (if not done)
eas build:configure

# Build production AAB
cd c:\Users\Admin\GUILD\GUILD-3
eas build --platform android --profile production

# Check build status
eas build:list

# Download build
# (EAS will provide download link when complete)
```

---

## 📊 **Timeline Estimate**

| Task | Time | Status |
|------|------|--------|
| Update app configuration | 30 min | ⏳ To Do |
| Create app icons & graphics | 2-4 hours | ⏳ To Do |
| Build production AAB | 20-30 min | ⏳ To Do |
| Create Play Console account | 10 min | ⏳ To Do |
| Complete store listing | 1-2 hours | ⏳ To Do |
| Content rating questionnaire | 15 min | ⏳ To Do |
| Internal testing | 1-2 weeks | ⏳ To Do |
| Google review | 1-7 days | ⏳ To Do |
| **Total (excluding testing)** | **5-8 hours** | |
| **Total (with testing)** | **2-4 weeks** | |

---

## ⚠️ **Common Issues & Solutions**

### Issue 1: "App bundle not signed"
**Solution:** Use EAS build (automatically signed)

### Issue 2: "Privacy policy required"
**Solution:** Create a simple privacy policy page and host it

### Issue 3: "Icon doesn't meet requirements"
**Solution:** Use 512x512px PNG with no transparency

### Issue 4: "Missing screenshots"
**Solution:** Take at least 2 screenshots (recommended 4-8)

### Issue 5: "Build failed"
**Solution:** Check EAS build logs, usually missing dependencies

---

## 🎨 **Design Resources**

### Icon Makers:
- **Figma:** https://figma.com (Professional)
- **Canva:** https://canva.com (Easy)
- **App Icon Generator:** https://appicon.co

### Screenshot Tools:
- **Device Art Generator:** https://developer.android.com/distribute/marketing-tools/device-art-generator
- **Figma Mockups:** Use device frames
- **Screely:** https://screely.com

### Privacy Policy Generators:
- **App Privacy Policy Generator:** https://app-privacy-policy-generator.firebaseapp.com
- **TermsFeed:** https://termsfeed.com/privacy-policy-generator

---

## 📞 **Support & Resources**

- **Expo EAS Docs:** https://docs.expo.dev/build/introduction
- **Google Play Console:** https://play.google.com/console
- **Play Store Requirements:** https://developer.android.com/distribute/best-practices/launch
- **Content Rating:** https://support.google.com/googleplay/android-developer/answer/9859655

---

## ✅ **Next Steps**

1. **RIGHT NOW:**
   ```powershell
   npm install -g eas-cli
   eas login
   ```

2. **TODAY:**
   - Update app.config.js with proper package name
   - Create app icon (512x512px)
   - Take 4-8 screenshots of your app

3. **THIS WEEK:**
   - Build production AAB
   - Create Google Play Console account
   - Complete store listing

4. **NEXT 2 WEEKS:**
   - Internal testing
   - Fix bugs
   - Collect feedback

5. **MONTH 1:**
   - Submit for production review
   - Launch on Google Play! 🎉

---

**Ready to start?** Let me know which step you need help with first!

I can:
1. Update your app.config.js with proper settings
2. Create a privacy policy template
3. Help with build commands
4. Generate app description copy
5. Create a release checklist

What would you like to do first?


