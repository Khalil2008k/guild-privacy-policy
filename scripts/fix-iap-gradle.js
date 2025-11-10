/**
 * Postinstall script to fix react-native-iap product flavor issue
 * This ensures the library's build.gradle has the play flavor configured
 */

const fs = require('fs');
const path = require('path');

const gradlePath = path.join(__dirname, '../node_modules/react-native-iap/android/build.gradle');

// Check if react-native-iap exists
if (!fs.existsSync(gradlePath)) {
  console.log('⚠️  react-native-iap not found, skipping fix');
  process.exit(0);
}

let gradle = fs.readFileSync(gradlePath, 'utf8');

// Check if already patched
if (gradle.includes('flavorDimensions "store"') && gradle.includes('productFlavors')) {
  console.log('✅ react-native-iap build.gradle already has play flavor configured');
  process.exit(0);
}

// Find the android block and add flavor configuration
if (gradle.includes('android {')) {
  // Check if flavorDimensions already exists
  if (!gradle.includes('flavorDimensions')) {
    // Add flavor configuration after android { or after defaultConfig
    const androidBlockMatch = gradle.match(/android\s*\{[\s\S]*?defaultConfig\s*\{[\s\S]*?\}/);
    
    if (androidBlockMatch) {
      // Insert after defaultConfig block
      const flavorConfig = `
    flavorDimensions "store"
    productFlavors {
        play {
            dimension "store"
        }
    }
`;
      
      // Find a good insertion point (after defaultConfig or before buildTypes)
      if (gradle.includes('buildTypes')) {
        gradle = gradle.replace(
          /(\s+)(buildTypes\s*\{)/,
          `${flavorConfig}$1$2`
        );
      } else if (gradle.includes('defaultConfig')) {
        gradle = gradle.replace(
          /(defaultConfig\s*\{[\s\S]*?\})/,
          `$1${flavorConfig}`
        );
      } else {
        // Fallback: add after android {
        gradle = gradle.replace(
          /(android\s*\{)/,
          `$1${flavorConfig}`
        );
      }
      
      fs.writeFileSync(gradlePath, gradle, 'utf8');
      console.log('✅ Patched react-native-iap build.gradle for play flavor');
    } else {
      console.log('⚠️  Could not find android block structure, manual fix may be needed');
    }
  } else {
    console.log('✅ react-native-iap already has flavorDimensions configured');
  }
} else {
  console.log('⚠️  Could not find android block in react-native-iap build.gradle');
}

