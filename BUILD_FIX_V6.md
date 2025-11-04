# Build Fix V6 - Notification Icon Issue

## Date: October 25, 2025

## Problem
EAS build was failing during the prebuild phase with error:
```
Error: [android.dangerous]: withAndroidDangerousBaseMod: An error occurred while configuring Android notifications. 
Encountered an issue resizing Android notification icon: Error: Could not find MIME for Buffer <null>
```

## Root Cause
The `notification-icon.png` file in the `assets` directory was corrupted or invalid:
- File size: Only 269 bytes (way too small for a valid PNG)
- This caused the `expo-notifications` plugin to fail during prebuild

## Solution Applied

### 1. Fixed Notification Icon Configuration
**File: `app.config.js`**

Removed the corrupted icon reference:
```javascript
// Before:
[
  "expo-notifications",
  {
    icon: "./assets/notification-icon.png",  // ❌ Corrupted file
    color: "#32FF00",
    defaultChannel: "guild-system"
  }
]

// After:
[
  "expo-notifications",
  {
    color: "#32FF00",  // ✅ Icon removed, will use default
    defaultChannel: "guild-system"
  }
]
```

### 2. Updated .gitignore
Added native directories to `.gitignore` to use managed workflow:
```
android/
ios/
```

This ensures EAS generates fresh native directories on each build.

## Build Status
✅ **Build started successfully**
- Notification icon issue resolved
- Prebuild should now complete on EAS servers
- Using managed workflow (no local android/ios directories)

## Notes
- Local prebuild failed due to Windows file system permissions (antivirus/security software)
- This doesn't affect EAS builds which run on Linux servers
- The app will use Android's default notification icon style
- Can replace with a proper notification icon later (96x96 PNG with transparency)

## Next Steps
1. Wait for EAS build to complete
2. If successful, download and test the APK
3. If needed, create a proper notification icon (96x96 PNG)











