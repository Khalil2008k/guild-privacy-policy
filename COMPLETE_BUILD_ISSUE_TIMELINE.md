# 🔴 ANDROID BUILD FAILURE - COMPLETE TIMELINE

## 📍 THE EXACT ISSUE

**Error Message:**
```
FAILURE: Build failed with an exception.
Could not set unknown property 'supportLibVersion' for root project 'GUILD' of type org.gradle.api.Project.
```

**When It Started:**
- Builds worked fine BEFORE commit `40450bc` (November 7, 2025)
- Commit `40450bc` added `react-native-iap` library for iOS In-App Purchases
- Android builds have been failing ever since

**Root Cause:**
The `react-native-iap` Expo config plugin adds this line to `android/build.gradle`:
```gradle
supportLibVersion = "28.0.0"
```

But it tries to add it inside an `ext` block that doesn't exist in our file. When it can't find `ext`, it adds the line at LINE 1 of the file, which is invalid Gradle syntax.

---

## 🔄 EVERYTHING WE TRIED (CHRONOLOGICAL)

### ❌ Attempt 1: Fixed Package Name & Version Mismatches
**What:** Updated `android/app/build.gradle` to match `app.config.js`
- Changed package from `com.guild` to `com.mazen123333.guild`
- Changed version from `1.0` to `1.0.0`

**Result:** Build still failed with same IAP error
**Why It Didn't Work:** Not the root cause

---

### ❌ Attempt 2: Added SDK Version Definitions
**What:** Added to `android/build.gradle`:
```gradle
ext {
  minSdkVersion = 23
  targetSdkVersion = 34
  compileSdkVersion = 34
  buildToolsVersion = "34.0.0"
  ndkVersion = "27.0.12077973"
}
```

**Result:** Build failed - different error about react-native-iap flavors
**Why It Didn't Work:** Fixed SDK issue but exposed the IAP issue

---

### ❌ Attempt 3: Added Product Flavors to App
**What:** Added to `android/app/build.gradle`:
```gradle
flavorDimensions "store"
productFlavors {
    play {
        dimension "store"
    }
}
```

**Result:** Build still failed - flavor ambiguity
**Why It Didn't Work:** Library needs `missingDimensionStrategy`, not just flavors

---

### ❌ Attempt 4: Added missingDimensionStrategy Manually
**What:** Added to `android/app/build.gradle` in `defaultConfig`:
```gradle
missingDimensionStrategy 'store', 'play'
```

**Result:** Build failed - prebuild overwrote our changes
**Why It Didn't Work:** EAS runs `prebuild` which regenerates android directory

---

### ❌ Attempt 5: Added gradleCommand to eas.json
**What:** Added to `eas.json`:
```json
"android": {
  "buildType": "app-bundle",
  "gradleCommand": ":app:bundlePlayRelease"
}
```

**Result:** Build failed - still had flavor ambiguity
**Why It Didn't Work:** Gradle command doesn't fix missing strategy

---

### ❌ Attempt 6: Created Postinstall Script
**What:** Created `scripts/fix-iap-gradle.js` to patch `node_modules/react-native-iap/android/build.gradle`

**Result:** Build failed - doesn't help with app configuration
**Why It Didn't Work:** Library already has flavors; app needs the strategy

---

### ❌ Attempt 7: Created Custom Expo Config Plugin
**What:** Created `plugins/with-react-native-iap-fix.js` to inject `missingDimensionStrategy` during prebuild

**Result:** Plugin ran locally but failed on EAS - regex issues, insertion errors
**Why It Didn't Work:** Complex regex matching, hard to debug on EAS

---

### ❌ Attempt 8: Created Post-Prebuild Script
**What:** Created `scripts/post-prebuild-fix.js` to run after prebuild in eas.json:
```json
"prebuildCommand": "npx expo prebuild --clean && node scripts/post-prebuild-fix.js"
```

**Result:** Prebuild phase failed - script path issues
**Why It Didn't Work:** EAS prebuild environment differs from local

---

### ❌ Attempt 9: Used Official react-native-iap Plugin (UNCONFIGURED)
**What:** Added to `app.config.js`:
```javascript
plugins: [
  "react-native-iap"  // ❌ NO CONFIGURATION
]
```

**Result:** Build failed - plugin needs `paymentProvider` option
**Why It Didn't Work:** Plugin didn't run without config

---

### ❌ Attempt 10: Configured Official Plugin
**What:** Changed to:
```javascript
plugins: [
  [
    "react-native-iap",
    {
      paymentProvider: "Play Store"
    }
  ]
]
```

**Result:** Build failed with NEW error:
```
Could not set unknown property 'supportLibVersion' for root project 'GUILD'
```

**Why It Didn't Work:** Plugin adds `supportLibVersion` at LINE 1 of `android/build.gradle` because there's no `ext` block

---

### ❌ Attempt 11: Removed supportLibVersion Line Manually
**What:** Deleted `supportLibVersion = "28.0.0"` from line 1 of `android/build.gradle`

**Result:** Would fail again - prebuild re-adds it because plugin always tries to add it
**Why It Didn't Work:** Plugin runs during prebuild and always adds the line

---

## 🎯 WHAT WE LEARNED

### From Plugin Source Code (`node_modules/react-native-iap/plugin/build/withIAP.js`):
```javascript
const modifyProjectBuildGradle = (buildGradle) => {
    const supportLibVersion = `supportLibVersion = "28.0.0"`;
    if (buildGradle.includes(supportLibVersion)) {
        return buildGradle;
    }
    return addToBuildGradle(supportLibVersion, 'ext', 1, buildGradle);
    //                                         ^^^^^ Looks for 'ext'!
};
```

The plugin:
1. Looks for an `ext` block in `android/build.gradle`
2. Tries to add `supportLibVersion` after the `ext` line
3. If `ext` doesn't exist, the `findIndex` returns -1
4. Adding at index -1 + 1 = 0 means it adds at LINE 1
5. Result: Invalid Gradle syntax

### Our Current `android/build.gradle`:
```gradle
// Top-level build file where you can add configuration options common to all sub-projects/modules.

buildscript {
  repositories {
    google()
    mavenCentral()
  }
  dependencies {
    classpath('com.android.tools.build:gradle')
    classpath('com.facebook.react:react-native-gradle-plugin')
    classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')
  }
}

allprojects {
  repositories {
    google()
    mavenCentral()
    maven { url 'https://www.jitpack.io' }
  }
}

apply plugin: "expo-root-project"
apply plugin: "com.facebook.react.rootproject"
```

**Problem:** No `ext` block exists!

---

## ✅ WHAT WE WANT TO TRY NEXT

### **SOLUTION: Add `ext` Block**

Change `android/build.gradle` from:
```gradle
// Top-level build file...

buildscript {
  // ...
}

allprojects {
  // ...
}
```

To:
```gradle
// Top-level build file...

buildscript {
  repositories {
    google()
    mavenCentral()
  }
  dependencies {
    classpath('com.android.tools.build:gradle')
    classpath('com.facebook.react:react-native-gradle-plugin')
    classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')
  }
}

ext {
  // react-native-iap plugin will add supportLibVersion here
}

allprojects {
  repositories {
    google()
    mavenCentral()
    maven { url 'https://www.jitpack.io' }
  }
}

apply plugin: "expo-root-project"
apply plugin: "com.facebook.react.rootproject"
```

**Expected Result:**
When `expo prebuild` runs:
1. Plugin finds the `ext` block
2. Adds `supportLibVersion = "28.0.0"` INSIDE the ext block
3. Valid Gradle syntax: `ext { supportLibVersion = "28.0.0" }`
4. Plugin also adds `missingDimensionStrategy "store", "play"` to app/build.gradle
5. Build succeeds! ✅

---

## 📊 WHY THIS WILL WORK

1. **Plugin expects `ext` block** - source code shows it searches for `'ext'`
2. **Common Gradle pattern** - most projects have ext blocks
3. **We removed the block** - when we cleaned up, we removed SDK definitions
4. **Plugin has no fallback** - if ext doesn't exist, it breaks
5. **Minimal change** - just 3 lines added
6. **Works with official plugin** - no custom code needed

---

## 🎯 STEP-BY-STEP IMPLEMENTATION PLAN

1. **Edit `android/build.gradle`**
   - Add `ext {}` block after `buildscript` and before `allprojects`

2. **Keep plugin configured in `app.config.js`**
   ```javascript
   ["react-native-iap", { paymentProvider: "Play Store" }]
   ```

3. **Run locally**
   ```bash
   npx expo prebuild --clean --platform android
   ```

4. **Verify**
   - Check `android/build.gradle` has `ext { supportLibVersion = "28.0.0" }`
   - Check `android/app/build.gradle` has `missingDimensionStrategy "store", "play"`

5. **Build on EAS**
   ```bash
   eas build --platform android --profile production
   ```

6. **Expected outcome:** ✅ Build succeeds

---

## 📝 FILES INVOLVED

### Current State:
- `app.config.js` - Has plugin: `["react-native-iap", { paymentProvider: "Play Store" }]` ✅
- `android/build.gradle` - Missing `ext` block ❌
- `android/app/build.gradle` - Will get `missingDimensionStrategy` from plugin ✅
- `eas.json` - Configured correctly ✅
- `package.json` - Has `react-native-iap` dependency ✅

### What Needs to Change:
- **ONLY** `android/build.gradle` - add `ext {}` block

---

## 🚫 WHAT WE'LL AVOID

1. ❌ Don't create more custom plugins
2. ❌ Don't patch node_modules
3. ❌ Don't add postinstall scripts
4. ❌ Don't modify prebuild commands
5. ❌ Don't manually edit android files that get overwritten
6. ❌ Don't try complex regex solutions
7. ❌ Don't build until local test passes

---

## 💡 CONFIDENCE LEVEL: 95%

**Why we're confident:**
- ✅ Found exact error in build logs
- ✅ Read plugin source code
- ✅ Understand what plugin expects
- ✅ Solution matches plugin's requirements
- ✅ Minimal change (3 lines)
- ✅ Follows Gradle conventions
- ✅ No custom workarounds needed

**Risk:**
- 5% chance of other issues after this fix
- But we'll see actual new errors if they exist
- Not stuck in same loop anymore

