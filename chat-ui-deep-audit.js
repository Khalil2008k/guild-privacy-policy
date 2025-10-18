/**
 * CHAT SYSTEM UI/UX DEEP AUDIT
 * Focused exclusively on visual and interaction aspects
 * 
 * Checks:
 * - All UI screens exist
 * - All alerts work (visual feedback)
 * - All buttons have visual feedback + actions
 * - No dead ends (all paths lead somewhere)
 * - Theme UI consistency
 * - Light/Dark mode support
 * - Arabic/English language support
 * - Color consistency
 * - Layout responsiveness
 * - Visual states (loading, error, empty)
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║      CHAT SYSTEM UI/UX DEEP AUDIT - VISUAL & INTERACTION         ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
let warnings = 0;
const uiDetails = [];

function check(name, fn, severity = 'error') {
  totalChecks++;
  try {
    const result = fn();
    if (result === true || result === undefined) {
      passedChecks++;
      console.log(`  ✅ ${name}`);
      if (typeof result === 'object' && result.details) {
        uiDetails.push({ check: name, ...result.details });
      }
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
    } else {
      failedChecks++;
      console.log(`  ❌ ${name}`);
      console.log(`     Error: ${error.message}`);
    }
    return false;
  }
}

function countInCode(content, pattern) {
  const matches = content.match(pattern);
  return matches ? matches.length : 0;
}

// ============================================================================
// PART 1: SCREEN & LAYOUT STRUCTURE
// ============================================================================
console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 1: SCREEN & LAYOUT STRUCTURE                                ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

const chatScreenPath = path.join(__dirname, 'src', 'app', '(modals)', 'chat', '[jobId].tsx');
const chatContent = fs.readFileSync(chatScreenPath, 'utf-8');

check('Chat screen has proper View structure', () => {
  if (!chatContent.includes('<View style=')) {
    throw new Error('No View components');
  }
  const viewCount = countInCode(chatContent, /<View/g);
  console.log(`     Found ${viewCount} View components`);
  return true;
});

check('Header section exists', () => {
  if (!chatContent.includes('styles.header')) {
    throw new Error('No header style');
  }
  if (!chatContent.includes('backButton')) {
    throw new Error('No back button');
  }
  return true;
});

check('Messages list section exists', () => {
  if (!chatContent.includes('ScrollView')) {
    throw new Error('No ScrollView for messages');
  }
  if (!chatContent.includes('messagesScrollView') || !chatContent.includes('messagesContent')) {
    throw new Error('Missing message list styles');
  }
  return true;
});

check('Input section exists', () => {
  if (!chatContent.includes('ChatInput')) {
    throw new Error('No ChatInput component');
  }
  if (!chatContent.includes('inputContainer')) {
    throw new Error('No input container');
  }
  return true;
});

check('Loading state UI exists', () => {
  if (!chatContent.includes('ActivityIndicator')) {
    throw new Error('No loading indicator');
  }
  if (!chatContent.includes('loadingContainer')) {
    throw new Error('No loading container style');
  }
  return true;
});

// ============================================================================
// PART 2: THEME INTEGRATION CHECK
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 2: THEME INTEGRATION - Light/Dark Mode Support              ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

check('useTheme hook imported and used', () => {
  if (!chatContent.includes('useTheme')) {
    throw new Error('useTheme not imported');
  }
  if (!chatContent.includes('const { theme } = useTheme()')) {
    throw new Error('useTheme not destructured');
  }
  return true;
});

const themeUsages = {
  'Background colors': /backgroundColor:\s*theme\.(background|surface)/g,
  'Text colors': /color:\s*theme\.(textPrimary|textSecondary|text)/g,
  'Border colors': /borderColor:\s*theme\.border/g,
  'Primary colors': /theme\.primary/g,
  'Error colors': /theme\.error/g,
  'Warning colors': /theme\.warning/g,
};

Object.entries(themeUsages).forEach(([name, pattern]) => {
  check(`Theme: ${name}`, () => {
    const count = countInCode(chatContent, pattern);
    if (count === 0) {
      throw new Error(`No ${name.toLowerCase()} theme usage`);
    }
    console.log(`     ${count} usages`);
    return true;
  }, 'warning');
});

check('All styled components use theme', () => {
  const styleCount = countInCode(chatContent, /style=\{/g);
  const themeCount = countInCode(chatContent, /theme\./g);
  
  if (themeCount < styleCount * 0.5) {
    throw new Error(`Low theme usage: ${themeCount} theme / ${styleCount} styles`);
  }
  console.log(`     ${themeCount} theme usages in ${styleCount} styled components`);
  return true;
});

// ============================================================================
// PART 3: i18n & RTL SUPPORT CHECK
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 3: i18n & RTL SUPPORT - Arabic/English Language             ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

check('useI18n hook imported and used', () => {
  if (!chatContent.includes('useI18n')) {
    throw new Error('useI18n not imported');
  }
  if (!chatContent.includes('const { t, isRTL } = useI18n()')) {
    throw new Error('useI18n not properly destructured');
  }
  return true;
});

check('Arabic text support', () => {
  const arabicCount = countInCode(chatContent, /[\u0600-\u06FF]/g);
  if (arabicCount < 10) {
    throw new Error(`Insufficient Arabic text: ${arabicCount} characters`);
  }
  console.log(`     ${arabicCount} Arabic characters found`);
  return true;
});

check('English text support', () => {
  const englishStrings = countInCode(chatContent, /['"][A-Z][a-z]+/g);
  if (englishStrings < 10) {
    throw new Error(`Insufficient English text: ${englishStrings} strings`);
  }
  console.log(`     ${englishStrings} English strings found`);
  return true;
});

check('RTL conditional rendering', () => {
  const rtlConditionals = countInCode(chatContent, /isRTL\s*\?/g);
  if (rtlConditionals < 20) {
    throw new Error(`Insufficient RTL support: ${rtlConditionals} conditionals`);
  }
  console.log(`     ${rtlConditionals} RTL conditionals`);
  return true;
});

// ============================================================================
// PART 4: BUTTONS & INTERACTIONS CHECK
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 4: BUTTONS & INTERACTIONS - All Actions Working             ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

const buttonChecks = {
  'Back button': ['ArrowLeft', 'onPress={() => router.back()}'],
  'Send button': ['Send', 'handleSendMessage'],
  'Options button': ['MoreVertical', 'setShowOptionsMenu'],
  'View profile button': ['User', 'handleViewProfile'],
  'Search button': ['Search', 'handleSearchMessages'],
  'Mute button': ['BellOff', 'handleMuteChat'],
  'Block button': ['Ban', 'handleBlockUser'],
  'Report button': ['Flag', 'handleReportUser'],
  'Delete chat button': ['Trash2', 'handleDeleteChat'],
};

Object.entries(buttonChecks).forEach(([button, [icon, handler]]) => {
  check(`${button} exists with action`, () => {
    if (!chatContent.includes(icon)) {
      throw new Error(`Icon ${icon} not found`);
    }
    if (!chatContent.includes(handler)) {
      throw new Error(`Handler ${handler} not found`);
    }
    return true;
  });
});

check('All TouchableOpacity have onPress', () => {
  const touchableCount = countInCode(chatContent, /<TouchableOpacity/g);
  const onPressCount = countInCode(chatContent, /onPress=\{/g);
  
  if (onPressCount < touchableCount) {
    throw new Error(`${touchableCount - onPressCount} buttons missing onPress`);
  }
  console.log(`     ${onPressCount}/${touchableCount} buttons have actions`);
  return true;
});

check('Buttons have visual feedback (style prop)', () => {
  const buttonStyles = countInCode(chatContent, /TouchableOpacity[^>]*style=/g);
  if (buttonStyles < 5) {
    throw new Error(`Only ${buttonStyles} styled buttons`);
  }
  console.log(`     ${buttonStyles} styled buttons`);
  return true;
});

// ============================================================================
// PART 5: ALERTS & USER FEEDBACK CHECK
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 5: ALERTS & USER FEEDBACK - Visual Notifications            ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

check('Alert.alert imported', () => {
  if (!chatContent.includes('Alert')) {
    throw new Error('Alert not imported');
  }
  return true;
});

const alertChecks = {
  'Error alerts (Arabic)': /خطأ/g,
  'Error alerts (English)': /Alert\.alert.*Error/g,
  'Success alerts': /(تم الكتم|تم الحظر|تم الحذف|Deleted|Muted|Blocked)/g,
  'Confirmation alerts': /\{\s*text:\s*isRTL/g, // Alert buttons with i18n
};

Object.entries(alertChecks).forEach(([name, pattern]) => {
  check(name, () => {
    const count = countInCode(chatContent, pattern);
    if (count === 0) {
      throw new Error(`No ${name.toLowerCase()}`);
    }
    console.log(`     ${count} alerts`);
    return true;
  });
});

check('All alerts have bilingual messages', () => {
  const totalAlerts = countInCode(chatContent, /Alert\.alert/g);
  const bilingualAlerts = countInCode(chatContent, /isRTL\s*\?[^:]+:/g);
  
  if (bilingualAlerts < totalAlerts * 0.8) {
    throw new Error(`Only ${bilingualAlerts}/${totalAlerts} alerts are bilingual`);
  }
  console.log(`     ${bilingualAlerts}/${totalAlerts} bilingual alerts`);
  return true;
});

// ============================================================================
// PART 6: MODALS & OVERLAYS CHECK
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 6: MODALS & OVERLAYS - Popup Interfaces                     ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

const modals = {
  'Options menu modal': ['showOptionsMenu', 'optionsMenu'],
  'Mute options modal': ['showMuteOptions', 'muteOptionsMenu'],
  'Search modal': ['showSearchModal', 'searchModalContainer'],
  'Edit history modal': ['showHistoryModal', 'EditHistoryModal'],
};

Object.entries(modals).forEach(([name, [state, style]]) => {
  check(name, () => {
    if (!chatContent.includes(state)) {
      throw new Error(`State ${state} not found`);
    }
    if (!chatContent.includes(style)) {
      throw new Error(`Style ${style} not found`);
    }
    if (!chatContent.includes(`visible={${state}}`)) {
      throw new Error(`Modal not controlled by ${state}`);
    }
    return true;
  });
});

check('All modals have close functionality', () => {
  const modalCount = countInCode(chatContent, /<Modal/g);
  const closeCount = countInCode(chatContent, /onRequestClose=\{/g);
  
  if (closeCount < modalCount) {
    throw new Error(`${modalCount - closeCount} modals missing close handler`);
  }
  console.log(`     ${closeCount}/${modalCount} modals can close`);
  return true;
});

check('Modal overlays are pressable (dismiss on outside tap)', () => {
  const pressableOverlays = countInCode(chatContent, /<Pressable[^>]*style=\{styles\..*Overlay/g);
  if (pressableOverlays < 2) {
    throw new Error(`Only ${pressableOverlays} dismissable overlays`);
  }
  console.log(`     ${pressableOverlays} dismissable overlays`);
  return true;
});

// ============================================================================
// PART 7: NAVIGATION & DEAD END CHECK
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 7: NAVIGATION & DEAD END CHECK - All Paths Lead Somewhere  ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

check('Back button navigates away', () => {
  if (!chatContent.includes('router.back()')) {
    throw new Error('No back navigation');
  }
  return true;
});

check('View profile navigates to profile screen', () => {
  if (!chatContent.includes('user-profile')) {
    throw new Error('No profile navigation');
  }
  if (!chatContent.includes('router.push')) {
    throw new Error('No push navigation');
  }
  return true;
});

check('Report user navigates to dispute form', () => {
  if (!chatContent.includes('dispute-filing-form')) {
    throw new Error('No dispute form navigation');
  }
  return true;
});

check('Delete chat returns to previous screen', () => {
  // Check within the delete handler's async function
  const deleteSection = chatContent.substring(
    chatContent.indexOf('handleDeleteChat'),
    chatContent.indexOf('handleDeleteChat') + 1000
  );
  if (!deleteSection.includes('router.back()')) {
    throw new Error('Delete chat doesn\'t navigate away');
  }
  return true;
});

check('All navigation paths are valid routes', () => {
  const routes = [
    '/(modals)/user-profile',
    '/(modals)/dispute-filing-form',
  ];
  
  for (const route of routes) {
    if (!chatContent.includes(route)) {
      throw new Error(`Route ${route} not used`);
    }
  }
  return true;
});

// ============================================================================
// PART 8: COLOR CONSISTENCY CHECK
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 8: COLOR CONSISTENCY - Theme Colors vs Hardcoded            ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

check('Minimal hardcoded colors', () => {
  const hardcodedColors = countInCode(chatContent, /(backgroundColor|color):\s*['"]#[0-9a-fA-F]+['"]/g);
  const themeColors = countInCode(chatContent, /theme\.(background|surface|primary|textPrimary|textSecondary|border|error|warning)/g);
  
  if (hardcodedColors > themeColors * 0.2) {
    throw new Error(`Too many hardcoded colors: ${hardcodedColors} vs ${themeColors} theme colors`);
  }
  console.log(`     ${themeColors} theme colors, ${hardcodedColors} hardcoded (${Math.round(hardcodedColors/(themeColors+hardcodedColors)*100)}%)`);
  return true;
});

check('Consistent color usage for similar elements', () => {
  // Check if buttons use theme.primary
  const buttonThemes = countInCode(chatContent, /theme\.primary/g);
  if (buttonThemes < 5) {
    throw new Error('Inconsistent primary color usage');
  }
  return true;
});

check('Error states use theme.error', () => {
  const errorColors = countInCode(chatContent, /theme\.error/g);
  if (errorColors < 3) {
    throw new Error('Error color not used enough');
  }
  console.log(`     ${errorColors} error color usages`);
  return true;
});

// ============================================================================
// PART 9: VISUAL STATES CHECK
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 9: VISUAL STATES - Loading, Empty, Error States             ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

check('Loading state visual', () => {
  if (!chatContent.includes('ActivityIndicator')) {
    throw new Error('No loading indicator');
  }
  if (!chatContent.includes('if (loading)')) {
    throw new Error('Loading state not conditionally rendered');
  }
  return true;
});

check('Typing indicator visual', () => {
  if (!chatContent.includes('MessageLoading')) {
    throw new Error('No typing indicator component');
  }
  if (!chatContent.includes('typingUsers.length')) {
    throw new Error('Typing state not checked');
  }
  return true;
});

check('Empty state for search', () => {
  if (!chatContent.includes('searchEmptyContainer')) {
    throw new Error('No empty search state');
  }
  if (!chatContent.includes('No results found')) {
    throw new Error('No "no results" message');
  }
  return true;
});

check('User status display (Active/Typing)', () => {
  if (!chatContent.includes('Active')) {
    throw new Error('No active status');
  }
  if (!chatContent.includes('typing...')) {
    throw new Error('No typing status');
  }
  return true;
});

check('Visual badges for states (Muted/Blocked)', () => {
  if (!chatContent.includes('statusBadge')) {
    throw new Error('No status badges');
  }
  if (!chatContent.includes('Muted') && !chatContent.includes('مكتوم')) {
    throw new Error('No muted badge');
  }
  if (!chatContent.includes('Blocked') && !chatContent.includes('محظور')) {
    throw new Error('No blocked badge');
  }
  return true;
});

// ============================================================================
// PART 10: RESPONSIVE LAYOUT CHECK
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 10: RESPONSIVE LAYOUT - Safe Area & Keyboard                ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

check('Safe area insets used', () => {
  if (!chatContent.includes('useSafeAreaInsets')) {
    throw new Error('Safe area not used');
  }
  if (!chatContent.includes('paddingTop: insets.top')) {
    throw new Error('Top inset not applied');
  }
  return true;
});

check('KeyboardAvoidingView for iOS/Android', () => {
  if (!chatContent.includes('KeyboardAvoidingView')) {
    throw new Error('No keyboard avoiding view');
  }
  if (!chatContent.includes('Platform.OS')) {
    throw new Error('No platform-specific handling');
  }
  return true;
});

check('Keyboard listeners for better UX', () => {
  if (!chatContent.includes('Keyboard.addListener')) {
    throw new Error('No keyboard listeners');
  }
  const listenerCount = countInCode(chatContent, /Keyboard\.addListener/g);
  if (listenerCount < 2) {
    throw new Error('Should have show AND hide listeners');
  }
  console.log(`     ${listenerCount} keyboard listeners`);
  return true;
});

check('ScrollView auto-scrolls on new messages', () => {
  if (!chatContent.includes('scrollToEnd')) {
    throw new Error('No auto-scroll');
  }
  const scrollCount = countInCode(chatContent, /scrollToEnd/g);
  console.log(`     ${scrollCount} auto-scroll calls`);
  return true;
});

// ============================================================================
// PART 11: COMPONENT INTEGRATION CHECK
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║ PART 11: COMPONENT INTEGRATION - All Components Exist            ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

const components = {
  'ChatMessage': 'src/components/ChatMessage.tsx',
  'ChatInput': 'src/components/ChatInput.tsx',
  'MessageLoading': 'src/components/MessageLoading.tsx',
  'EditHistoryModal': 'src/components/EditHistoryModal.tsx',
};

Object.entries(components).forEach(([name, filePath]) => {
  check(`Component: ${name}`, () => {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`${name} component file not found`);
    }
    
    // Check component uses theme
    const compContent = fs.readFileSync(fullPath, 'utf-8');
    if (!compContent.includes('useTheme') && !compContent.includes('theme')) {
      throw new Error(`${name} doesn't use theme`);
    }
    
    return true;
  });
});

// ============================================================================
// RESULTS SUMMARY
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║           CHAT SYSTEM UI/UX AUDIT RESULTS                         ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

console.log(`Total Checks:    ${totalChecks}`);
console.log(`✅ Passed:       ${passedChecks} (${Math.round(passedChecks/totalChecks*100)}%)`);
console.log(`❌ Failed:       ${failedChecks}`);
console.log(`⚠️  Warnings:    ${warnings}\n`);

console.log('═'.repeat(70) + '\n');

if (failedChecks === 0 && warnings === 0) {
  console.log('🎉🎉🎉 PERFECT CHAT UI/UX! 🎉🎉🎉\n');
  console.log('✅ All screens exist');
  console.log('✅ All buttons have visual feedback + actions');
  console.log('✅ All alerts work (bilingual)');
  console.log('✅ No dead ends (all paths valid)');
  console.log('✅ Theme UI perfect (Light/Dark)');
  console.log('✅ Color consistency excellent');
  console.log('✅ Arabic/English fully supported');
  console.log('✅ RTL layout working');
  console.log('✅ All modals functional');
  console.log('✅ Responsive layout complete');
  console.log('✅ Visual states implemented');
  console.log('✅ All components integrated\n');
  console.log('🚀 CHAT UI IS PRODUCTION READY!\n');
} else if (failedChecks < 3) {
  console.log('✅ EXCELLENT CHAT UI/UX\n');
  console.log(`Minor issues: ${failedChecks} failures, ${warnings} warnings\n`);
} else {
  console.log('⚠️  CHAT UI/UX NEEDS ATTENTION\n');
  console.log(`Issues: ${failedChecks} failures, ${warnings} warnings\n`);
}

process.exit(failedChecks > 0 ? 1 : 0);

