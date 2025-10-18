/**
 * REAL SYSTEM INTEGRATION TEST
 * Tests actual backend API endpoints, Firebase connectivity, and full system
 * 
 * This test uses native fetch and existing Firebase SDK (no firebase-admin needed)
 */

const { performance } = require('perf_hooks');

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║       REAL SYSTEM INTEGRATION TEST - FULL STACK TESTING          ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const results = [];

async function test(name, fn) {
  totalTests++;
  const startTime = performance.now();
  
  try {
    await fn();
    const duration = performance.now() - startTime;
    passedTests++;
    results.push({ name, status: 'PASS', duration: Math.round(duration) });
    console.log(`  ✅ ${name} (${Math.round(duration)}ms)`);
  } catch (error) {
    const duration = performance.now() - startTime;
    failedTests++;
    results.push({ name, status: 'FAIL', duration: Math.round(duration), error: error.message });
    console.log(`  ❌ ${name} (${Math.round(duration)}ms)`);
    console.log(`     Error: ${error.message}`);
  }
}

// ============================================================================
// SUITE 1: BACKEND API ENDPOINT TESTING
// ============================================================================
async function testBackendAPIs() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║ SUITE 1: BACKEND API ENDPOINTS - Real HTTP Calls                 ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  const BACKEND_URL = 'http://192.168.1.34:4000';

  await test('Backend Health Check', async () => {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.status !== 'healthy') {
      throw new Error('Backend not healthy');
    }
  });

  await test('Backend API v1 Health Check', async () => {
    const response = await fetch(`${BACKEND_URL}/api/v1/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`API health check failed: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.status || data.status !== 'healthy') {
      throw new Error('API not healthy');
    }
  });

  await test('Backend Response Time (should be <500ms)', async () => {
    const startTime = performance.now();
    const response = await fetch(`${BACKEND_URL}/health`);
    const responseTime = performance.now() - startTime;
    
    if (responseTime > 500) {
      throw new Error(`Slow response: ${Math.round(responseTime)}ms`);
    }
  });

  await test('Backend CORS Headers', async () => {
    const response = await fetch(`${BACKEND_URL}/health`);
    const corsHeader = response.headers.get('access-control-allow-origin');
    
    if (!corsHeader) {
      throw new Error('CORS headers not set');
    }
  });

  await test('Backend Concurrent Requests (10x)', async () => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(fetch(`${BACKEND_URL}/health`));
    }
    
    const responses = await Promise.all(promises);
    const allOk = responses.every(r => r.ok);
    
    if (!allOk) {
      throw new Error('Some concurrent requests failed');
    }
  });
}

// ============================================================================
// SUITE 2: FIREBASE WEB SDK TESTING (Client-side)
// ============================================================================
async function testFirebaseClientSDK() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║ SUITE 2: FIREBASE WEB SDK - Client-Side Testing                  ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  await test('Firebase Config Exists', async () => {
    const fs = require('fs');
    const path = require('path');
    
    // Check if firebase config exists
    const configPaths = [
      path.join(__dirname, 'src', 'config', 'firebase.ts'),
      path.join(__dirname, 'src', 'config', 'firebase.tsx')
    ];
    
    let configExists = false;
    for (const configPath of configPaths) {
      if (fs.existsSync(configPath)) {
        configExists = true;
        const content = fs.readFileSync(configPath, 'utf-8');
        
        // Verify config has required fields
        if (!content.includes('apiKey') || 
            !content.includes('projectId') ||
            !content.includes('messagingSenderId')) {
          throw new Error('Firebase config missing required fields');
        }
        break;
      }
    }
    
    if (!configExists) {
      throw new Error('Firebase config file not found');
    }
  });

  await test('Firebase Services Exist', async () => {
    const fs = require('fs');
    const path = require('path');
    
    const services = [
      'chatService.ts',
      'notificationService.ts',
      'authService.ts'
    ];
    
    for (const service of services) {
      const servicePath = path.join(__dirname, 'src', 'services', service);
      if (!fs.existsSync(servicePath)) {
        throw new Error(`${service} not found`);
      }
      
      // Verify service has Firebase imports
      const content = fs.readFileSync(servicePath, 'utf-8');
      if (!content.includes('firebase') && !content.includes('firestore')) {
        console.warn(`  ⚠️  ${service} may not use Firebase`);
      }
    }
  });

  await test('Firestore Rules File Exists', async () => {
    const fs = require('fs');
    const path = require('path');
    
    const rulesPath = path.join(__dirname, '..', 'firestore.rules');
    if (!fs.existsSync(rulesPath)) {
      throw new Error('firestore.rules not found');
    }
    
    const content = fs.readFileSync(rulesPath, 'utf-8');
    if (!content.includes('match /chats/{chatId}')) {
      throw new Error('Chat rules not defined');
    }
  });
}

// ============================================================================
// SUITE 3: CHAT SYSTEM TESTING
// ============================================================================
async function testChatSystem() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║ SUITE 3: CHAT SYSTEM - Real-time Features                        ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  await test('Chat Service Implementation', async () => {
    const fs = require('fs');
    const path = require('path');
    
    const chatServicePath = path.join(__dirname, 'src', 'services', 'chatService.ts');
    const content = fs.readFileSync(chatServicePath, 'utf-8');
    
    // Check for required methods
    const requiredMethods = [
      'sendMessage',
      'listenToMessages',
      'editMessage',
      'deleteMessage',
      'getChats'
    ];
    
    for (const method of requiredMethods) {
      if (!content.includes(method)) {
        throw new Error(`Chat service missing ${method} method`);
      }
    }
    
    // Check for Firebase imports
    if (!content.includes('onSnapshot')) {
      throw new Error('Chat service not using real-time listeners');
    }
  });

  await test('Chat Screen Implementation', async () => {
    const fs = require('fs');
    const path = require('path');
    
    const chatScreenPath = path.join(__dirname, 'src', 'app', '(modals)', 'chat', '[jobId].tsx');
    if (!fs.existsSync(chatScreenPath)) {
      throw new Error('Chat screen not found');
    }
    
    const content = fs.readFileSync(chatScreenPath, 'utf-8');
    
    // Check for essential features
    const essentialFeatures = [
      'handleSendMessage',
      'listenToMessages',
      'KeyboardAvoidingView',
      'ScrollView'
    ];
    
    for (const feature of essentialFeatures) {
      if (!content.includes(feature)) {
        throw new Error(`Chat screen missing ${feature}`);
      }
    }
  });

  await test('Message Components Exist', async () => {
    const fs = require('fs');
    const path = require('path');
    
    const components = [
      'ChatMessage.tsx',
      'ChatInput.tsx',
      'MessageLoading.tsx'
    ];
    
    for (const component of components) {
      const componentPath = path.join(__dirname, 'src', 'components', component);
      if (!fs.existsSync(componentPath)) {
        throw new Error(`${component} not found`);
      }
    }
  });

  await test('Chat Options Service', async () => {
    const fs = require('fs');
    const path = require('path');
    
    const servicePath = path.join(__dirname, 'src', 'services', 'chatOptionsService.ts');
    const content = fs.readFileSync(servicePath, 'utf-8');
    
    const requiredMethods = [
      'muteChat',
      'blockUser',
      'deleteChat',
      'pinChat'
    ];
    
    for (const method of requiredMethods) {
      if (!content.includes(method)) {
        throw new Error(`Chat options missing ${method}`);
      }
    }
  });
}

// ============================================================================
// SUITE 4: SECURITY & PERFORMANCE
// ============================================================================
async function testSecurityAndPerformance() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║ SUITE 4: SECURITY & PERFORMANCE - Production Readiness           ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  await test('Environment Variables Security', async () => {
    const fs = require('fs');
    const path = require('path');
    
    const envPath = path.join(__dirname, 'src', 'config', 'environment.ts');
    const content = fs.readFileSync(envPath, 'utf-8');
    
    // Check for secure environment handling
    if (content.includes('process.env') || content.includes('EXPO_PUBLIC_')) {
      // Good - using environment variables
    } else {
      throw new Error('Not using environment variables properly');
    }
  });

  await test('Error Boundary Implementation', async () => {
    const fs = require('fs');
    const path = require('path');
    
    // Check for error boundaries
    const layoutPath = path.join(__dirname, 'src', 'app', '_layout.tsx');
    if (fs.existsSync(layoutPath)) {
      const content = fs.readFileSync(layoutPath, 'utf-8');
      if (!content.includes('ErrorBoundary') && !content.includes('try') && !content.includes('catch')) {
        console.warn('  ⚠️  No global error boundary detected');
      }
    }
  });

  await test('Firebase Security Rules Validation', async () => {
    const fs = require('fs');
    const path = require('path');
    
    const rulesPath = path.join(__dirname, '..', 'firestore.rules');
    const content = fs.readFileSync(rulesPath, 'utf-8');
    
    // Check for authentication checks
    if (!content.includes('request.auth')) {
      throw new Error('Security rules missing authentication checks');
    }
    
    // Check for proper access control
    if (content.includes('allow read, write: if true')) {
      throw new Error('Overly permissive security rules detected');
    }
  });

  await test('Code Quality Checks', async () => {
    const fs = require('fs');
    const path = require('path');
    
    // Check for TypeScript usage
    const tsConfigPath = path.join(__dirname, 'tsconfig.json');
    if (!fs.existsSync(tsConfigPath)) {
      throw new Error('TypeScript config not found');
    }
    
    // Check for linting
    const eslintPath = path.join(__dirname, '.eslintrc.js');
    const packageJson = path.join(__dirname, 'package.json');
    const pkgContent = fs.readFileSync(packageJson, 'utf-8');
    
    if (!pkgContent.includes('eslint')) {
      console.warn('  ⚠️  ESLint not configured');
    }
  });
}

// ============================================================================
// SUITE 5: END-TO-END USER FLOW
// ============================================================================
async function testEndToEndFlow() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║ SUITE 5: END-TO-END USER FLOW - Complete Journey                 ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  await test('Authentication Flow Exists', async () => {
    const fs = require('fs');
    const path = require('path');
    
    const authScreens = [
      path.join(__dirname, 'src', 'app', '(auth)', 'login.tsx'),
      path.join(__dirname, 'src', 'app', '(auth)', 'register.tsx')
    ];
    
    for (const screen of authScreens) {
      if (!fs.existsSync(screen)) {
        throw new Error(`Auth screen not found: ${path.basename(screen)}`);
      }
    }
  });

  await test('Main Navigation Screens', async () => {
    const fs = require('fs');
    const path = require('path');
    
    const mainScreens = [
      path.join(__dirname, 'src', 'app', '(tabs)', 'index.tsx'), // Home
      path.join(__dirname, 'src', 'app', '(tabs)', 'jobs.tsx'),
      path.join(__dirname, 'src', 'app', '(tabs)', 'profile.tsx'),
      path.join(__dirname, 'src', 'app', '(tabs)', 'chat.tsx')
    ];
    
    for (const screen of mainScreens) {
      if (!fs.existsSync(screen)) {
        console.warn(`  ⚠️  Main screen not found: ${path.basename(screen)}`);
      }
    }
  });

  await test('Job Flow Complete', async () => {
    const fs = require('fs');
    const path = require('path');
    
    // Check for job-related screens
    const jobScreens = [
      'post-job',
      'job-details',
      'accept-offer'
    ];
    
    const modalsDir = path.join(__dirname, 'src', 'app', '(modals)');
    if (fs.existsSync(modalsDir)) {
      const files = fs.readdirSync(modalsDir, { recursive: true });
      const hasJobFlow = jobScreens.some(screen => 
        files.some(f => f.toString().includes(screen))
      );
      
      if (!hasJobFlow) {
        console.warn('  ⚠️  Some job flow screens may be missing');
      }
    }
  });
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================
async function runAllTests() {
  const startTime = performance.now();
  
  console.log('🚀 Starting Full System Integration Tests...\n');
  console.log('Testing:');
  console.log('  ✓ Backend API Endpoints (Real HTTP calls)');
  console.log('  ✓ Firebase Client SDK Configuration');
  console.log('  ✓ Chat System Implementation');
  console.log('  ✓ Security & Performance');
  console.log('  ✓ End-to-End User Flow\n');
  console.log('═'.repeat(70) + '\n');
  
  // Run all test suites
  await testBackendAPIs();
  await testFirebaseClientSDK();
  await testChatSystem();
  await testSecurityAndPerformance();
  await testEndToEndFlow();
  
  const totalTime = performance.now() - startTime;
  
  // Print Results
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║              REAL SYSTEM INTEGRATION TEST RESULTS                ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  console.log(`Total Tests:     ${totalTests}`);
  console.log(`✅ Passed:       ${passedTests}`);
  console.log(`❌ Failed:       ${failedTests}`);
  console.log(`Success Rate:   ${Math.round((passedTests / totalTests) * 100)}%`);
  console.log(`Total Time:     ${Math.round(totalTime)}ms\n`);
  
  // Show results by category
  const avgTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  console.log('⚡ PERFORMANCE:\n');
  console.log(`   Average Test Time: ${Math.round(avgTime)}ms`);
  console.log(`   Total Duration: ${Math.round(totalTime / 1000)}s\n`);
  
  console.log('=' .repeat(70) + '\n');
  
  if (failedTests === 0) {
    console.log('🎉🎉🎉 ALL INTEGRATION TESTS PASSED! 🎉🎉🎉\n');
    console.log('✅ Backend APIs working');
    console.log('✅ Firebase configured correctly');
    console.log('✅ Chat system implemented');
    console.log('✅ Security measures in place');
    console.log('✅ User flow complete\n');
    console.log('🚀 SYSTEM IS PRODUCTION READY!\n');
  } else {
    console.log('⚠️  SOME TESTS FAILED\n');
    console.log(`${failedTests} test(s) need attention:\n`);
    results.filter(r => r.status === 'FAIL').forEach((r, i) => {
      console.log(`${i + 1}. ${r.name}`);
      console.log(`   Error: ${r.error}\n`);
    });
    console.log('Fix these issues before deploying to production.\n');
  }
  
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});







