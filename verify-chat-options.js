/**
 * Verification Script for Chat Options
 * Run this to verify all chat options are properly configured
 */

const fs = require('fs');
const path = require('path');

const checks = [];
let passed = 0;
let failed = 0;

function check(name, condition, details = '') {
  const result = { name, passed: condition, details };
  checks.push(result);
  
  if (condition) {
    passed++;
    console.log(`✅ ${name}`);
  } else {
    failed++;
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
  }
}

console.log('\n🔍 Verifying Chat Options Implementation...\n');

// Check 1: User Profile Screen exists
const userProfilePath = path.join(__dirname, 'src', 'app', '(modals)', 'user-profile', '[userId].tsx');
check(
  'User Profile Screen exists',
  fs.existsSync(userProfilePath),
  `File not found: ${userProfilePath}`
);

// Check 2: Chat Options Service exists
const chatOptionsServicePath = path.join(__dirname, 'src', 'services', 'chatOptionsService.ts');
check(
  'Chat Options Service exists',
  fs.existsSync(chatOptionsServicePath),
  `File not found: ${chatOptionsServicePath}`
);

// Check 3: Message Search Service exists
const messageSearchServicePath = path.join(__dirname, 'src', 'services', 'messageSearchService.ts');
check(
  'Message Search Service exists',
  fs.existsSync(messageSearchServicePath),
  `File not found: ${messageSearchServicePath}`
);

// Check 4: Chat screen has all required imports
const chatScreenPath = path.join(__dirname, 'src', 'app', '(modals)', 'chat', '[jobId].tsx');
if (fs.existsSync(chatScreenPath)) {
  const chatScreenContent = fs.readFileSync(chatScreenPath, 'utf8');
  
  check(
    'Chat screen imports chatOptionsService',
    chatScreenContent.includes('import { chatOptionsService }'),
    'Missing import for chatOptionsService'
  );
  
  check(
    'Chat screen imports messageSearchService',
    chatScreenContent.includes('import { messageSearchService }'),
    'Missing import for messageSearchService'
  );
  
  check(
    'Chat screen has handleViewProfile',
    chatScreenContent.includes('handleViewProfile'),
    'Missing handleViewProfile function'
  );
  
  check(
    'Chat screen has handleMuteChat',
    chatScreenContent.includes('handleMuteChat'),
    'Missing handleMuteChat function'
  );
  
  check(
    'Chat screen has handleBlockUser',
    chatScreenContent.includes('handleBlockUser'),
    'Missing handleBlockUser function'
  );
  
  check(
    'Chat screen has handleReportUser',
    chatScreenContent.includes('handleReportUser'),
    'Missing handleReportUser function'
  );
  
  check(
    'Chat screen has handleDeleteChat',
    chatScreenContent.includes('handleDeleteChat'),
    'Missing handleDeleteChat function'
  );
  
  check(
    'Chat screen has mute options modal',
    chatScreenContent.includes('showMuteOptions'),
    'Missing mute options modal'
  );
  
  check(
    'Chat screen has search modal',
    chatScreenContent.includes('showSearchModal'),
    'Missing search modal'
  );
} else {
  failed += 9;
  console.log(`❌ Chat screen file not found: ${chatScreenPath}`);
}

// Check 5: Chat Options Service has all methods
if (fs.existsSync(chatOptionsServicePath)) {
  const serviceContent = fs.readFileSync(chatOptionsServicePath, 'utf8');
  
  check(
    'Service has muteChat method',
    serviceContent.includes('async muteChat'),
    'Missing muteChat method'
  );
  
  check(
    'Service has unmuteChat method',
    serviceContent.includes('async unmuteChat'),
    'Missing unmuteChat method'
  );
  
  check(
    'Service has blockUser method',
    serviceContent.includes('async blockUser'),
    'Missing blockUser method'
  );
  
  check(
    'Service has unblockUser method',
    serviceContent.includes('async unblockUser'),
    'Missing unblockUser method'
  );
  
  check(
    'Service has deleteChat method',
    serviceContent.includes('async deleteChat'),
    'Missing deleteChat method'
  );
  
  check(
    'Service has proper logging',
    serviceContent.includes('console.log') && serviceContent.includes('[ChatOptionsService]'),
    'Missing comprehensive logging'
  );
  
  check(
    'Service uses dynamic field updates',
    serviceContent.includes('muteData[') || serviceContent.includes('deleteData['),
    'Not using dynamic field update pattern'
  );
  
  check(
    'Service uses setDoc with merge',
    serviceContent.includes('setDoc') && serviceContent.includes('merge: true'),
    'Not using setDoc with merge for safe document creation'
  );
} else {
  failed += 8;
}

// Summary
console.log('\n' + '='.repeat(50));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('✅ ALL CHECKS PASSED! Chat options are properly implemented.\n');
  console.log('Next steps:');
  console.log('1. Run: npx expo start --clear');
  console.log('2. Open any chat screen');
  console.log('3. Test each option (View Profile, Mute, Block, Report, Delete)');
  console.log('4. Check console logs for detailed operation tracking\n');
  process.exit(0);
} else {
  console.log('❌ SOME CHECKS FAILED. Please review the errors above.\n');
  process.exit(1);
}







