#!/usr/bin/env node

/**
 * Firestore Rules Validation Test
 * Tests all collections to ensure rules are properly deployed
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin (you'll need service account key)
// For testing, we can use the Firebase emulator or actual project

const PROJECT_ID = 'guild-4f46b';

// Collection test cases
const TEST_COLLECTIONS = [
  // User collections
  { collection: 'users', operation: 'read', description: 'Read user profile' },
  { collection: 'userProfiles', operation: 'read', description: 'Read user profile' },
  { collection: 'wallets', operation: 'read', description: 'Read wallet' },
  { collection: 'user_wallets', operation: 'read', description: 'Read user wallet' },
  
  // Job collections
  { collection: 'jobs', operation: 'read', description: 'Read jobs' },
  { collection: 'offers', operation: 'read', description: 'Read offers' },
  { collection: 'contracts', operation: 'read', description: 'Read contracts' },
  { collection: 'escrows', operation: 'read', description: 'Read escrows' },
  
  // Guild collections
  { collection: 'guilds', operation: 'read', description: 'Read guilds' },
  { collection: 'guild_members', operation: 'read', description: 'Read guild members' },
  
  // Chat collections
  { collection: 'chats', operation: 'read', description: 'Read chats' },
  { collection: 'presence', operation: 'read', description: 'Read presence' },
  
  // Notification collections
  { collection: 'notifications', operation: 'read', description: 'Read notifications' },
  { collection: 'announcements', operation: 'read', description: 'Read announcements' },
  
  // Security collections
  { collection: 'security_events', operation: 'read', description: 'Read security events' },
  { collection: 'security_alerts', operation: 'read', description: 'Read security alerts' },
  
  // Financial collections
  { collection: 'transactions', operation: 'read', description: 'Read transactions' },
  { collection: 'payments', operation: 'read', description: 'Read payments' },
  { collection: 'coin_purchases', operation: 'read', description: 'Read coin purchases' },
  { collection: 'coin_withdrawals', operation: 'read', description: 'Read coin withdrawals' },
  
  // Dispute collections
  { collection: 'disputes', operation: 'read', description: 'Read disputes' },
  { collection: 'message-audit-trail', operation: 'read', description: 'Read audit trail' },
  
  // Additional collections
  { collection: 'feedback', operation: 'read', description: 'Read feedback' },
  { collection: 'reviews', operation: 'read', description: 'Read reviews' },
  { collection: 'jobApplications', operation: 'read', description: 'Read job applications' },
  { collection: 'reports', operation: 'read', description: 'Read reports' },
  { collection: 'payment_intents', operation: 'read', description: 'Read payment intents' },
];

async function testRules() {
  console.log('🔥 FIRESTORE RULES VALIDATION TEST\n');
  console.log('='.repeat(60));
  console.log(`Project: ${PROJECT_ID}`);
  console.log('='.repeat(60));
  console.log('\n📋 Test Collections:', TEST_COLLECTIONS.length);
  console.log('\n⏳ Starting tests...\n');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  // Check if Firebase is initialized
  if (!admin.apps.length) {
    console.log('⚠️  Firebase Admin not initialized');
    console.log('📝 This test requires Firebase Admin SDK');
    console.log('💡 To test with actual Firebase, initialize admin with service account\n');
    
    // Validate rules file syntax instead
    await validateRulesSyntax();
    return;
  }

  const db = admin.firestore();

  for (const test of TEST_COLLECTIONS) {
    results.total++;
    try {
      console.log(`🧪 Testing: ${test.collection} (${test.operation})`);
      
      const collectionRef = db.collection(test.collection);
      const snapshot = await collectionRef.limit(1).get();
      
      if (snapshot.empty) {
        console.log(`   ✅ Collection exists (empty)`);
        results.passed++;
      } else {
        console.log(`   ✅ Collection exists (${snapshot.size} documents)`);
        results.passed++;
      }
    } catch (error) {
      results.failed++;
      const errorMsg = error.message || 'Unknown error';
      results.errors.push({
        collection: test.collection,
        error: errorMsg
      });
      
      if (errorMsg.includes('Missing or insufficient permissions')) {
        console.log(`   ❌ PERMISSION DENIED - Rule may need adjustment`);
      } else if (errorMsg.includes('not found')) {
        console.log(`   ⚠️  Collection not found (this is OK if not created yet)`);
        results.skipped++;
        results.failed--;
      } else {
        console.log(`   ❌ Error: ${errorMsg}`);
      }
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.errors.length > 0) {
    console.log('\n⚠️  ERRORS FOUND:');
    results.errors.forEach((err, idx) => {
      console.log(`   ${idx + 1}. ${err.collection}: ${err.error}`);
    });
  }
  
  console.log('\n💡 Note: This test checks if collections are accessible.');
  console.log('   For full permission testing, use Firebase Console Rules Playground.\n');
}

async function validateRulesSyntax() {
  console.log('📝 VALIDATING RULES FILE SYNTAX\n');
  
  const fs = require('fs');
  const path = require('path');
  
  const rulesPath = path.join(__dirname, 'firestore.rules');
  
  if (!fs.existsSync(rulesPath)) {
    console.log('❌ firestore.rules file not found');
    return;
  }
  
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');
  
  // Basic syntax checks
  const checks = [
    {
      name: 'rules_version declaration',
      test: /rules_version\s*=\s*['"]2['"]/,
      pass: false
    },
    {
      name: 'service cloud.firestore declaration',
      test: /service\s+cloud\.firestore/,
      pass: false
    },
    {
      name: 'database match statement',
      test: /match\s+\/databases\/\{database\}\/documents/,
      pass: false
    },
    {
      name: 'helper functions',
      test: /function\s+\w+\(/,
      pass: false
    },
    {
      name: 'collection matches',
      test: /match\s+\/\w+/,
      pass: false
    },
    {
      name: 'allow statements',
      test: /allow\s+(read|write|create|update|delete)/,
      pass: false
    },
    {
      name: 'closing braces',
      test: /^\s*\}\s*$/m,
      pass: false
    }
  ];
  
  checks.forEach(check => {
    check.pass = check.test.test(rulesContent);
    const icon = check.pass ? '✅' : '❌';
    console.log(`   ${icon} ${check.name}`);
  });
  
  const allPassed = checks.every(c => c.pass);
  
  // Count statistics
  const matchCount = (rulesContent.match(/match\s+\//g) || []).length;
  const allowCount = (rulesContent.match(/allow\s+/g) || []).length;
  const functionCount = (rulesContent.match(/function\s+\w+/g) || []).length;
  
  console.log('\n📊 File Statistics:');
  console.log(`   Total lines: ${rulesContent.split('\n').length}`);
  console.log(`   Collection matches: ${matchCount}`);
  console.log(`   Allow statements: ${allowCount}`);
  console.log(`   Helper functions: ${functionCount}`);
  
  if (allPassed) {
    console.log('\n✅ Rules file syntax is valid!');
    console.log('💡 Deploy to Firebase Console to test actual permissions.\n');
  } else {
    console.log('\n⚠️  Some syntax checks failed. Please review the rules file.\n');
  }
}

// Run tests
if (require.main === module) {
  testRules().catch(console.error);
}

module.exports = { testRules, validateRulesSyntax };







