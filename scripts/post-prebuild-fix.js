/**
 * Post-prebuild script to fix react-native-iap product flavor issue
 * This runs AFTER expo prebuild to re-apply our fixes
 */

const fs = require('fs');
const path = require('path');

const buildGradlePath = path.join(__dirname, '../android/app/build.gradle');

if (!fs.existsSync(buildGradlePath)) {
  console.log('⚠️  android/app/build.gradle not found, skipping post-prebuild fix');
  process.exit(0);
}

let gradle = fs.readFileSync(buildGradlePath, 'utf8');
let modified = false;

// 1. Add missingDimensionStrategy to defaultConfig
if (!gradle.includes("missingDimensionStrategy 'store', 'play'")) {
  // Find defaultConfig block and add missingDimensionStrategy
  if (gradle.includes('defaultConfig')) {
    gradle = gradle.replace(
      /(defaultConfig\s*\{[\s\S]*?)(buildConfigField[^\}]*\})/,
      `$1$2
        
        // Resolve react-native-iap flavor ambiguity by preferring play flavor
        missingDimensionStrategy 'store', 'play'`
    );
    modified = true;
    console.log('✅ Added missingDimensionStrategy to defaultConfig');
  }
}

// 2. Add product flavors if not present
if (!gradle.includes('flavorDimensions "store"')) {
  // Find androidResources block and add flavors after it
  if (gradle.includes('androidResources')) {
    gradle = gradle.replace(
      /(androidResources\s*\{[^\}]*\})/,
      `$1
    
    // Configure product flavors to match react-native-iap's play flavor
    flavorDimensions "store"
    productFlavors {
        play {
            dimension "store"
        }
    }`
    );
    modified = true;
    console.log('✅ Added product flavors configuration');
  } else {
    // Fallback: add before closing android block
    gradle = gradle.replace(
      /(\s+)(androidResources\s*\{[^\}]*\})/,
      `$1$2
    
    // Configure product flavors to match react-native-iap's play flavor
    flavorDimensions "store"
    productFlavors {
        play {
            dimension "store"
        }
    }`
    );
    modified = true;
    console.log('✅ Added product flavors configuration (fallback)');
  }
}

if (modified) {
  fs.writeFileSync(buildGradlePath, gradle, 'utf8');
  console.log('✅ Post-prebuild fix applied successfully');
} else {
  console.log('✅ Post-prebuild fix already applied');
}

