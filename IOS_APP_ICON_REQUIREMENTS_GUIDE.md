# 🎨 iOS APP ICON REQUIREMENTS GUIDE

**Apple Guideline:** 2.3.7 - App Icon Requirements  
**Priority:** ⚠️ MEDIUM (App Store rejection if icon doesn't meet standards)  
**Status:** Documentation complete, implementation needed  
**Date:** November 7, 2025

---

## 📱 REQUIRED ICON SIZES FOR iOS

### App Store Icon
- **1024x1024 pixels** (PNG, no transparency, no rounded corners)
  - Used in: App Store listing
  - Must be square (Apple adds rounded corners automatically)
  - No alpha channel

### iPhone Icons
- **180x180** - iPhone (3x) - iOS 14+
- **120x120** - iPhone (2x) - iOS 14+
- **80x80** - iPhone Spotlight (2x)
- **87x87** - iPhone Spotlight (3x)
- **60x60** - iPhone Notification (2x)
- **40x40** - iPhone Spotlight (1x)

### iPad Icons (Required if `supportsTablet: true`)
- **167x167** - iPad Pro (2x)
- **152x152** - iPad (2x)
- **76x76** - iPad (1x)
- **80x80** - iPad Spotlight (2x)
- **40x40** - iPad Spotlight (1x)
- **40x40** - iPad Notification (1x)
- **20x20** - iPad Notification (1x)

---

## 🎯 CURRENT STATUS

**Current Icon Location:** `GUILD-3/assets/icon.png`

**Configured in `app.config.js`:**
```javascript
icon: "./assets/icon.png",
```

**Action Needed:**
1. Verify `icon.png` is **1024x1024 pixels**
2. Ensure it meets Apple's design guidelines
3. Expo will automatically generate all required sizes

---

## ✅ APPLE ICON DESIGN GUIDELINES

### Requirements
1. **No transparency** - Solid background required
2. **Square** - Apple adds rounded corners automatically
3. **High quality** - Sharp, crisp, professional
4. **Recognizable** - Clear at all sizes (20x20 to 1024x1024)
5. **Consistent** - Same icon across all platforms

### Avoid
❌ Text (especially small text)  
❌ Screenshots  
❌ Complex details that don't scale  
❌ Pre-rounded corners (Apple adds them)  
❌ Transparency or alpha channel

### Recommended
✅ Simple, bold design  
✅ Strong contrast  
✅ Distinctive shape/symbol  
✅ Brand colors  
✅ Works on light and dark backgrounds

---

## 🛠️ IMPLEMENTATION STEPS

### Step 1: Check Current Icon

```bash
cd GUILD-3/assets

# Check if icon.png exists and its dimensions
file icon.png
# Or use image viewer to check size
```

**Expected:** Should be 1024x1024 pixels, PNG format, no transparency

### Step 2: Verify Icon Quality

Open `assets/icon.png` and verify:
- [ ] Clear and recognizable
- [ ] No transparency
- [ ] Square (1024x1024)
- [ ] High quality (not pixelated)
- [ ] Looks good at small sizes (test by zooming out)

### Step 3: Expo Automatic Generation

**Good News:** Expo automatically generates all required sizes!

When you build your app, Expo will:
1. Read `assets/icon.png` (1024x1024)
2. Generate all required iOS icon sizes
3. Create the proper AppIcon.appiconset
4. Place them in `ios/GUILD/Images.xcassets/AppIcon.appiconset/`

**No manual resizing needed!**

### Step 4: Build and Verify

```bash
# Build iOS app
npm run ios

# Or for production build
eas build --platform ios
```

Expo will automatically handle icon generation during build.

### Step 5: Manual Verification (Optional)

After building, check generated icons:

```bash
cd ios/GUILD/Images.xcassets/AppIcon.appiconset/
ls -la
```

You should see:
- `Contents.json` (icon catalog)
- Multiple PNG files at different sizes
- All sizes mentioned above should be present

---

## 🎨 IF YOU NEED A NEW ICON

### Option 1: Use Icon Generator Tool

**Recommended:** Use Expo's icon generation

1. Create a **1024x1024 PNG** icon (use Figma, Sketch, Photoshop, etc.)
2. Save as `assets/icon.png`
3. Run `expo prebuild` to regenerate icons
4. Icons will be automatically created

### Option 2: Use Online Tools

**App Icon Generator Tools:**
- https://www.appicon.co/
- https://makeappicon.com/
- https://icon.kitchen/

**Steps:**
1. Upload your 1024x1024 icon
2. Download iOS icon set
3. Extract to `ios/GUILD/Images.xcassets/AppIcon.appiconset/`
4. Replace existing icons

### Option 3: Design from Scratch

**Design Tools:**
- **Figma** (free, online)
- **Sketch** (Mac only, paid)
- **Adobe Illustrator** (paid)
- **Affinity Designer** (one-time purchase)

**Template:**
- Create 1024x1024 artboard
- Design icon with no transparency
- Export as PNG at 1x (1024x1024)
- Save to `assets/icon.png`

---

## 📐 ICON DESIGN BEST PRACTICES

### 1. Simplicity
- One focal point
- Clear silhouette
- Minimal details

### 2. Scalability
- Test at 20x20 (smallest size)
- Ensure recognizable when tiny
- Avoid thin lines (< 2px at 1024x1024)

### 3. Memorability
- Unique shape or symbol
- Distinctive colors
- Consistent with brand

### 4. Platform Consistency
- Similar to iOS design language
- Follows Apple's aesthetic
- Professional appearance

---

## 🔍 TESTING YOUR ICON

### Visual Test
1. View icon at different sizes:
   - Full size (1024x1024)
   - Medium (180x180, 120x120)
   - Small (40x40, 20x20)
2. Check on different backgrounds:
   - White background
   - Black background
   - Colored backgrounds

### Device Test
1. Build app to device/simulator
2. View on Home Screen
3. Check in Settings
4. View in Spotlight search
5. Check in App Switcher

### App Store Test
1. Upload to TestFlight
2. View in TestFlight app
3. Check App Store listing preview
4. Verify it looks professional

---

## ⚠️ COMMON ISSUES

### Issue: Icon has white corners
**Cause:** Transparency in PNG  
**Solution:** Fill background with solid color

### Issue: Icon looks blurry
**Cause:** Source image too small  
**Solution:** Use 1024x1024 source (not scaled up)

### Issue: Icon not updating
**Cause:** Cache  
**Solution:** 
```bash
# Clean cache
npm start -- --clear
# Or delete derived data (Xcode)
# Or uninstall app and rebuild
```

### Issue: Missing icon sizes
**Cause:** Prebuild not run  
**Solution:**
```bash
expo prebuild --clean
```

---

## ✅ VERIFICATION CHECKLIST

Before submission:
- [ ] Icon is 1024x1024 pixels
- [ ] No transparency (solid background)
- [ ] Square (not pre-rounded)
- [ ] High quality (sharp, not pixelated)
- [ ] Recognizable at small sizes
- [ ] Consistent with brand
- [ ] Professional appearance
- [ ] No text or complex details
- [ ] Looks good on light/dark backgrounds
- [ ] All sizes generated correctly
- [ ] Tested on actual device
- [ ] Matches Android icon (similar design)

---

## 📊 CURRENT GUILD ICON STATUS

**Location:** `assets/icon.png`

**Status:** ⏳ Needs verification

**Action Required:**
1. **Verify:** Check if `assets/icon.png` is 1024x1024
2. **Review:** Ensure it meets Apple guidelines
3. **Test:** Build app and verify on device
4. **Document:** Confirm icon is ready

**If icon is already compliant:**
✅ No action needed - Expo handles everything!

**If icon needs work:**
⚠️ Create/update `assets/icon.png` (1024x1024, no transparency)

---

## 🎯 QUICK CHECKLIST FOR SUBMISSION

### Before App Store Submission
1. ✅ `assets/icon.png` exists
2. ✅ Icon is 1024x1024 pixels
3. ✅ No transparency
4. ✅ High quality
5. ✅ Professional design
6. ✅ Recognizable at all sizes
7. ✅ Tested on device
8. ✅ Looks good in App Store listing
9. ✅ Matches brand identity
10. ✅ Complies with Apple guidelines

---

## 📚 REFERENCES

- **Apple Human Interface Guidelines - App Icons:**  
  https://developer.apple.com/design/human-interface-guidelines/app-icons

- **Expo App Icon Documentation:**  
  https://docs.expo.dev/guides/app-icons/

- **App Store Review Guidelines 2.3.7:**  
  https://developer.apple.com/app-store/review/guidelines/#minimum-functionality

---

**IMPLEMENTATION STATUS:** Documentation Complete  
**Next Step:** Verify `assets/icon.png` meets requirements  
**Est. Time:** 15-30 minutes (if icon needs updating)  
**Phase 8.2:** App Icon Requirements Documented

*Created: November 7, 2025*


