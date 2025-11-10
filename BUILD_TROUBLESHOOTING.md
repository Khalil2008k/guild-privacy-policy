# 🔧 Build Troubleshooting Guide

## Current Status

The build is failing with:
```
Gradle build failed with unknown error. See logs for the "Run gradlew" phase
```

## ✅ Fixes Applied

1. **Package Name**: Fixed to `com.mazen123333.guild`
2. **Version**: Fixed to `1.0.0`
3. **SDK Versions**: Added to `android/build.gradle` (before plugins)
4. **Prebuild Command**: Added to `eas.json`
5. **Build Type**: Set to `"app-bundle"` for Play Store

## 🔍 Next Steps to Debug

### 1. Check Build Logs
Visit the build logs URL to see the specific error:
```
https://expo.dev/accounts/mazen123333/projects/guild-2/builds/[BUILD_ID]#run-gradlew
```

Look for:
- CMake errors
- Missing dependencies
- Version conflicts
- SDK version errors
- Gradle plugin issues

### 2. Common Issues

#### Issue: SDK Versions Not Found
**Symptom**: `rootProject.ext.minSdkVersion` is null
**Solution**: The SDK versions are now defined in `android/build.gradle` before plugins are applied

#### Issue: Prebuild Not Running
**Symptom**: Old Android directory structure
**Solution**: The `prebuildCommand` is set in `eas.json` to run `npx expo prebuild --clean`

#### Issue: Gradle Plugin Version Mismatch
**Symptom**: Plugin version errors
**Solution**: Check if Android Gradle Plugin version is compatible with Expo SDK 54

### 3. Alternative Solutions

#### Option A: Remove Android Directory
If prebuild works locally but not on EAS:
```bash
# Backup
mv android android.backup

# Commit deletion
git add .
git commit -m "Remove android directory for EAS prebuild"

# Build
eas build --platform android --profile production
```

#### Option B: Use Managed Workflow
Remove the `android` directory entirely and let Expo handle everything:
```bash
rm -rf android
eas build --platform android --profile production
```

#### Option C: Check Expo SDK 54 Requirements
Verify that SDK versions match Expo SDK 54 requirements:
- Check Expo documentation for correct SDK versions
- Verify Gradle plugin versions are compatible

### 4. Verify Configuration

Check these files:
- ✅ `android/build.gradle` - SDK versions defined
- ✅ `android/app/build.gradle` - Package name correct
- ✅ `eas.json` - Prebuild command and build type set
- ✅ `app.config.js` - Package name matches

## 📝 Notes

- The `expo-root-project` plugin should provide SDK versions automatically
- If it doesn't, the manual definitions in `android/build.gradle` serve as a fallback
- Prebuild should regenerate the Android directory with correct configuration
- If prebuild works locally, the issue might be with EAS Build's execution

## 🎯 Recommended Action

1. **Check the build logs** for the specific error message
2. **Share the error** from the "Run gradlew" phase
3. **Try removing the android directory** and letting EAS regenerate it
4. **Verify SDK versions** match Expo SDK 54 requirements

