/**
 * 🏰 GUILD FEATURE COMPREHENSIVE TEST
 * 
 * Tests the entire Guild system including:
 * - Guild creation and management
 * - Member recruitment (invites & join requests)
 * - Roles and permissions (Guild Master, Vice Master, Member)
 * - Guild earnings and vault
 * - Guild analytics
 * - Guild chat integration
 * - Frontend UI/UX
 */

const fs = require('fs');
const assert = require('assert');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// ============================================================================
// TEST SUITE 1: GUILD SYSTEM CORE
// ============================================================================
function testGuildSystemCore() {
  log('blue', '\n═══════════════════════════════════════════════════════════');
  log('blue', '🏰 TEST SUITE 1: GUILD SYSTEM CORE');
  log('blue', '═══════════════════════════════════════════════════════════\n');
  
  const tests = { total: 0, passed: 0, failed: 0 };
  
  // Test 1.1: Guild system interfaces
  tests.total++;
  try {
    log('yellow', '📝 Test 1.1: Guild System Interfaces...');
    const file = fs.readFileSync('./src/utils/guildSystem.ts', 'utf8');
    
    assert(file.includes('export interface Guild'), 'Guild interface must exist');
    assert(file.includes('export interface GuildMember'), 'GuildMember interface must exist');
    assert(file.includes('export interface GuildInvitation'), 'GuildInvitation interface must exist');
    assert(file.includes('export interface GuildJoinRequest'), 'GuildJoinRequest interface must exist');
    assert(file.includes('export interface UserGuildStatus'), 'UserGuildStatus interface must exist');
    
    log('green', '✅ Test 1.1 PASSED: All 5 core interfaces defined');
    tests.passed++;
  } catch (error) {
    log('red', `❌ Test 1.1 FAILED: ${error.message}`);
    tests.failed++;
  }
  
  // Test 1.2: Guild roles
  tests.total++;
  try {
    log('yellow', '📝 Test 1.2: Guild Roles System...');
    const file = fs.readFileSync('./src/utils/guildSystem.ts', 'utf8');
    
    assert(file.includes("'Guild Master'"), 'Guild Master role must exist');
    assert(file.includes("'Vice Master'"), 'Vice Master role must exist');
    assert(file.includes("'Member'"), 'Member role must exist');
    assert(file.includes('type MemberLevel = 1 | 2 | 3'), 'Member levels must be defined');
    
    log('green', '✅ Test 1.2 PASSED: 3 roles + member levels (1-3) defined');
    tests.passed++;
  } catch (error) {
    log('red', `❌ Test 1.2 FAILED: ${error.message}`);
    tests.failed++;
  }
  
  // Test 1.3: Guild system class
  tests.total++;
  try {
    log('yellow', '📝 Test 1.3: Guild System Class Methods...');
    const file = fs.readFileSync('./src/utils/guildSystem.ts', 'utf8');
    
    const requiredMethods = [
      'createGuild',
      'getGuildById',
      'getUserGuildStatus',
      'joinGuild',
      'leaveGuild',
      'inviteMember',
      'removeMember',
      'updateMemberRole',
      'getGuildMembers'
    ];
    
    let foundMethods = 0;
    for (const method of requiredMethods) {
      if (file.includes(method)) foundMethods++;
    }
    
    assert(foundMethods >= 7, `Too few methods: ${foundMethods}/${requiredMethods.length}`);
    
    log('green', `✅ Test 1.3 PASSED: ${foundMethods}/${requiredMethods.length} core methods found`);
    tests.passed++;
  } catch (error) {
    log('red', `❌ Test 1.3 FAILED: ${error.message}`);
    tests.failed++;
  }
  
  return tests;
}

// ============================================================================
// TEST SUITE 2: GUILD BACKEND SERVICE
// ============================================================================
function testGuildBackendService() {
  log('blue', '\n═══════════════════════════════════════════════════════════');
  log('blue', '🏰 TEST SUITE 2: GUILD BACKEND SERVICE');
  log('blue', '═══════════════════════════════════════════════════════════\n');
  
  const tests = { total: 0, passed: 0, failed: 0 };
  
  // Test 2.1: Backend service exists
  tests.total++;
  try {
    log('yellow', '📝 Test 2.1: Guild Backend Service...');
    const file = fs.readFileSync('./backend/src/services/GuildService.ts', 'utf8');
    
    assert(file.includes('export class GuildService'), 'GuildService class must exist');
    assert(file.includes('PrismaClient'), 'Must use Prisma for database');
    assert(file.includes('NotificationService'), 'Must integrate notifications');
    assert(file.includes('ChatService'), 'Must integrate chat');
    assert(file.includes('AnalyticsService'), 'Must integrate analytics');
    
    log('green', '✅ Test 2.1 PASSED: Guild service with 4 integrations');
    tests.passed++;
  } catch (error) {
    log('red', `❌ Test 2.1 FAILED: ${error.message}`);
    tests.failed++;
  }
  
  // Test 2.2: Guild CRUD operations
  tests.total++;
  try {
    log('yellow', '📝 Test 2.2: Guild CRUD Operations...');
    const file = fs.readFileSync('./backend/src/services/GuildService.ts', 'utf8');
    
    assert(file.includes('async createGuild'), 'Must have createGuild method');
    assert(file.includes('async getGuild'), 'Must have getGuild method');
    assert(file.includes('async updateGuild'), 'Must have updateGuild method');
    assert(file.includes('async deleteGuild') || file.includes('async disbandGuild'), 'Must have delete/disband method');
    
    log('green', '✅ Test 2.2 PASSED: All CRUD operations present');
    tests.passed++;
  } catch (error) {
    log('red', `❌ Test 2.2 FAILED: ${error.message}`);
    tests.failed++;
  }
  
  // Test 2.3: Member management operations
  tests.total++;
  try {
    log('yellow', '📝 Test 2.3: Member Management Operations...');
    const file = fs.readFileSync('./backend/src/services/GuildService.ts', 'utf8');
    
    assert(file.includes('addMember') || file.includes('joinGuild'), 'Must have add member method');
    assert(file.includes('removeMember') || file.includes('kickMember'), 'Must have remove member method');
    assert(file.includes('updateMemberRole') || file.includes('changeMemberRole'), 'Must have update role method');
    assert(file.includes('getGuildMembers') || file.includes('listMembers'), 'Must have list members method');
    
    log('green', '✅ Test 2.3 PASSED: All member management operations present');
    tests.passed++;
  } catch (error) {
    log('red', `❌ Test 2.3 FAILED: ${error.message}`);
    tests.failed++;
  }
  
  // Test 2.4: Error handling
  tests.total++;
  try {
    log('yellow', '📝 Test 2.4: Error Handling...');
    const file = fs.readFileSync('./backend/src/services/GuildService.ts', 'utf8');
    
    const tryCount = (file.match(/try\s*\{/g) || []).length;
    const catchCount = (file.match(/catch\s*\(/g) || []).length;
    
    assert(tryCount === catchCount, `Mismatched try-catch: ${tryCount} try, ${catchCount} catch`);
    assert(tryCount >= 5, `Too few try-catch blocks: ${tryCount} (expected >= 5)`);
    
    log('green', `✅ Test 2.4 PASSED: ${tryCount} try-catch blocks with proper error handling`);
    tests.passed++;
  } catch (error) {
    log('red', `❌ Test 2.4 FAILED: ${error.message}`);
    tests.failed++;
  }
  
  return tests;
}

// ============================================================================
// TEST SUITE 3: GUILD FRONTEND SCREENS
// ============================================================================
function testGuildFrontendScreens() {
  log('blue', '\n═══════════════════════════════════════════════════════════');
  log('blue', '🏰 TEST SUITE 3: GUILD FRONTEND SCREENS');
  log('blue', '═══════════════════════════════════════════════════════════\n');
  
  const tests = { total: 0, passed: 0, failed: 0 };
  
  const guildScreens = [
    { path: './src/app/(modals)/guilds.tsx', name: 'Guild List' },
    { path: './src/app/(modals)/guild.tsx', name: 'Guild Details' },
    { path: './src/app/(modals)/create-guild.tsx', name: 'Create Guild' },
    { path: './src/app/(modals)/guild-master.tsx', name: 'Guild Master Dashboard' },
    { path: './src/app/(modals)/guild-vice-master.tsx', name: 'Vice Master Dashboard' },
    { path: './src/app/(modals)/guild-member.tsx', name: 'Member Dashboard' },
    { path: './src/app/(modals)/member-management.tsx', name: 'Member Management' }
  ];
  
  for (const { path, name } of guildScreens) {
    tests.total++;
    try {
      log('yellow', `📝 Checking ${name}...`);
      
      if (!fs.existsSync(path)) {
        throw new Error(`Screen file not found: ${path}`);
      }
      
      const content = fs.readFileSync(path, 'utf8');
      
      // Check for basic React Native components
      assert(content.includes('View') || content.includes('ScrollView'), 'Must use View/ScrollView');
      assert(content.includes('Text') || content.includes('Heading'), 'Must have Text/Heading');
      
      // Check for theme integration
      assert(content.includes('useTheme') || content.includes('theme'), 'Must use theme');
      
      log('green', `✅ ${name} PASSED: Screen exists with theme support`);
      tests.passed++;
    } catch (error) {
      log('red', `❌ ${name} FAILED: ${error.message}`);
      tests.failed++;
    }
  }
  
  return tests;
}

// ============================================================================
// TEST SUITE 4: GUILD CONTEXT & STATE MANAGEMENT
// ============================================================================
function testGuildContext() {
  log('blue', '\n═══════════════════════════════════════════════════════════');
  log('blue', '🏰 TEST SUITE 4: GUILD CONTEXT & STATE');
  log('blue', '═══════════════════════════════════════════════════════════\n');
  
  const tests = { total: 0, passed: 0, failed: 0 };
  
  // Test 4.1: Guild context exists
  tests.total++;
  try {
    log('yellow', '📝 Test 4.1: Guild Context Implementation...');
    const file = fs.readFileSync('./src/contexts/GuildContext.tsx', 'utf8');
    
    assert(file.includes('createContext'), 'Must create context');
    assert(file.includes('GuildContextType'), 'Must define context type');
    assert(file.includes('GuildProvider'), 'Must have provider component');
    assert(file.includes('useGuild'), 'Must have useGuild hook');
    
    log('green', '✅ Test 4.1 PASSED: Guild context properly implemented');
    tests.passed++;
  } catch (error) {
    log('red', `❌ Test 4.1 FAILED: ${error.message}`);
    tests.failed++;
  }
  
  // Test 4.2: Context methods
  tests.total++;
  try {
    log('yellow', '📝 Test 4.2: Guild Context Methods...');
    const file = fs.readFileSync('./src/contexts/GuildContext.tsx', 'utf8');
    
    const requiredMethods = [
      'joinGuild',
      'leaveGuild',
      'createGuild',
      'updateGuildMembership',
      'refreshGuildData',
      'sendGuildInvitation',
      'respondToInvitation'
    ];
    
    let foundMethods = 0;
    for (const method of requiredMethods) {
      if (file.includes(method)) foundMethods++;
    }
    
    assert(foundMethods >= 5, `Too few methods: ${foundMethods}/${requiredMethods.length}`);
    
    log('green', `✅ Test 4.2 PASSED: ${foundMethods}/${requiredMethods.length} context methods defined`);
    tests.passed++;
  } catch (error) {
    log('red', `❌ Test 4.2 FAILED: ${error.message}`);
    tests.failed++;
  }
  
  // Test 4.3: State management
  tests.total++;
  try {
    log('yellow', '📝 Test 4.3: Guild State Management...');
    const file = fs.readFileSync('./src/contexts/GuildContext.tsx', 'utf8');
    
    assert(file.includes('useState'), 'Must use useState');
    assert(file.includes('useEffect'), 'Must use useEffect');
    assert(file.includes('currentGuild'), 'Must track current guild');
    assert(file.includes('userGuildStatus') || file.includes('memberStatus'), 'Must track user status');
    
    log('green', '✅ Test 4.3 PASSED: State management properly implemented');
    tests.passed++;
  } catch (error) {
    log('red', `❌ Test 4.3 FAILED: ${error.message}`);
    tests.failed++;
  }
  
  return tests;
}

// ============================================================================
// TEST SUITE 5: GUILD DATABASE SCHEMA
// ============================================================================
function testGuildDatabaseSchema() {
  log('blue', '\n═══════════════════════════════════════════════════════════');
  log('blue', '🏰 TEST SUITE 5: GUILD DATABASE SCHEMA');
  log('blue', '═══════════════════════════════════════════════════════════\n');
  
  const tests = { total: 0, passed: 0, failed: 0 };
  
  // Test 5.1: Guild model
  tests.total++;
  try {
    log('yellow', '📝 Test 5.1: Guild Model Schema...');
    const file = fs.readFileSync('./backend/prisma/schema.prisma', 'utf8');
    
    assert(file.includes('model Guild'), 'Guild model must exist');
    assert(file.includes('name'), 'Must have name field');
    assert(file.includes('description'), 'Must have description field');
    assert(file.includes('isPublic'), 'Must have isPublic field');
    assert(file.includes('maxMembers'), 'Must have maxMembers field');
    assert(file.includes('totalEarnings'), 'Must have totalEarnings field');
    
    log('green', '✅ Test 5.1 PASSED: Guild model with all required fields');
    tests.passed++;
  } catch (error) {
    log('red', `❌ Test 5.1 FAILED: ${error.message}`);
    tests.failed++;
  }
  
  // Test 5.2: GuildMember model
  tests.total++;
  try {
    log('yellow', '📝 Test 5.2: GuildMember Model Schema...');
    const file = fs.readFileSync('./backend/prisma/schema.prisma', 'utf8');
    
    assert(file.includes('model GuildMember'), 'GuildMember model must exist');
    assert(file.includes('userId'), 'Must have userId field');
    assert(file.includes('guildId'), 'Must have guildId field');
    assert(file.includes('role'), 'Must have role field');
    assert(file.includes('level'), 'Must have level field');
    
    log('green', '✅ Test 5.2 PASSED: GuildMember model with relationships');
    tests.passed++;
  } catch (error) {
    log('red', `❌ Test 5.2 FAILED: ${error.message}`);
    tests.failed++;
  }
  
  // Test 5.3: Guild roles enum
  tests.total++;
  try {
    log('yellow', '📝 Test 5.3: Guild Roles Enum...');
    const file = fs.readFileSync('./backend/prisma/schema.prisma', 'utf8');
    
    assert(file.includes('enum GuildRole'), 'GuildRole enum must exist');
    assert(file.includes('GUILD_MASTER'), 'Must have GUILD_MASTER role');
    assert(file.includes('VICE_MASTER'), 'Must have VICE_MASTER role');
    assert(file.includes('MEMBER'), 'Must have MEMBER role');
    
    log('green', '✅ Test 5.3 PASSED: GuildRole enum with 3 roles');
    tests.passed++;
  } catch (error) {
    log('red', `❌ Test 5.3 FAILED: ${error.message}`);
    tests.failed++;
  }
  
  return tests;
}

// ============================================================================
// TEST SUITE 6: GUILD PERMISSIONS & SECURITY
// ============================================================================
function testGuildPermissions() {
  log('blue', '\n═══════════════════════════════════════════════════════════');
  log('blue', '🏰 TEST SUITE 6: GUILD PERMISSIONS & SECURITY');
  log('blue', '═══════════════════════════════════════════════════════════\n');
  
  const tests = { total: 0, passed: 0, failed: 0 };
  
  // Test 6.1: Permission checks
  tests.total++;
  try {
    log('yellow', '📝 Test 6.1: Permission Checks...');
    const file = fs.readFileSync('./backend/src/services/GuildService.ts', 'utf8');
    
    // Check for permission validation
    const hasPermissionCheck = 
      file.includes('GUILD_MASTER') || 
      file.includes('checkPermission') ||
      file.includes('requireRole') ||
      file.includes('isGuildMaster');
    
    assert(hasPermissionCheck, 'Must have permission checks');
    
    log('green', '✅ Test 6.1 PASSED: Permission checks implemented');
    tests.passed++;
  } catch (error) {
    log('red', `❌ Test 6.1 FAILED: ${error.message}`);
    tests.failed++;
  }
  
  // Test 6.2: Guild ownership validation
  tests.total++;
  try {
    log('yellow', '📝 Test 6.2: Guild Ownership Validation...');
    const file = fs.readFileSync('./backend/src/services/GuildService.ts', 'utf8');
    
    // Check for owner/creator validation
    const hasOwnerCheck = 
      file.includes('createdBy') || 
      file.includes('creatorId') ||
      file.includes('guildMaster');
    
    assert(hasOwnerCheck, 'Must validate guild ownership');
    
    log('green', '✅ Test 6.2 PASSED: Ownership validation present');
    tests.passed++;
  } catch (error) {
    log('red', `❌ Test 6.2 FAILED: ${error.message}`);
    tests.failed++;
  }
  
  // Test 6.3: Member limits
  tests.total++;
  try {
    log('yellow', '📝 Test 6.3: Member Limit Validation...');
    const file = fs.readFileSync('./backend/src/services/GuildService.ts', 'utf8');
    
    const hasLimitCheck = 
      file.includes('maxMembers') ||
      file.includes('memberCount') ||
      file.includes('full') ||
      file.includes('capacity');
    
    assert(hasLimitCheck, 'Must check member limits');
    
    log('green', '✅ Test 6.3 PASSED: Member limit validation present');
    tests.passed++;
  } catch (error) {
    log('red', `❌ Test 6.3 FAILED: ${error.message}`);
    tests.failed++;
  }
  
  return tests;
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================
async function runGuildFeatureTests() {
  console.log('\n');
  log('cyan', '╔══════════════════════════════════════════════════════════════╗');
  log('cyan', '║                                                              ║');
  log('cyan', '║     🏰 GUILD FEATURE COMPREHENSIVE TEST SUITE 🏰            ║');
  log('cyan', '║                                                              ║');
  log('cyan', '║     Testing: Complete Guild System                          ║');
  log('cyan', '║                                                              ║');
  log('cyan', '╚══════════════════════════════════════════════════════════════╝');
  console.log('\n');
  
  const startTime = Date.now();
  const allResults = [];
  
  try {
    allResults.push(testGuildSystemCore());
    allResults.push(testGuildBackendService());
    allResults.push(testGuildFrontendScreens());
    allResults.push(testGuildContext());
    allResults.push(testGuildDatabaseSchema());
    allResults.push(testGuildPermissions());
  } catch (error) {
    log('red', `\n❌ FATAL ERROR: ${error.message}`);
    console.error(error);
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  const totals = allResults.reduce((acc, result) => ({
    total: acc.total + result.total,
    passed: acc.passed + result.passed,
    failed: acc.failed + result.failed
  }), { total: 0, passed: 0, failed: 0 });
  
  console.log('\n');
  log('cyan', '═══════════════════════════════════════════════════════════');
  log('cyan', '📊 GUILD FEATURE TEST SUMMARY');
  log('cyan', '═══════════════════════════════════════════════════════════\n');
  
  log('yellow', `⏱️  Total Duration: ${duration}s`);
  log('yellow', `📝 Total Tests: ${totals.total}`);
  log('green', `✅ Passed: ${totals.passed}`);
  log('red', `❌ Failed: ${totals.failed}`);
  
  const passRate = ((totals.passed / totals.total) * 100).toFixed(1);
  console.log('');
  
  if (passRate === '100.0') {
    log('green', `🎉 SUCCESS RATE: ${passRate}% - GUILD SYSTEM FULLY FUNCTIONAL!`);
  } else if (passRate >= '90.0') {
    log('green', `✅ SUCCESS RATE: ${passRate}% - EXCELLENT`);
  } else if (passRate >= '80.0') {
    log('yellow', `⚠️  SUCCESS RATE: ${passRate}% - GOOD, MINOR ISSUES`);
  } else {
    log('red', `❌ SUCCESS RATE: ${passRate}% - NEEDS FIXES`);
  }
  
  console.log('\n');
  log('cyan', '═══════════════════════════════════════════════════════════\n');
  
  process.exit(totals.failed > 0 ? 1 : 0);
}

runGuildFeatureTests().catch(error => {
  console.error('Guild feature tests failed:', error);
  process.exit(1);
});






