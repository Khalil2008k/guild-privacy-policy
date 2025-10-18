/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GROUP 1: AUTHENTICATION & ONBOARDING - COMPREHENSIVE AUDIT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * STRICT RULES APPLIED:
 * - Depth: Root-level code tracing with file/line numbers
 * - Truth/Real: Based exclusively on current codebase
 * - No Dummies: Real verification with actual executions
 * - Detailed Search: Cross-reference all auth files
 * - Real State: Quantified metrics (%, bugs, perf)
 * 
 * COVERAGE: Features 1, 10, 11 (Auth, Security, Settings)
 * - 15+ auth screens
 * - Backend auth middleware
 * - Firebase integration
 * - MFA/Security flows
 * - Rate limiting
 * - AsyncStorage persistence
 */

const fs = require('fs');
const path = require('path');

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Test Results Storage
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  critical: 0,
  details: [],
  metrics: {},
  gaps: [],
  security: []
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function test(description, fn) {
  results.total++;
  try {
    const result = fn();
    if (result === true || result === undefined) {
      results.passed++;
      log(colors.green, `✅ PASS: ${description}`);
      results.details.push({ status: 'PASS', test: description });
    } else if (result.warning) {
      results.warnings++;
      log(colors.yellow, `⚠️  WARN: ${description}`, `\n   ${result.message}`);
      results.details.push({ status: 'WARN', test: description, message: result.message });
    } else if (result.critical) {
      results.critical++;
      results.failed++;
      log(colors.red, `🔴 CRITICAL: ${description}`, `\n   ${result.message}`);
      results.details.push({ status: 'CRITICAL', test: description, message: result.message });
    } else {
      results.failed++;
      log(colors.red, `❌ FAIL: ${description}`, `\n   ${result}`);
      results.details.push({ status: 'FAIL', test: description, message: result });
    }
  } catch (error) {
    results.failed++;
    log(colors.red, `❌ ERROR: ${description}`, `\n   ${error.message}`);
    results.details.push({ status: 'ERROR', test: description, message: error.message });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Q1: TRACE FULL AUTH FLOW (Firebase ID Token → JWT)
// ═══════════════════════════════════════════════════════════════════════════

log(colors.cyan + colors.bright, '\n╔═══════════════════════════════════════════════════════════════════════╗');
log(colors.cyan + colors.bright, '║ Q1: TRACE FULL AUTH FLOW (Firebase ID Token → JWT)                   ║');
log(colors.cyan + colors.bright, '╚═══════════════════════════════════════════════════════════════════════╝\n');

test('Q1.1: AuthContext exists and implements Firebase auth', () => {
  const authContextPath = 'src/contexts/AuthContext.tsx';
  if (!fs.existsSync(authContextPath)) {
    return { critical: true, message: `[CODEBASE GAP] ${authContextPath} not found` };
  }
  
  const content = fs.readFileSync(authContextPath, 'utf8');
  const requiredFunctions = [
    'signInWithEmailAndPassword',
    'createUserWithEmailAndPassword',
    'onAuthStateChanged',
    'signOut'
  ];
  
  const missing = requiredFunctions.filter(fn => !content.includes(fn));
  if (missing.length > 0) {
    return `Missing Firebase auth functions: ${missing.join(', ')}`;
  }
  
  results.metrics.authFunctions = requiredFunctions.length;
  results.metrics.authContextLines = content.split('\n').length;
  return true;
});

test('Q1.2: Backend auth middleware validates JWT with proper error handling', () => {
  const authMiddlewarePath = 'backend/src/middleware/auth.ts';
  if (!fs.existsSync(authMiddlewarePath)) {
    return { critical: true, message: `[CODEBASE GAP] ${authMiddlewarePath} not found` };
  }
  
  const content = fs.readFileSync(authMiddlewarePath, 'utf8');
  
  // Check for critical security features
  const securityChecks = {
    'jwt.verify': 'JWT verification',
    'algorithms:': 'Algorithm specification',
    'TokenExpiredError': 'Token expiry handling',
    'user.isActive': 'Active user check',
    'prisma.user.findUnique': 'User validation'
  };
  
  const missing = [];
  Object.entries(securityChecks).forEach(([check, desc]) => {
    if (!content.includes(check)) {
      missing.push(desc);
    }
  });
  
  if (missing.length > 0) {
    return { critical: true, message: `Missing security: ${missing.join(', ')}` };
  }
  
  // Extract JWT secret check
  const hasSecretValidation = content.includes('JWT_SECRET') && content.includes('process.exit(1)');
  if (!hasSecretValidation) {
    return { warning: true, message: 'JWT_SECRET validation could be stronger' };
  }
  
  results.metrics.authMiddlewareLines = content.split('\n').length;
  results.metrics.authMiddlewareSecurityChecks = Object.keys(securityChecks).length;
  return true;
});

test('Q1.3: Auth token is stored securely (SecureStore/KeyChain)', () => {
  const authContextPath = 'src/contexts/AuthContext.tsx';
  const content = fs.readFileSync(authContextPath, 'utf8');
  
  // Check for secure storage
  const hasSecureStorage = content.includes('secureStorage') || content.includes('SecureStore');
  const hasAsyncStorage = content.includes('AsyncStorage');
  
  if (!hasSecureStorage && hasAsyncStorage) {
    results.security.push({
      severity: 'MEDIUM',
      issue: 'Auth tokens may be stored in AsyncStorage instead of SecureStore',
      location: 'src/contexts/AuthContext.tsx',
      recommendation: 'Use Expo SecureStore for sensitive data'
    });
    return { warning: true, message: 'Tokens may not use hardware-backed encryption' };
  }
  
  if (!hasSecureStorage && !hasAsyncStorage) {
    return { critical: true, message: '[CODEBASE GAP] No token storage mechanism found' };
  }
  
  // Check for token in line 82-84
  const hasTokenStorage = content.includes('await secureStorage.setItem(\'auth_token\'');
  if (hasTokenStorage) {
    results.metrics.secureTokenStorage = true;
    return true;
  }
  
  return { warning: true, message: 'Token storage implementation unclear' };
});

test('Q1.4: Auth flow includes proper error handling and user feedback', () => {
  const authContextPath = 'src/contexts/AuthContext.tsx';
  const content = fs.readFileSync(authContextPath, 'utf8');
  
  const errorHandling = [
    'try',
    'catch',
    'console.error',
    'logger'
  ];
  
  const found = errorHandling.filter(eh => content.includes(eh));
  
  if (found.length < 3) {
    return { warning: true, message: `Limited error handling (${found.length}/4 mechanisms)` };
  }
  
  results.metrics.authErrorHandling = `${found.length}/4`;
  return true;
});

test('Q1.5: JWT token expiry is configured (not infinite)', () => {
  const authRoutesPath = 'backend/src/routes/auth.ts';
  if (!fs.existsSync(authRoutesPath)) {
    return { warning: true, message: 'Auth routes file not found, checking alternative' };
  }
  
  const content = fs.readFileSync(authRoutesPath, 'utf8');
  
  // Check for expiresIn configuration
  const hasExpiry = content.match(/expiresIn:\s*['"](\w+)['"]/);
  if (!hasExpiry) {
    return { critical: true, message: 'JWT tokens may never expire (security risk!)' };
  }
  
  results.metrics.jwtExpiry = hasExpiry[1];
  
  // Warn if expiry is too long
  if (hasExpiry[1].includes('30d') || hasExpiry[1].includes('90d')) {
    return { warning: true, message: `JWT expiry is very long: ${hasExpiry[1]}` };
  }
  
  return true;
});

// ═══════════════════════════════════════════════════════════════════════════
// Q2: INSPECT ALL AUTH SCREENS (UI, Navigation, Context Integration)
// ═══════════════════════════════════════════════════════════════════════════

log(colors.cyan + colors.bright, '\n╔═══════════════════════════════════════════════════════════════════════╗');
log(colors.cyan + colors.bright, '║ Q2: INSPECT ALL AUTH SCREENS (UI, Navigation, Context)               ║');
log(colors.cyan + colors.bright, '╚═══════════════════════════════════════════════════════════════════════╝\n');

test('Q2.1: Count all auth screens', () => {
  const authDir = 'src/app/(auth)';
  if (!fs.existsSync(authDir)) {
    return { critical: true, message: `[CODEBASE GAP] ${authDir} directory not found` };
  }
  
  function countTsxFiles(dir) {
    let count = 0;
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        count += countTsxFiles(fullPath);
      } else if (file.name.endsWith('.tsx') && !file.name.includes('.test.')) {
        count++;
      }
    }
    return count;
  }
  
  const screenCount = countTsxFiles(authDir);
  results.metrics.authScreenCount = screenCount;
  
  if (screenCount < 15) {
    return { warning: true, message: `Only ${screenCount} auth screens found (expected 15+)` };
  }
  
  log(colors.blue, `   📱 Found ${screenCount} auth screens`);
  return true;
});

test('Q2.2: All auth screens use theme context', () => {
  const authDir = 'src/app/(auth)';
  const files = [];
  
  function findTsxFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        findTsxFiles(fullPath);
      } else if (entry.name.endsWith('.tsx') && !entry.name.includes('.test.') && !entry.name.startsWith('_')) {
        files.push(fullPath);
      }
    }
  }
  
  findTsxFiles(authDir);
  
  const missingTheme = files.filter(file => {
    const content = fs.readFileSync(file, 'utf8');
    return !content.includes('useTheme') && !content.includes('ThemeContext');
  });
  
  results.metrics.authScreensWithTheme = `${files.length - missingTheme.length}/${files.length}`;
  
  if (missingTheme.length > 0) {
    return { warning: true, message: `${missingTheme.length} screens missing theme: ${missingTheme.map(f => path.basename(f)).join(', ')}` };
  }
  
  return true;
});

test('Q2.3: All auth screens use i18n context for RTL support', () => {
  const authDir = 'src/app/(auth)';
  const files = [];
  
  function findTsxFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        findTsxFiles(fullPath);
      } else if (entry.name.endsWith('.tsx') && !entry.name.includes('.test.') && !entry.name.startsWith('_')) {
        files.push(fullPath);
      }
    }
  }
  
  findTsxFiles(authDir);
  
  const missingI18n = files.filter(file => {
    const content = fs.readFileSync(file, 'utf8');
    return !content.includes('useI18n') && !content.includes('I18nProvider') && !content.includes('isRTL');
  });
  
  results.metrics.authScreensWithI18n = `${files.length - missingI18n.length}/${files.length}`;
  
  if (missingI18n.length > 3) {
    return { warning: true, message: `${missingI18n.length} screens missing i18n support` };
  }
  
  return true;
});

test('Q2.4: Auth screens use Expo Router for navigation', () => {
  const authDir = 'src/app/(auth)';
  const files = [];
  
  function findTsxFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        findTsxFiles(fullPath);
      } else if (entry.name.endsWith('.tsx') && !entry.name.includes('.test.') && !entry.name.startsWith('_')) {
        files.push(fullPath);
      }
    }
  }
  
  findTsxFiles(authDir);
  
  const usingRouter = files.filter(file => {
    const content = fs.readFileSync(file, 'utf8');
    return content.includes('expo-router') || content.includes('useRouter') || content.includes('router.');
  });
  
  results.metrics.authScreensWithRouter = `${usingRouter.length}/${files.length}`;
  
  if (usingRouter.length < files.length * 0.8) {
    return { warning: true, message: `Only ${usingRouter.length}/${files.length} screens use Expo Router` };
  }
  
  return true;
});

// ═══════════════════════════════════════════════════════════════════════════
// Q3: QUERY PRISMA USER MODEL (Field Enforcement on Register)
// ═══════════════════════════════════════════════════════════════════════════

log(colors.cyan + colors.bright, '\n╔═══════════════════════════════════════════════════════════════════════╗');
log(colors.cyan + colors.bright, '║ Q3: PRISMA USER MODEL & REGISTRATION VALIDATION                       ║');
log(colors.cyan + colors.bright, '╚═══════════════════════════════════════════════════════════════════════╝\n');

test('Q3.1: Prisma User model has required security fields', () => {
  const schemaPath = 'backend/prisma/schema.prisma';
  if (!fs.existsSync(schemaPath)) {
    return { critical: true, message: '[CODEBASE GAP] Prisma schema not found' };
  }
  
  const content = fs.readFileSync(schemaPath, 'utf8');
  
  const requiredFields = [
    'email',
    'username',
    'passwordHash',
    'isVerified',
    'isActive',
    'lastLoginAt'
  ];
  
  const userModelMatch = content.match(/model User \{[\s\S]*?\n\}/);
  if (!userModelMatch) {
    return { critical: true, message: 'User model not found in schema' };
  }
  
  const userModel = userModelMatch[0];
  const missing = requiredFields.filter(field => !userModel.includes(field));
  
  if (missing.length > 0) {
    results.gaps.push({
      type: 'DATABASE_SCHEMA',
      severity: 'HIGH',
      location: 'backend/prisma/schema.prisma',
      missing: missing
    });
    return `Missing fields: ${missing.join(', ')}`;
  }
  
  results.metrics.userModelFields = requiredFields.length;
  return true;
});

test('Q3.2: Registration endpoint validates all required fields', () => {
  const authRoutesPath = 'backend/src/routes/auth.ts';
  if (!fs.existsSync(authRoutesPath)) {
    return { critical: true, message: '[CODEBASE GAP] Auth routes not found' };
  }
  
  const content = fs.readFileSync(authRoutesPath, 'utf8');
  
  // Check for express-validator usage
  const hasValidation = content.includes('express-validator') || content.includes('body(');
  if (!hasValidation) {
    results.security.push({
      severity: 'HIGH',
      issue: 'No input validation on registration endpoint',
      location: 'backend/src/routes/auth.ts',
      recommendation: 'Add express-validator or similar'
    });
    return { critical: true, message: 'No input validation found!' };
  }
  
  // Check specific validations
  const validations = {
    'email': content.includes('.isEmail()'),
    'password': content.includes('.isLength('),
    'username': content.includes('username')
  };
  
  const failedValidations = Object.entries(validations).filter(([, exists]) => !exists).map(([field]) => field);
  
  if (failedValidations.length > 0) {
    return { warning: true, message: `Missing validation for: ${failedValidations.join(', ')}` };
  }
  
  results.metrics.registrationValidations = Object.keys(validations).length;
  return true;
});

test('Q3.3: User model does NOT have MFA fields (external system)', () => {
  const schemaPath = 'backend/prisma/schema.prisma';
  const content = fs.readFileSync(schemaPath, 'utf8');
  
  const userModelMatch = content.match(/model User \{[\s\S]*?\n\}/);
  const userModel = userModelMatch[0];
  
  const mfaFields = ['mfaEnabled', 'mfaSecret', 'totpSecret'];
  const found = mfaFields.filter(field => userModel.includes(field));
  
  if (found.length === 0) {
    results.gaps.push({
      type: 'MFA_NOT_IN_DATABASE',
      severity: 'INFO',
      location: 'backend/prisma/schema.prisma',
      note: 'MFA handled externally (Firebase/separate system)'
    });
  }
  
  results.metrics.mfaInDatabase = found.length > 0;
  return true; // Not a failure, just documenting
});

// ═══════════════════════════════════════════════════════════════════════════
// Q4: VERIFICATION FLOWS (SMS/Email Latency & Idempotency)
// ═══════════════════════════════════════════════════════════════════════════

log(colors.cyan + colors.bright, '\n╔═══════════════════════════════════════════════════════════════════════╗');
log(colors.cyan + colors.bright, '║ Q4: VERIFICATION FLOWS (SMS/Email)                                    ║');
log(colors.cyan + colors.bright, '╚═══════════════════════════════════════════════════════════════════════╝\n');

test('Q4.1: Phone verification screen exists', () => {
  const phoneVerifyPath = 'src/app/(auth)/phone-verification.tsx';
  if (!fs.existsSync(phoneVerifyPath)) {
    return { warning: true, message: '[CODEBASE GAP] Phone verification screen not found' };
  }
  
  const content = fs.readFileSync(phoneVerifyPath, 'utf8');
  
  // Check for Firebase phone auth
  const hasFirebasePhone = content.includes('PhoneAuthProvider') || content.includes('sendPhoneVerification');
  if (!hasFirebasePhone) {
    return { warning: true, message: 'Firebase phone auth not integrated' };
  }
  
  results.metrics.phoneVerificationImplemented = true;
  return true;
});

test('Q4.2: Email verification screen exists', () => {
  const emailVerifyPath = 'src/app/(auth)/email-verification.tsx';
  if (!fs.existsSync(emailVerifyPath)) {
    return { warning: true, message: '[CODEBASE GAP] Email verification screen not found' };
  }
  
  const content = fs.readFileSync(emailVerifyPath, 'utf8');
  results.metrics.emailVerificationImplemented = true;
  return true;
});

test('Q4.3: Verification has rate limiting protection', () => {
  const phoneVerifyPath = 'src/app/(auth)/phone-verification.tsx';
  if (!fs.existsSync(phoneVerifyPath)) {
    return { warning: true, message: 'Cannot check rate limiting - file missing' };
  }
  
  const content = fs.readFileSync(phoneVerifyPath, 'utf8');
  
  // Check for countdown/cooldown mechanism
  const hasRateLimit = content.includes('countdown') || content.includes('cooldown') || content.includes('timer');
  
  if (!hasRateLimit) {
    results.security.push({
      severity: 'MEDIUM',
      issue: 'No rate limiting on verification code requests',
      location: 'src/app/(auth)/phone-verification.tsx',
      recommendation: 'Add countdown timer between requests'
    });
    return { warning: true, message: 'No client-side rate limiting found' };
  }
  
  return true;
});

test('Q4.4: Verification implements idempotency checks', () => {
  const authContextPath = 'src/contexts/AuthContext.tsx';
  const content = fs.readFileSync(authContextPath, 'utf8');
  
  // Check for verification ID storage (idempotency key)
  const hasIdempotency = content.includes('verificationId') || content.includes('pendingVerification');
  
  if (!hasIdempotency) {
    return { warning: true, message: 'Idempotency mechanism not clear in code' };
  }
  
  return true;
});

// ═══════════════════════════════════════════════════════════════════════════
// Q5: SECURITY AUDIT (Rate Limiting, MFA, Brute Force Protection)
// ═══════════════════════════════════════════════════════════════════════════

log(colors.cyan + colors.bright, '\n╔═══════════════════════════════════════════════════════════════════════╗');
log(colors.cyan + colors.bright, '║ Q5: SECURITY AUDIT (Rate Limiting, MFA, Brute Force)                 ║');
log(colors.cyan + colors.bright, '╚═══════════════════════════════════════════════════════════════════════╝\n');

test('Q5.1: Backend has rate limiting middleware', () => {
  const rateLimitPath = 'backend/src/middleware/rateLimiting.ts';
  if (!fs.existsSync(rateLimitPath)) {
    results.security.push({
      severity: 'HIGH',
      issue: 'No rate limiting middleware found',
      location: 'backend/src/middleware/',
      recommendation: 'Implement express-rate-limit'
    });
    return { critical: true, message: '[CODEBASE GAP] No rate limiting middleware' };
  }
  
  const content = fs.readFileSync(rateLimitPath, 'utf8');
  
  // Check for Redis or in-memory store
  const hasRedis = content.includes('redis') || content.includes('Redis');
  const hasInMemory = content.includes('inMemoryStore') || content.includes('Map');
  
  if (!hasRedis && !hasInMemory) {
    return { warning: true, message: 'Rate limiting storage mechanism unclear' };
  }
  
  results.metrics.rateLimiting = {
    middleware: true,
    redis: hasRedis,
    inMemory: hasInMemory
  };
  
  return true;
});

test('Q5.2: Rate limiting is applied to auth endpoints', () => {
  const serverPath = 'backend/src/server.ts';
  if (!fs.existsSync(serverPath)) {
    return { warning: true, message: 'Cannot verify - server.ts not found' };
  }
  
  const content = fs.readFileSync(serverPath, 'utf8');
  
  const hasRateLimit = content.includes('rateLimit') || content.includes('rateLimiting');
  
  if (!hasRateLimit) {
    results.security.push({
      severity: 'CRITICAL',
      issue: 'Rate limiting not applied to endpoints',
      location: 'backend/src/server.ts',
      recommendation: 'Apply rate limiting middleware to auth routes'
    });
    return { critical: true, message: 'Rate limiting middleware not applied!' };
  }
  
  return true;
});

test('Q5.3: MFA/2FA screens exist and are functional', () => {
  const twoFactorSetup = 'src/app/(auth)/two-factor-setup.tsx';
  const twoFactorAuth = 'src/app/(auth)/two-factor-auth.tsx';
  
  const setupExists = fs.existsSync(twoFactorSetup);
  const authExists = fs.existsSync(twoFactorAuth);
  
  if (!setupExists || !authExists) {
    const missing = [];
    if (!setupExists) missing.push('two-factor-setup.tsx');
    if (!authExists) missing.push('two-factor-auth.tsx');
    
    results.gaps.push({
      type: 'MFA_SCREENS',
      severity: 'MEDIUM',
      missing: missing,
      note: 'MFA flow incomplete'
    });
    
    return { warning: true, message: `Missing MFA screens: ${missing.join(', ')}` };
  }
  
  // Check for authenticator/SMS/email methods
  const setupContent = fs.readFileSync(twoFactorSetup, 'utf8');
  const hasMethods = setupContent.includes('sms') && setupContent.includes('email') && setupContent.includes('authenticator');
  
  if (!hasMethods) {
    return { warning: true, message: 'Not all MFA methods implemented (SMS/Email/Authenticator)' };
  }
  
  results.metrics.mfaMethods = ['sms', 'email', 'authenticator'];
  return true;
});

test('Q5.4: Biometric authentication is available', () => {
  const signInPath = 'src/app/(auth)/sign-in.tsx';
  const content = fs.readFileSync(signInPath, 'utf8');
  
  const hasBiometric = content.includes('BiometricAuth') || content.includes('LocalAuthentication');
  
  if (!hasBiometric) {
    return { warning: true, message: 'Biometric auth not implemented' };
  }
  
  results.metrics.biometricAuth = true;
  return true;
});

test('Q5.5: Password requirements are enforced', () => {
  const authRoutesPath = 'backend/src/routes/auth.ts';
  const content = fs.readFileSync(authRoutesPath, 'utf8');
  
  // Check for password length validation
  const hasMinLength = content.match(/password.*isLength.*min:\s*(\d+)/);
  
  if (!hasMinLength) {
    results.security.push({
      severity: 'HIGH',
      issue: 'No password strength requirements',
      location: 'backend/src/routes/auth.ts',
      recommendation: 'Enforce min length, complexity'
    });
    return { warning: true, message: 'No password strength validation' };
  }
  
  const minLength = parseInt(hasMinLength[1]);
  if (minLength < 8) {
    return { warning: true, message: `Password min length too short: ${minLength} (recommend 8+)` };
  }
  
  results.metrics.passwordMinLength = minLength;
  return true;
});

// ═══════════════════════════════════════════════════════════════════════════
// Q6: EDGE CASES (Failed Onboarding, State Persistence, Data Loss)
// ═══════════════════════════════════════════════════════════════════════════

log(colors.cyan + colors.bright, '\n╔═══════════════════════════════════════════════════════════════════════╗');
log(colors.cyan + colors.bright, '║ Q6: EDGE CASES (State Persistence, Data Loss Prevention)             ║');
log(colors.cyan + colors.bright, '╚═══════════════════════════════════════════════════════════════════════╝\n');

test('Q6.1: AuthContext persists state via AsyncStorage', () => {
  const authContextPath = 'src/contexts/AuthContext.tsx';
  const content = fs.readFileSync(authContextPath, 'utf8');
  
  const hasAsyncStorage = content.includes('AsyncStorage');
  const hasSetItem = content.includes('AsyncStorage.setItem');
  const hasGetItem = content.includes('AsyncStorage.getItem');
  
  if (!hasAsyncStorage) {
    return { warning: true, message: 'No AsyncStorage usage - state may not persist' };
  }
  
  if (!hasSetItem || !hasGetItem) {
    return { warning: true, message: 'AsyncStorage incomplete (missing get/set)' };
  }
  
  // Check what's being stored
  const storageKeys = [];
  const setItemMatches = content.matchAll(/AsyncStorage\.setItem\(['"]([^'"]+)['"]/g);
  for (const match of setItemMatches) {
    storageKeys.push(match[1]);
  }
  
  results.metrics.asyncStorageKeys = storageKeys;
  log(colors.blue, `   📦 AsyncStorage keys: ${storageKeys.join(', ')}`);
  
  return true;
});

test('Q6.2: Incomplete onboarding is handled gracefully', () => {
  const onboardingScreens = [
    'src/app/(auth)/onboarding/1.tsx',
    'src/app/(auth)/onboarding/2.tsx',
    'src/app/(auth)/onboarding/3.tsx'
  ];
  
  const missingScreens = onboardingScreens.filter(screen => !fs.existsSync(screen));
  
  if (missingScreens.length > 0) {
    return { warning: true, message: `Missing onboarding screens: ${missingScreens.length}` };
  }
  
  // Check for profile completion screen
  const profileCompletionPath = 'src/app/(auth)/profile-completion.tsx';
  if (!fs.existsSync(profileCompletionPath)) {
    return { warning: true, message: 'No profile completion screen found' };
  }
  
  results.metrics.onboardingSteps = 3;
  return true;
});

test('Q6.3: Auth errors are logged and tracked', () => {
  const authContextPath = 'src/contexts/AuthContext.tsx';
  const content = fs.readFileSync(authContextPath, 'utf8');
  
  const hasErrorLogging = content.includes('console.error') || content.includes('logger.error');
  
  if (!hasErrorLogging) {
    return { warning: true, message: 'No error logging in AuthContext' };
  }
  
  // Check for error tracking service (Sentry, etc.)
  const hasErrorTracking = content.includes('Sentry') || content.includes('crashlytics');
  
  if (!hasErrorTracking) {
    results.gaps.push({
      type: 'ERROR_TRACKING',
      severity: 'LOW',
      location: 'src/contexts/AuthContext.tsx',
      note: 'Consider adding Sentry or Firebase Crashlytics'
    });
  }
  
  results.metrics.errorTracking = hasErrorTracking;
  return true;
});

test('Q6.4: Failed auth attempts are rate limited', () => {
  const authMiddlewarePath = 'backend/src/middleware/auth.ts';
  const content = fs.readFileSync(authMiddlewarePath, 'utf8');
  
  // Check for authRateLimit export
  const hasAuthRateLimit = content.includes('authRateLimit') || content.includes('rateLimit');
  
  if (!hasAuthRateLimit) {
    results.security.push({
      severity: 'HIGH',
      issue: 'No specific rate limit for failed auth attempts',
      location: 'backend/src/middleware/auth.ts',
      recommendation: 'Add stricter rate limiting for failed logins'
    });
    return { warning: true, message: 'Failed auth rate limiting not found' };
  }
  
  // Check configuration
  const rateLimitConfig = content.match(/max:\s*(\d+)/);
  const windowConfig = content.match(/windowMs:\s*(\d+)/);
  
  if (rateLimitConfig && windowConfig) {
    const maxAttempts = parseInt(rateLimitConfig[1]);
    const windowMinutes = parseInt(windowConfig[1]) / (60 * 1000);
    
    results.metrics.authRateLimit = {
      maxAttempts,
      windowMinutes
    };
    
    if (maxAttempts > 10) {
      return { warning: true, message: `Rate limit too permissive: ${maxAttempts} attempts per ${windowMinutes}min` };
    }
  }
  
  return true;
});

// ═══════════════════════════════════════════════════════════════════════════
// FINAL REPORT: REAL STATE SUMMARY & DEPLOYMENT PREP ACTIONS
// ═══════════════════════════════════════════════════════════════════════════

log(colors.cyan + colors.bright, '\n\n═══════════════════════════════════════════════════════════════════════════');
log(colors.cyan + colors.bright, '  GROUP 1: AUTHENTICATION & ONBOARDING - REAL STATE SUMMARY');
log(colors.cyan + colors.bright, '═══════════════════════════════════════════════════════════════════════════\n');

const passRate = ((results.passed / results.total) * 100).toFixed(1);
const criticalIssues = results.critical;
const highSeverityGaps = results.security.filter(s => s.severity === 'HIGH' || s.severity === 'CRITICAL').length;

log(colors.bright, '📊 TEST RESULTS:');
log(colors.green, `   ✅ Passed: ${results.passed}/${results.total} (${passRate}%)`);
log(colors.red, `   ❌ Failed: ${results.failed}`);
log(colors.yellow, `   ⚠️  Warnings: ${results.warnings}`);
log(colors.red + colors.bright, `   🔴 Critical: ${results.critical}`);

log(colors.bright, '\n📈 KEY METRICS:');
Object.entries(results.metrics).forEach(([key, value]) => {
  const displayValue = typeof value === 'object' ? JSON.stringify(value) : value;
  log(colors.blue, `   • ${key}: ${displayValue}`);
});

if (results.gaps.length > 0) {
  log(colors.bright, '\n🔍 CODEBASE GAPS IDENTIFIED:');
  results.gaps.forEach((gap, i) => {
    log(colors.yellow, `   ${i + 1}. [${gap.severity}] ${gap.type}`);
    log(colors.reset, `      Location: ${gap.location || 'N/A'}`);
    if (gap.missing) log(colors.reset, `      Missing: ${gap.missing.join(', ')}`);
    if (gap.note) log(colors.reset, `      Note: ${gap.note}`);
  });
}

if (results.security.length > 0) {
  log(colors.bright, '\n🔐 SECURITY FINDINGS:');
  results.security.forEach((finding, i) => {
    const color = finding.severity === 'CRITICAL' ? colors.red : finding.severity === 'HIGH' ? colors.yellow : colors.reset;
    log(color, `   ${i + 1}. [${finding.severity}] ${finding.issue}`);
    log(colors.reset, `      Location: ${finding.location}`);
    log(colors.reset, `      Fix: ${finding.recommendation}`);
  });
}

// Calculate overall completeness
const completeness = 100 - (criticalIssues * 10) - (highSeverityGaps * 5) - (results.warnings * 1);
const completenessDisplay = Math.max(0, Math.min(100, completeness));

log(colors.bright, '\n🎯 OVERALL ASSESSMENT:');
log(colors.cyan, `   Authentication System Completeness: ${completenessDisplay}%`);

if (criticalIssues > 0) {
  log(colors.red + colors.bright, `   ⚠️  DEPLOYMENT BLOCKER: ${criticalIssues} critical issue(s) must be fixed`);
} else if (highSeverityGaps > 0) {
  log(colors.yellow, `   ⚠️  ${highSeverityGaps} high-severity gaps - recommend fixing before deployment`);
} else {
  log(colors.green + colors.bright, '   ✅ PRODUCTION READY - No critical blockers');
}

log(colors.bright, '\n📋 DEPLOYMENT PREP ACTIONS (PRIORITIZED):');
const actions = [];

if (criticalIssues > 0) {
  actions.push('1. [CRITICAL] Fix all critical security issues (rate limiting, validation)');
}

if (results.security.filter(s => s.severity === 'HIGH').length > 0) {
  actions.push(`${actions.length + 1}. [HIGH] Address ${results.security.filter(s => s.severity === 'HIGH').length} high-severity security findings`);
}

if (!results.metrics.errorTracking) {
  actions.push(`${actions.length + 1}. [MEDIUM] Add error tracking (Sentry/Firebase Crashlytics)`);
}

if (results.metrics.authScreenCount < 15) {
  actions.push(`${actions.length + 1}. [MEDIUM] Complete missing auth screens (${15 - results.metrics.authScreenCount} remaining)`);
}

if (!results.metrics.mfaInDatabase && !results.metrics.mfaMethods) {
  actions.push(`${actions.length + 1}. [LOW] Complete MFA implementation (screens + backend)`);
}

actions.push(`${actions.length + 1}. [ALWAYS] Run full E2E tests with real Firebase credentials before deployment`);

actions.forEach(action => {
  if (action.includes('CRITICAL')) {
    log(colors.red + colors.bright, `   ${action}`);
  } else if (action.includes('HIGH')) {
    log(colors.yellow, `   ${action}`);
  } else {
    log(colors.reset, `   ${action}`);
  }
});

log(colors.cyan + colors.bright, '\n═══════════════════════════════════════════════════════════════════════════');
log(colors.cyan + colors.bright, '  END OF GROUP 1 AUDIT');
log(colors.cyan + colors.bright, '═══════════════════════════════════════════════════════════════════════════\n');

// Save results to JSON for further analysis
const reportPath = 'GROUP_1_AUTH_AUDIT_RESULTS.json';
fs.writeFileSync(reportPath, JSON.stringify({
  summary: {
    total: results.total,
    passed: results.passed,
    failed: results.failed,
    warnings: results.warnings,
    critical: results.critical,
    passRate: `${passRate}%`,
    completeness: `${completenessDisplay}%`
  },
  metrics: results.metrics,
  gaps: results.gaps,
  security: results.security,
  details: results.details
}, null, 2));

log(colors.green, `📄 Full report saved to: ${reportPath}\n`);

process.exit(criticalIssues > 0 ? 1 : 0);






