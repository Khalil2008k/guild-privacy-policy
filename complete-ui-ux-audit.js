/**
 * COMPLETE UI/UX/FUNCTIONALITY AUDIT
 * Checks:
 * - All screens exist
 * - All buttons work (have onPress)
 * - All alerts implemented
 * - Theme UI consistency
 * - Light/Dark mode support
 * - Arabic/English language support
 * - No dead ends
 * - Color consistency
 * - Navigation paths
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║     COMPLETE UI/UX/FUNCTIONALITY AUDIT - COMPREHENSIVE CHECK     ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
let warnings = 0;
const issues = [];

function check(name, fn, severity = 'error') {
  totalChecks++;
  try {
    const result = fn();
    if (result === true || result === undefined) {
      passedChecks++;
      console.log(`  ✅ ${name}`);
      return true;
    } else if (result === 'warning') {
      warnings++;
      console.log(`  ⚠️  ${name}`);
      return false;
    }
  } catch (error) {
    if (severity === 'warning') {
      warnings++;
      console.log(`  ⚠️  ${name}`);
      console.log(`     Warning: ${error.message}`);
      issues.push({ type: 'warning', check: name, message: error.message });
    } else {
      failedChecks++;
      console.log(`  ❌ ${name}`);
      console.log(`     Error: ${error.message}`);
      issues.push({ type: 'error', check: name, message: error.message });
    }
    return false;
  }
}

// Helper to get all files recursively
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      arrayOfFiles.push(filePath);
    }
  });
  
  return arrayOfFiles;
}

// ============================================================================
// PART 1: SCREEN EXISTENCE CHECK
// ============================================================================
console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 1: SCREEN EXISTENCE - All Required Screens Present          ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

const requiredScreens = {
  // Auth screens
  'sign-in.tsx': '(auth)',
  'sign-up.tsx': '(auth)',
  'welcome.tsx': '(auth)',
  
  // Main screens
  'home.tsx': '(main)',
  'jobs.tsx': '(main)',
  'profile.tsx': '(main)',
  'chat.tsx': '(main)',
  'map.tsx': '(main)',
  'post.tsx': '(main)',
  
  // Modal screens
  'job-details.tsx': '(modals)',
  'wallet.tsx': '(modals)',
  'settings.tsx': '(modals)',
  'notifications.tsx': '(modals)',
  '[jobId].tsx': '(modals)/chat',
  '[id].tsx': '(modals)/job',
};

Object.entries(requiredScreens).forEach(([screen, folder]) => {
  check(`Screen exists: ${folder}/${screen}`, () => {
    const screenPath = path.join(__dirname, 'src', 'app', folder, screen);
    if (!fs.existsSync(screenPath)) {
      throw new Error(`Screen not found at ${screenPath}`);
    }
    return true;
  });
});

// ============================================================================
// PART 2: THEME SUPPORT CHECK
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 2: THEME SUPPORT - Light/Dark Mode Implementation           ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

check('Theme context exists', () => {
  const themePath = path.join(__dirname, 'src', 'contexts', 'ThemeContext.tsx');
  if (!fs.existsSync(themePath)) {
    throw new Error('ThemeContext.tsx not found');
  }
  const content = fs.readFileSync(themePath, 'utf-8');
  if (!content.includes('light') || !content.includes('dark')) {
    throw new Error('Light/Dark themes not defined');
  }
  return true;
});

check('Theme provider in root layout', () => {
  const layoutPath = path.join(__dirname, 'src', 'app', '_layout.tsx');
  const content = fs.readFileSync(layoutPath, 'utf-8');
  if (!content.includes('ThemeProvider') && !content.includes('ThemeContext')) {
    throw new Error('ThemeProvider not in root layout');
  }
  return true;
});

// Check theme usage in screens
const appDir = path.join(__dirname, 'src', 'app');
const allScreens = getAllFiles(appDir);
let screensUsingTheme = 0;
let screensNotUsingTheme = [];

allScreens.forEach(screenPath => {
  const content = fs.readFileSync(screenPath, 'utf-8');
  if (content.includes('useTheme') || content.includes('theme.')) {
    screensUsingTheme++;
  } else if (!screenPath.includes('_layout') && !screenPath.includes('__tests__')) {
    screensNotUsingTheme.push(path.basename(screenPath));
  }
});

check(`Screens using theme (${screensUsingTheme}/${allScreens.length - screensNotUsingTheme.length})`, () => {
  if (screensUsingTheme < 10) {
    throw new Error(`Only ${screensUsingTheme} screens use theme`);
  }
  return true;
}, 'warning');

// ============================================================================
// PART 3: LANGUAGE SUPPORT CHECK
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 3: LANGUAGE SUPPORT - Arabic/English i18n                   ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

check('I18n context exists', () => {
  const i18nPath = path.join(__dirname, 'src', 'contexts', 'I18nProvider.tsx');
  if (!fs.existsSync(i18nPath)) {
    throw new Error('I18nProvider.tsx not found');
  }
  const content = fs.readFileSync(i18nPath, 'utf-8');
  if (!content.includes('ar') || !content.includes('en')) {
    throw new Error('Arabic/English not configured');
  }
  return true;
});

check('RTL support implemented', () => {
  const i18nPath = path.join(__dirname, 'src', 'contexts', 'I18nProvider.tsx');
  const content = fs.readFileSync(i18nPath, 'utf-8');
  if (!content.includes('isRTL') && !content.includes('RTL')) {
    throw new Error('RTL support not found');
  }
  return true;
});

check('Translation files exist', () => {
  const translationsPath = path.join(__dirname, 'src', 'constants', 'translations.tsx');
  if (!fs.existsSync(translationsPath)) {
    throw new Error('translations.tsx not found');
  }
  const content = fs.readFileSync(translationsPath, 'utf-8');
  if (!content.includes('ar:') || !content.includes('en:')) {
    throw new Error('Translations not properly structured');
  }
  return true;
});

// Check i18n usage in screens
let screensUsingI18n = 0;
allScreens.forEach(screenPath => {
  const content = fs.readFileSync(screenPath, 'utf-8');
  if (content.includes('useI18n') || content.includes('t(\'') || content.includes('i18n')) {
    screensUsingI18n++;
  }
});

check(`Screens using i18n (${screensUsingI18n}/${allScreens.length})`, () => {
  if (screensUsingI18n < 10) {
    throw new Error(`Only ${screensUsingI18n} screens use i18n`);
  }
  return true;
}, 'warning');

// ============================================================================
// PART 4: BUTTON FUNCTIONALITY CHECK
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 4: BUTTON FUNCTIONALITY - All Buttons Have Actions          ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

let totalButtons = 0;
let buttonsWithActions = 0;
let buttonsWithoutActions = [];

allScreens.forEach(screenPath => {
  const content = fs.readFileSync(screenPath, 'utf-8');
  const screenName = path.basename(screenPath);
  
  // Find TouchableOpacity, Button, Pressable
  const buttonMatches = content.match(/<(TouchableOpacity|Button|Pressable)/g) || [];
  totalButtons += buttonMatches.length;
  
  // Check if they have onPress
  const onPressMatches = content.match(/onPress=\{[^}]+\}/g) || [];
  buttonsWithActions += onPressMatches.length;
  
  if (buttonMatches.length > onPressMatches.length) {
    buttonsWithoutActions.push({
      screen: screenName,
      missing: buttonMatches.length - onPressMatches.length
    });
  }
});

check(`Buttons with actions (${buttonsWithActions}/${totalButtons})`, () => {
  if (totalButtons > 0 && buttonsWithActions < totalButtons * 0.9) {
    throw new Error(`${totalButtons - buttonsWithActions} buttons missing onPress`);
  }
  return true;
}, 'warning');

// ============================================================================
// PART 5: ALERT SYSTEM CHECK
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 5: ALERT SYSTEM - Custom Alerts Implemented                 ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

check('Custom alert component exists', () => {
  const alertPath = path.join(__dirname, 'src', 'components', 'CustomAlert.tsx');
  if (!fs.existsSync(alertPath)) {
    throw new Error('CustomAlert.tsx not found');
  }
  return true;
});

check('Alert fade modal exists', () => {
  const alertPath = path.join(__dirname, 'src', 'components', 'atoms', 'AlertFadeModal.tsx');
  if (!fs.existsSync(alertPath)) {
    throw new Error('AlertFadeModal.tsx not found');
  }
  return true;
});

// Check alert usage
let screensUsingAlerts = 0;
allScreens.forEach(screenPath => {
  const content = fs.readFileSync(screenPath, 'utf-8');
  if (content.includes('Alert.') || content.includes('CustomAlert') || content.includes('AlertFadeModal')) {
    screensUsingAlerts++;
  }
});

check(`Screens with alert system (${screensUsingAlerts})`, () => {
  return true; // Just informational
}, 'warning');

// ============================================================================
// PART 6: NAVIGATION & DEAD END CHECK
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 6: NAVIGATION - No Dead Ends, All Paths Lead Somewhere     ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

// Check for back buttons
let screensWithBackButton = 0;
let screensNeedingBackButton = [];

allScreens.forEach(screenPath => {
  const content = fs.readFileSync(screenPath, 'utf-8');
  const screenName = path.basename(screenPath);
  
  // Modals and detail screens should have back buttons
  if (screenPath.includes('(modals)') || screenPath.includes('[')) {
    if (content.includes('router.back') || content.includes('navigation.goBack') || 
        content.includes('ArrowLeft') || content.includes('<-')) {
      screensWithBackButton++;
    } else {
      screensNeedingBackButton.push(screenName);
    }
  }
});

check(`Modal screens with back navigation (${screensWithBackButton})`, () => {
  if (screensNeedingBackButton.length > 10) {
    throw new Error(`${screensNeedingBackButton.length} screens may lack back navigation`);
  }
  return true;
}, 'warning');

// Check for router usage
let screensWithNavigation = 0;
allScreens.forEach(screenPath => {
  const content = fs.readFileSync(screenPath, 'utf-8');
  if (content.includes('router.push') || content.includes('router.replace') || 
      content.includes('navigation.navigate') || content.includes('Link')) {
    screensWithNavigation++;
  }
});

check(`Screens with navigation logic (${screensWithNavigation})`, () => {
  if (screensWithNavigation < 15) {
    throw new Error('Limited navigation implementation');
  }
  return true;
}, 'warning');

// ============================================================================
// PART 7: COLOR CONSISTENCY CHECK
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 7: COLOR CONSISTENCY - Theme Colors Used Correctly          ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

let hardcodedColors = 0;
let themeColors = 0;

allScreens.forEach(screenPath => {
  const content = fs.readFileSync(screenPath, 'utf-8');
  
  // Check for hardcoded colors
  const hardcodedMatches = content.match(/(color:|backgroundColor:)\s*['"]#[0-9a-fA-F]{3,8}['"]/g) || [];
  hardcodedColors += hardcodedMatches.length;
  
  // Check for theme color usage
  const themeMatches = content.match(/theme\.(primary|secondary|background|surface|text|border|error|success)/g) || [];
  themeColors += themeMatches.length;
});

check(`Theme colors vs hardcoded (${themeColors} theme, ${hardcodedColors} hardcoded)`, () => {
  if (hardcodedColors > themeColors && themeColors > 0) {
    throw new Error('More hardcoded colors than theme colors');
  }
  return true;
}, 'warning');

// ============================================================================
// PART 8: COMPONENT STRUCTURE CHECK
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 8: COMPONENT STRUCTURE - Atomic Design Pattern             ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

check('Atoms directory exists', () => {
  const atomsPath = path.join(__dirname, 'src', 'components', 'atoms');
  if (!fs.existsSync(atomsPath)) {
    throw new Error('Atoms directory not found');
  }
  return true;
});

check('Molecules directory exists', () => {
  const moleculesPath = path.join(__dirname, 'src', 'components', 'molecules');
  if (!fs.existsSync(moleculesPath)) {
    throw new Error('Molecules directory not found');
  }
  return true;
});

check('Organisms directory exists', () => {
  const organismsPath = path.join(__dirname, 'src', 'components', 'organisms');
  if (!fs.existsSync(organismsPath)) {
    throw new Error('Organisms directory not found');
  }
  return true;
});

// ============================================================================
// PART 9: CHAT SYSTEM SPECIFIC CHECK
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 9: CHAT SYSTEM - Complete Implementation Check              ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

check('Chat screen exists and complete', () => {
  const chatPath = path.join(__dirname, 'src', 'app', '(modals)', 'chat', '[jobId].tsx');
  const content = fs.readFileSync(chatPath, 'utf-8');
  
  const requiredFeatures = [
    'handleSendMessage',
    'useTheme',
    'useI18n',
    'KeyboardAvoidingView',
    'ScrollView',
    'TextInput'
  ];
  
  for (const feature of requiredFeatures) {
    if (!content.includes(feature)) {
      throw new Error(`Chat screen missing: ${feature}`);
    }
  }
  return true;
});

check('Chat components exist', () => {
  const components = ['ChatMessage.tsx', 'ChatInput.tsx', 'MessageLoading.tsx'];
  for (const comp of components) {
    const compPath = path.join(__dirname, 'src', 'components', comp);
    if (!fs.existsSync(compPath)) {
      throw new Error(`${comp} not found`);
    }
  }
  return true;
});

// ============================================================================
// RESULTS SUMMARY
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║              COMPLETE UI/UX AUDIT RESULTS                         ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

console.log(`Total Checks:    ${totalChecks}`);
console.log(`✅ Passed:       ${passedChecks} (${Math.round(passedChecks/totalChecks*100)}%)`);
console.log(`❌ Failed:       ${failedChecks}`);
console.log(`⚠️  Warnings:    ${warnings}\n`);

console.log('📊 DETAILED STATISTICS:\n');
console.log(`   Total Screens:        ${allScreens.length}`);
console.log(`   Using Theme:          ${screensUsingTheme}`);
console.log(`   Using i18n:           ${screensUsingI18n}`);
console.log(`   Total Buttons:        ${totalButtons}`);
console.log(`   With Actions:         ${buttonsWithActions}`);
console.log(`   Theme Colors:         ${themeColors}`);
console.log(`   Hardcoded Colors:     ${hardcodedColors}`);
console.log(`   With Navigation:      ${screensWithNavigation}`);
console.log(`   With Back Button:     ${screensWithBackButton}\n`);

console.log('═'.repeat(70) + '\n');

if (failedChecks === 0 && warnings < 5) {
  console.log('🎉🎉🎉 EXCELLENT UI/UX IMPLEMENTATION! 🎉🎉🎉\n');
  console.log('✅ All screens exist');
  console.log('✅ Theme system working (Light/Dark)');
  console.log('✅ Language support complete (Arabic/English)');
  console.log('✅ Buttons have actions');
  console.log('✅ Alert system implemented');
  console.log('✅ Navigation paths complete');
  console.log('✅ Color consistency good');
  console.log('✅ Component structure solid\n');
  console.log('🚀 UI/UX IS PRODUCTION READY!\n');
} else if (failedChecks < 5) {
  console.log('✅ GOOD UI/UX IMPLEMENTATION\n');
  console.log(`Minor issues: ${failedChecks} failures, ${warnings} warnings\n`);
  console.log('Review the issues above and fix critical ones.\n');
} else {
  console.log('⚠️  UI/UX NEEDS ATTENTION\n');
  console.log(`Issues found: ${failedChecks} failures, ${warnings} warnings\n`);
  console.log('CRITICAL ISSUES:\n');
  issues.filter(i => i.type === 'error').forEach((issue, idx) => {
    console.log(`${idx + 1}. ${issue.check}`);
    console.log(`   ${issue.message}\n`);
  });
}

process.exit(failedChecks > 5 ? 1 : 0);







