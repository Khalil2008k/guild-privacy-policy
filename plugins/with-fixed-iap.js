/**
 * Expo Config Plugin: Fix react-native-iap supportLibVersion injection
 * 
 * PROBLEM: react-native-iap plugin injects supportLibVersion at line 1 if no ext block exists
 * SOLUTION: This plugin runs AFTER IAP plugin and fixes the pollution
 * 
 * Steps:
 * 1. Remove supportLibVersion from line 1 (if present)
 * 2. Ensure ext {} block exists after buildscript
 * 3. Move supportLibVersion inside ext block
 */

const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withFixedIAP(config) {
  return withProjectBuildGradle(config, (config) => {
    let buildGradle = config.modResults.contents;

    console.log('🔧 [with-fixed-iap] Fixing react-native-iap supportLibVersion injection...');

    // Step 1: Check if supportLibVersion is at line 1 (the pollution)
    const hasPollution = buildGradle.match(/^supportLibVersion\s*=\s*"[^"]*"\s*\n/);
    
    if (hasPollution) {
      console.log('🧹 [with-fixed-iap] Found supportLibVersion pollution at line 1, cleaning up...');
      // Remove it from line 1
      buildGradle = buildGradle.replace(/^supportLibVersion\s*=\s*"[^"]*"\s*\n/, '');
    }

    // Step 2: Ensure ext block exists
    if (!buildGradle.includes('ext {')) {
      console.log('📦 [with-fixed-iap] Adding ext {} block after buildscript...');
      
      buildGradle = buildGradle.replace(
        /(buildscript\s*{[\s\S]*?^})/m,
        '$1\n\next {\n  supportLibVersion = "28.0.0"\n}\n'
      );
      
      console.log('✅ [with-fixed-iap] ext {} block added with supportLibVersion inside');
    } else {
      // ext block exists, ensure supportLibVersion is inside
      if (!buildGradle.includes('supportLibVersion')) {
        console.log('📦 [with-fixed-iap] Adding supportLibVersion inside existing ext block...');
        buildGradle = buildGradle.replace(
          /ext\s*{\s*\n/,
          'ext {\n  supportLibVersion = "28.0.0"\n'
        );
      } else {
        console.log('✅ [with-fixed-iap] supportLibVersion already inside ext block');
      }
    }

    config.modResults.contents = buildGradle;
    console.log('✅ [with-fixed-iap] Build.gradle fix complete!');

    return config;
  });
};

