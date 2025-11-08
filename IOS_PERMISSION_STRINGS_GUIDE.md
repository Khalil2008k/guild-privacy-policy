# 🍎 iOS Permission Strings Fix Guide

**Apple Guideline:** 5.1.1 - Privacy - Purpose Strings  
**Issue:** Camera, microphone, photo library usage strings are vague  
**Status:** Instructions created - implementation needed

---

## 🎯 WHAT NEEDS TO BE DONE

Update permission strings to be clear, specific, and accurate about why each permission is used.

---

## 📱 OPTION A: Using Expo (Recommended for this project)

### 1. Check if `app.json` or `app.config.js` exists

The project uses Expo, so configuration is in one of these files:
- `app.json` (static config)
- `app.config.js` or `app.config.ts` (dynamic config)

### 2. Add iOS Permissions to Expo Config

**If using `app.json`:**
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "GUILD uses your camera to take and upload profile pictures, job photos, or verification documents.",
        "NSMicrophoneUsageDescription": "GUILD uses your microphone to record and send voice messages in chat conversations.",
        "NSPhotoLibraryUsageDescription": "GUILD accesses your photo library so you can select and share images in chat, update your profile picture, or upload job-related photos."
      }
    }
  }
}
```

**If using `app.config.js`:**
```javascript
export default {
  expo: {
    ios: {
      infoPlist: {
        NSCameraUsageDescription: "GUILD uses your camera to take and upload profile pictures, job photos, or verification documents.",
        NSMicrophoneUsageDescription: "GUILD uses your microphone to record and send voice messages in chat conversations.",
        NSPhotoLibraryUsageDescription: "GUILD accesses your photo library so you can select and share images in chat, update your profile picture, or upload job-related photos."
      }
    }
  }
};
```

### 3. Rebuild the iOS App

```bash
# If using EAS Build
eas build --platform ios --profile production

# If using local builds
expo prebuild --clean
cd ios
pod install
cd ..
expo run:ios
```

---

## 🛠️ OPTION B: Direct Info.plist Edit (If using bare React Native)

### 1. Locate Info.plist

```
ios/GUILD/Info.plist
# or
ios/guild2/Info.plist  
# (depends on project name)
```

### 2. Add or Update These Keys

```xml
<key>NSCameraUsageDescription</key>
<string>GUILD uses your camera to take and upload profile pictures, job photos, or verification documents.</string>

<key>NSMicrophoneUsageDescription</key>
<string>GUILD uses your microphone to record and send voice messages in chat conversations.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>GUILD accesses your photo library so you can select and share images in chat, update your profile picture, or upload job-related photos.</string>

<!-- Optional: If using photo library saving -->
<key>NSPhotoLibraryAddUsageDescription</key>
<string>GUILD saves images and files you choose to keep to your photo library.</string>

<!-- Optional: If using location -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>GUILD uses your location to show nearby jobs and guild members.</string>

<!-- Optional: If using notifications -->
<key>NSUserNotificationsUsageDescription</key>
<string>GUILD sends you notifications about job updates, messages, and important account activities.</string>
```

### 3. Rebuild in Xcode

```bash
cd ios
pod install
open GUILD.xcworkspace  # or guild2.xcworkspace
```

Then build and run from Xcode.

---

## ✅ RECOMMENDED PERMISSION STRINGS

### Camera
**Good:**
> "GUILD uses your camera to take and upload profile pictures, job photos, or verification documents."

**Why it's good:**
- Specific about what will be photographed
- Mentions all use cases (profile, jobs, documents)
- Professional and clear

**Bad examples to avoid:**
- ❌ "This app requires camera access" (too vague)
- ❌ "For taking photos" (doesn't explain why)
- ❌ "Camera needed" (not helpful)

### Microphone
**Good:**
> "GUILD uses your microphone to record and send voice messages in chat conversations."

**Why it's good:**
- Clear about audio recording purpose
- Specifies it's for messaging
- Users understand it's not background recording

**Bad examples to avoid:**
- ❌ "Audio recording" (what for?)
- ❌ "Microphone access required" (why?)

### Photo Library
**Good:**
> "GUILD accesses your photo library so you can select and share images in chat, update your profile picture, or upload job-related photos."

**Why it's good:**
- Lists all use cases
- "Select and share" clarifies it's user-initiated
- Specific about what types of images

**Bad examples to avoid:**
- ❌ "Access your photos" (all of them? for what?)
- ❌ "Photo library required" (not helpful)

---

## 🧪 TESTING

### How to Test Permission Strings

1. **Install fresh build** on device or simulator
2. **Delete app** if previously installed (to reset permissions)
3. **Open app** and trigger each permission:
   - **Camera**: Try to take a profile photo or upload job image
   - **Microphone**: Try to send a voice message in chat
   - **Photos**: Try to select an image from library

4. **Verify alert shows:**
   - Your custom description (not the default)
   - Clear and professional wording
   - No typos or grammatical errors

5. **Check Settings:**
   - Go to iOS Settings → Privacy → Camera/Photos/Microphone
   - Find GUILD app
   - Verify description matches

---

## 📋 IMPLEMENTATION CHECKLIST

### Pre-Implementation
- [ ] Locate Expo config file (`app.json` or `app.config.js`)
- [ ] OR locate iOS `Info.plist` file (for bare React Native)
- [ ] Back up current configuration

### Implementation (Choose ONE path)

**Path A: Expo (Recommended):**
- [ ] Add `infoPlist` configuration to Expo config
- [ ] Add all three permission strings
- [ ] Run `expo prebuild` to update native files
- [ ] Test in simulator

**Path B: Native:**
- [ ] Open `Info.plist` in Xcode or text editor
- [ ] Add/update permission keys
- [ ] Save file
- [ ] Clean build folder
- [ ] Rebuild app

### Testing
- [ ] Delete app from device/simulator
- [ ] Install fresh build
- [ ] Test camera permission (take profile photo)
- [ ] Test microphone permission (send voice message)
- [ ] Test photo library permission (select image)
- [ ] Verify custom strings show in permission alerts
- [ ] Check iOS Settings → Privacy to confirm strings

### Submission
- [ ] Include updated permission strings in App Store submission
- [ ] Note permission usage in App Store Review Notes
- [ ] Verify strings in TestFlight build

---

## ⚠️ IMPORTANT NOTES

### DO:
- ✅ Be specific about what you're accessing
- ✅ Explain why you need the permission
- ✅ Use user-friendly language
- ✅ Test on actual device
- ✅ Keep strings under 2 sentences
- ✅ Make sure every permission you declare is actually used

### DON'T:
- ❌ Use vague terms like "for app functionality"
- ❌ Request permissions you don't actually use
- ❌ Use technical jargon
- ❌ Make promises you don't keep
- ❌ Include marketing language
- ❌ Forget to update after code changes

---

## 🎯 QUICK COPY-PASTE

For fastest implementation, copy this entire block:

```json
"infoPlist": {
  "NSCameraUsageDescription": "GUILD uses your camera to take and upload profile pictures, job photos, or verification documents.",
  "NSMicrophoneUsageDescription": "GUILD uses your microphone to record and send voice messages in chat conversations.",
  "NSPhotoLibraryUsageDescription": "GUILD accesses your photo library so you can select and share images in chat, update your profile picture, or upload job-related photos."
}
```

Paste into your Expo config's `ios` section.

---

## 📊 TIME ESTIMATE

- **Finding config file:** 5 minutes
- **Adding strings:** 5 minutes
- **Rebuilding:** 10-15 minutes
- **Testing:** 5-10 minutes

**Total:** ~30 minutes

---

**STATUS:** Guide Complete - Ready for Implementation  
**Phase 9.1:** Permission Strings Documentation ✅

*Implementation can be done by developer or in next session*

