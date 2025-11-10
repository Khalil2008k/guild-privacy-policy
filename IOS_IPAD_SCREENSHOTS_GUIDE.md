# 📸 iOS iPAD SCREENSHOTS GUIDE

**Apple Guideline:** 2.3 - App Completeness  
**Priority:** ⚠️ MEDIUM (Required for App Store listing if app supports iPad)  
**Status:** Documentation complete, screenshots needed  
**Date:** November 7, 2025

---

## 📱 REQUIRED SCREENSHOT SIZES

Since GUILD has `supportsTablet: true` in `app.config.js`, you MUST provide iPad screenshots.

### iPad Pro (3rd Gen) 12.9"
- **Required Size:** 2048 x 2732 pixels (portrait)
- **Alternative:** 2732 x 2048 pixels (landscape)
- **Minimum:** 3-10 screenshots
- **Format:** PNG or JPEG

### iPad Pro (2nd Gen) 12.9"
- **Size:** 2048 x 2732 pixels (portrait)
- **Note:** Same as 3rd Gen, can reuse screenshots

---

## 🎯 CURRENT STATUS

**App Configuration:**
```javascript
// app.config.js
ios: {
  supportsTablet: true,  // ✅ iPad support enabled
  requireFullScreen: false  // ✅ Allows multitasking
}
```

**What Apple Requires:**
1. **At least 3** iPad screenshots (max 10)
2. Must be actual app screenshots (not mockups)
3. Must show app functionality
4. Must be 2048x2732 pixels (portrait) or 2732x2048 (landscape)

---

## 🛠️ HOW TO CAPTURE iPAD SCREENSHOTS

### Option 1: Using iOS Simulator (Recommended)

#### Step 1: Install Xcode
```bash
# Xcode is required for iOS Simulator
# Download from Mac App Store (free)
```

#### Step 2: Start iPad Simulator
```bash
# Open Xcode
# Go to: Xcode → Open Developer Tool → Simulator
# Or use command line:
open -a Simulator

# Select iPad Pro 12.9"
# Simulator → Device → iPad Pro (12.9-inch) (6th generation)
```

#### Step 3: Run GUILD App
```bash
cd GUILD-3
npm run ios -- --simulator="iPad Pro (12.9-inch) (6th generation)"

# Or if already built:
expo start
# Press 'i' for iOS
# Select iPad Pro 12.9" from device list
```

#### Step 4: Navigate to Key Screens
Navigate through your app to capture:
1. **Home/Welcome Screen**
2. **Job Browse Screen** (show job listings)
3. **Job Details Screen**
4. **Profile Screen**
5. **Wallet/Coins Screen**

#### Step 5: Capture Screenshots
**Method A: Using Simulator Menu**
- Navigate to screen
- Click: **File** → **Save Screen**
- Or press: **Cmd + S**
- Save to folder (e.g., `screenshots/ipad/`)

**Method B: Using Command Line**
```bash
# Capture screenshot
xcrun simctl io booted screenshot ~/Desktop/screenshot1.png

# Find simulator UDID
xcrun simctl list devices

# Capture specific simulator
xcrun simctl io <DEVICE_UDID> screenshot ~/Desktop/screenshot.png
```

**Method C: Using macOS Screenshot**
- Press **Cmd + Shift + 4**
- Click and drag to select simulator screen
- Screenshots save to Desktop

#### Step 6: Verify Screenshot Dimensions
```bash
# Check dimensions (should be 2048x2732 for portrait)
sips -g pixelWidth -g pixelHeight screenshot.png

# Or use:
file screenshot.png
```

---

### Option 2: Using Real iPad Device

#### Step 1: Install App on iPad
```bash
# Build development version
npm run ios

# Or use EAS Build
eas build --platform ios --profile development
```

#### Step 2: Capture Screenshots
- **On iPad:** Press **Power + Volume Up** simultaneously
- Screenshots save to Photos app
- **Note:** May not be exact 2048x2732 (depends on iPad model)

#### Step 3: Transfer to Mac
- AirDrop to Mac
- Or use Photos app sync
- Or USB cable + Image Capture

#### Step 4: Resize if Needed
```bash
# Use sips to resize
sips -z 2732 2048 input.png --out output.png

# Or use online tools:
# - https://www.birme.net/
# - https://bulkresizephotos.com/
```

---

### Option 3: Using Screenshot Tools

#### Fastlane Snapshot (Automated)
```bash
# Install Fastlane
brew install fastlane

# Setup snapshot
fastlane snapshot init

# Configure Snapfile
# Edit fastlane/Snapfile

# Run automated screenshots
fastlane snapshot
```

#### Third-Party Tools
- **App Store Screenshot Generator:**  
  https://www.appstorescreenshot.com/
- **Screenshot Builder:**  
  https://www.screenshotbuilder.com/
- **Mockup Generator:**  
  https://mockuphone.com/

---

## 📸 WHAT TO CAPTURE

### Required Screenshots (Minimum 3)

#### 1. **Home/Dashboard** (Primary)
- Shows main app interface
- Job listings or guild overview
- Navigation elements visible
- Professional, clean UI

#### 2. **Job Details/Browsing**
- Show job posting details
- Demonstrates core functionality
- User can see what app does
- Clear call-to-action

#### 3. **Profile/Wallet**
- User profile screen
- Or wallet/coins screen
- Shows user features
- Demonstrates value proposition

### Optional Screenshots (4-10 total)

#### 4. **Chat/Messaging**
- Communication features
- Real-time interaction
- Professional messaging UI

#### 5. **Job Posting Creation**
- Show how users post jobs
- Demonstrate client features
- Clear workflow

#### 6. **Settings/Account**
- Account management
- Privacy settings
- Professional interface

---

## 🎨 SCREENSHOT BEST PRACTICES

### Composition
- **Clean data:** Use realistic but professional content
- **No placeholder text:** Real job titles, descriptions
- **Proper language:** English screenshots (Arabic optional)
- **Status bar:** Clean (full battery, good signal)
- **UI polish:** No bugs, glitches, or errors visible

### Content
- **Show functionality:** Make it clear what app does
- **Highlight features:** Focus on unique selling points
- **Professional:** No test data, lorem ipsum, or debug info
- **Compliant:** No references to other platforms, competitors
- **Clean:** No personal information, sensitive data

### Technical
- **Resolution:** Exactly 2048x2732 (portrait) or 2732x2048 (landscape)
- **Format:** PNG (preferred) or JPEG
- **File size:** < 10 MB per screenshot
- **Orientation:** All portrait OR all landscape (don't mix)

---

## ⚠️ COMMON MISTAKES TO AVOID

### ❌ Don't Do This:
- Mockups or templates (must be actual app)
- Screenshots from iPhone (wrong dimensions)
- Mixed orientations (portrait + landscape)
- Low resolution or pixelated images
- Debug info, console logs visible
- Lorem ipsum or placeholder text
- Personal/sensitive information visible
- References to "iOS", "Android", "iPhone", "iPad"
- Competitor app names or logos
- Outdated app version screenshots

### ✅ Do This Instead:
- Actual app running on iPad simulator
- Consistent orientation (all portrait OR all landscape)
- High quality, sharp images
- Real, professional content
- Clean UI with no errors
- Appropriate for App Store audience
- Current app version
- Highlights key features

---

## 📐 SCREENSHOT SPECIFICATIONS

### iPad Pro 12.9" (Required)
| Specification | Value |
|---------------|-------|
| **Portrait** | 2048 x 2732 pixels |
| **Landscape** | 2732 x 2048 pixels |
| **Format** | PNG or JPEG |
| **Max File Size** | 10 MB |
| **Color Space** | RGB (sRGB recommended) |
| **Min Screenshots** | 3 |
| **Max Screenshots** | 10 |

### File Naming Convention
```
guild-ipad-01-home.png
guild-ipad-02-jobs.png
guild-ipad-03-profile.png
guild-ipad-04-wallet.png
guild-ipad-05-chat.png
```

---

## 🚀 STEP-BY-STEP IMPLEMENTATION

### Phase 1: Setup (10 min)
1. ✅ Open Xcode
2. ✅ Launch iPad Pro 12.9" simulator
3. ✅ Build and run GUILD app
4. ✅ Create `screenshots/ipad/` folder

### Phase 2: Prepare App (15 min)
1. ✅ Add realistic job data
2. ✅ Create professional profile
3. ✅ Add coins to wallet (for demo)
4. ✅ Clean up UI (hide debug info)
5. ✅ Set to English language

### Phase 3: Capture Screenshots (20 min)
1. ✅ Navigate to Home → **Cmd + S** → Save
2. ✅ Navigate to Jobs → **Cmd + S** → Save
3. ✅ Navigate to Profile → **Cmd + S** → Save
4. ✅ Navigate to Wallet → **Cmd + S** → Save
5. ✅ Navigate to Chat → **Cmd + S** → Save

### Phase 4: Verify (10 min)
1. ✅ Check dimensions: `sips -g pixelWidth -g pixelHeight *.png`
2. ✅ Verify file size: `ls -lh *.png`
3. ✅ Review content: Open in Preview app
4. ✅ Ensure professional quality
5. ✅ Check for errors/bugs visible

### Phase 5: Upload (5 min)
1. ✅ Go to App Store Connect
2. ✅ Navigate to: **My Apps** → **GUILD** → **App Store** tab
3. ✅ Click: **iPad Screenshots**
4. ✅ Drag and drop PNG files
5. ✅ Arrange in desired order
6. ✅ Save changes

**Total Time:** ~60 minutes

---

## 📊 CHECKLIST

### Before Capturing
- [ ] iPad Pro 12.9" simulator running
- [ ] App built and launched
- [ ] Realistic data populated
- [ ] UI is clean and professional
- [ ] English language selected
- [ ] Status bar clean

### During Capture
- [ ] Capture 3-10 key screens
- [ ] Use **Cmd + S** to save
- [ ] Save to organized folder
- [ ] Keep consistent orientation
- [ ] Ensure good composition

### After Capture
- [ ] Verify dimensions (2048x2732)
- [ ] Check file size (< 10 MB)
- [ ] Review for quality
- [ ] No bugs/errors visible
- [ ] Professional content
- [ ] Ready for upload

### Upload to App Store Connect
- [ ] Log in to App Store Connect
- [ ] Navigate to GUILD app
- [ ] Go to App Store tab
- [ ] Upload iPad screenshots
- [ ] Arrange in order
- [ ] Save changes

---

## 🎯 ALTERNATIVE: DEFER iPad SCREENSHOTS

If you don't have immediate access to Mac/iPad:

### Option A: Disable iPad Support (Not Recommended)
```javascript
// app.config.js
ios: {
  supportsTablet: false,  // ❌ Disables iPad support
}
```
**Downside:** Loses iPad users (significant market)

### Option B: Use Phone Screenshots Temporarily
- Upload iPhone screenshots for now
- Apple may accept temporarily
- Update with iPad screenshots later

### Option C: Hire Someone
- Fiverr: $5-20 for screenshot service
- Upwork: Professional screenshot capture
- 99designs: Design custom screenshots

---

## 📚 REFERENCES

- **App Store Connect Screenshot Requirements:**  
  https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications

- **iOS Simulator Documentation:**  
  https://developer.apple.com/documentation/xcode/running-your-app-in-simulator-or-on-a-device

- **Fastlane Snapshot:**  
  https://docs.fastlane.tools/getting-started/ios/screenshots/

---

**IMPLEMENTATION STATUS:** Documentation Complete  
**Next Step:** Capture iPad screenshots using simulator  
**Est. Time:** 60 minutes  
**Phase 8.3:** iPad Screenshots Guide Complete  

*Created: November 7, 2025*


