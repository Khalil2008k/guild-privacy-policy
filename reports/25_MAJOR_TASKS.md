# 🎯 25 MAJOR TASKS - PROJECT COMPLETION ROADMAP
**Project**: GUILD-3  
**Date**: November 8, 2025  
**Priority System**: P0 (Critical) → P1 (High) → P2 (Medium) → P3 (Low)

---

## 🚨 P0 - CRITICAL (MUST FIX BEFORE LAUNCH)

### Task 1: Fix Firestore Messages Collection Security Rules ⚠️ BLOCKER
**Priority**: P0 (CRITICAL)  
**Effort**: 2 hours  
**Area**: Backend / Security  

**Current Issue**:
```javascript
// ❌ CRITICAL: Any authenticated user can read ANY message
match /messages/{messageId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
```

**Required Fix**:
```javascript
match /messages/{messageId} {
  // Get the chat document to verify participant membership
  allow read: if request.auth != null && 
    request.auth.uid in get(/databases/$(database)/documents/chats/$(resource.data.chatId)).data.participants;
  
  allow write: if request.auth != null && 
    request.auth.uid in get(/databases/$(database)/documents/chats/$(request.resource.data.chatId)).data.participants;
}
```

**Files**:
- `backend/firestore.rules` lines 35-38

**Testing**:
1. Attempt to read messages from a chat the user is not a participant in (should fail)
2. Verify legitimate participants can still read/write
3. Test with Firebase Rules Playground

**Impact**: GDPR compliance, user privacy, production blocking

---

### Task 2: Remove Hardcoded Firebase Configuration
**Priority**: P0 (CRITICAL)  
**Effort**: 4 hours  
**Area**: Frontend / Security  

**Current Issue**:
```javascript
// ❌ CRITICAL: Hardcoded in app.config.js lines 73-89
extra: {
  firebaseProjectId: 'guild-4f46b',
  firebaseWebApiKey: 'AIzaSyDxVK7TJz...',
  apiUrl: 'https://guild-yf7q.onrender.com/api/v1',
  // ... more sensitive data
}
```

**Required Fix**:
1. Move all config to `.env` files:
```bash
# .env.local
FIREBASE_PROJECT_ID=guild-4f46b
FIREBASE_API_KEY=AIzaSyDxVK7TJz...
API_URL=https://guild-yf7q.onrender.com/api/v1
```

2. Update `app.config.js` to use Expo environment variables:
```javascript
export default ({ config }) => ({
  ...config,
  extra: {
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebaseWebApiKey: process.env.FIREBASE_API_KEY,
    apiUrl: process.env.API_URL,
    eas: {
      projectId: "..." // Only non-sensitive data here
    }
  }
});
```

3. Use Expo Secrets for EAS builds:
```bash
eas secret:create --name FIREBASE_API_KEY --value "..."
```

**Files**:
- `app.config.js`
- `.env.example` (create template)
- `.env.local` (add to `.gitignore`)
- `src/config/firebase.ts` (update to use Constants.expoConfig.extra)

**Testing**:
1. Verify app boots with env vars
2. Confirm Firebase connection works
3. Test production build with EAS Secrets

**Impact**: API key security, billing protection, compliance

---

### Task 3: Add Missing Firestore Security Rules
**Priority**: P0 (CRITICAL)  
**Effort**: 6 hours  
**Area**: Backend / Security  

**Missing Collections**:
- `coins`: Product definitions
- `contracts`: Generated contracts
- `escrow`: Escrow payments
- `notifications`: User notifications
- `guilds`: Guild data

**Required Rules**:

```javascript
// coins - Read-only for authenticated users, admin write only
match /coins/{coinId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

// contracts - Only participants can access
match /contracts/{contractId} {
  allow read: if request.auth != null && 
    (request.auth.uid == resource.data.clientId || 
     request.auth.uid == resource.data.workerId ||
     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
  
  allow create: if request.auth != null &&
    (request.auth.uid == request.resource.data.clientId || 
     request.auth.uid == request.resource.data.workerId);
  
  allow update: if request.auth != null &&
    (request.auth.uid == resource.data.clientId || 
     request.auth.uid == resource.data.workerId) &&
    request.resource.data.status == 'signed';
  
  allow delete: if false; // Never delete contracts
}

// escrow - Strict ownership
match /escrow/{escrowId} {
  allow read: if request.auth != null && 
    (request.auth.uid == resource.data.clientId || 
     request.auth.uid == resource.data.workerId ||
     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
  
  allow write: if false; // Backend-only via Cloud Functions
}

// notifications - User can only access their own
match /notifications/{notificationId} {
  allow read: if request.auth != null && 
    request.auth.uid == resource.data.userId;
  
  allow write: if false; // Backend-only
}

// guilds - Public read, member write
match /guilds/{guildId} {
  allow read: if request.auth != null;
  
  allow create: if request.auth != null &&
    request.auth.uid == request.resource.data.creatorId;
  
  allow update: if request.auth != null &&
    (request.auth.uid in resource.data.members ||
     request.auth.uid == resource.data.creatorId);
  
  allow delete: if request.auth != null &&
    request.auth.uid == resource.data.creatorId;
}
```

**Files**:
- `backend/firestore.rules`

**Testing**:
1. Test each collection with unauthorized access (should fail)
2. Test authorized access (should succeed)
3. Test admin overrides where applicable
4. Run Firebase Rules Unit Tests

**Impact**: Data security, authorization, compliance

---

### Task 4: Fix Wallet Transactions Write Permissions
**Priority**: P0 (CRITICAL)  
**Effort**: 3 hours  
**Area**: Backend / Security  

**Current Issue**:
```javascript
match /wallet_transactions/{transactionId} {
  allow read: if request.auth != null && request.auth.uid == resource.data.userId;
  allow write: if request.auth != null;  // ❌ TOO PERMISSIVE!
}
```

**Required Fix**:
```javascript
match /wallet_transactions/{transactionId} {
  allow read: if request.auth != null && 
    (request.auth.uid == resource.data.userId ||
     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
  
  // ✅ Backend-only writes via Cloud Functions/Secure Backend
  allow write: if false;
}
```

**Backend Changes**:
- Ensure all transaction writes go through backend API with `admin.firestore()` (server SDK)
- Remove any frontend direct Firestore writes to `wallet_transactions`

**Files**:
- `backend/firestore.rules`
- Search for `collection(db, 'wallet_transactions')` in `src/` (should have no writes)

**Testing**:
1. Attempt frontend write to wallet_transactions (should fail)
2. Verify backend API can still write
3. Test admin read access
4. Test user read access (own transactions only)

**Impact**: Financial fraud prevention, transaction integrity

---

## 🔥 P1 - HIGH (MUST FIX WITHIN 2 WEEKS)

### Task 5: Clarify PostgreSQL/Prisma Status
**Priority**: P1 (HIGH)  
**Effort**: 4 hours  
**Area**: Backend / Infrastructure  

**Current State**:
- Prisma client import commented out in `server.ts` line 16
- `prisma/schema.prisma` exists with Guild models
- `guilds.ts` routes import PrismaClient and GuildService

**Required Actions**:
1. **Decision**: Enable PostgreSQL or remove?
2. **If Enable**:
   - Uncomment Prisma import
   - Set up PostgreSQL database (connection string in `.env`)
   - Run `npx prisma migrate deploy`
   - Test guild operations
3. **If Remove**:
   - Migrate Guild data model to Firestore
   - Remove Prisma dependencies
   - Update `guilds.ts` routes to use Firestore
   - Remove `prisma/` directory

**Files**:
- `backend/src/server.ts` line 16
- `backend/src/routes/guilds.ts`
- `backend/src/services/GuildService.ts`
- `backend/prisma/schema.prisma`
- `backend/.env` (DATABASE_URL)

**Testing**:
1. If enabled: Test guild CRUD operations
2. If removed: Test guild CRUD with Firestore

**Impact**: Guild system functionality, data persistence

---

### Task 6: Clarify Redis Usage and Configuration
**Priority**: P1 (HIGH)  
**Effort**: 3 hours  
**Area**: Backend / Infrastructure  

**Current State**:
- Redis imported in `server.ts` (line 18-20)
- Connection not verified
- Usage unclear (caching? sessions? rate limiting?)

**Required Actions**:
1. **Verify**: Is Redis actually used?
2. **Search codebase** for Redis usage patterns
3. **If Used**:
   - Document what it's for (sessions, caching, pub/sub)
   - Ensure `REDIS_URL` is set in `.env`
   - Add connection health check
   - Add Redis to deployment (Docker, Kubernetes, managed service)
4. **If Unused**:
   - Remove Redis imports and dependencies
   - Remove from `package.json`

**Files**:
- `backend/src/server.ts`
- `backend/src/config/redis.ts` (if exists)
- Search for `redis`, `RedisClient`, `ioredis` in `backend/src/`

**Testing**:
1. If used: Test Redis connection
2. If removed: Verify no broken imports

**Impact**: Performance, session management, deployment complexity

---

### Task 7: Replace All console.log with Structured Logging
**Priority**: P1 (HIGH)  
**Effort**: 8 hours  
**Area**: Frontend + Backend / Code Quality  

**Current State**:
- Extensive `console.log` usage throughout codebase
- May leak sensitive data in production
- No structured logging for debugging

**Required Actions**:
1. **Frontend**:
   - Replace `console.log` → `logger.info`
   - Replace `console.error` → `logger.error`
   - Replace `console.warn` → `logger.warn`
   - Existing logger: `src/utils/logger.ts`

2. **Backend**:
   - Existing Winston logger: `backend/src/utils/logger.ts`
   - Already in use in some files
   - Ensure all files use it

3. **Search and Replace**:
```bash
# Find all console statements
grep -r "console\." src/ backend/src/ --exclude-dir=node_modules

# Example replacements:
console.log('User:', user) → logger.debug('User:', user)
console.error('Failed:', err) → logger.error('Failed:', err)
```

**Files**:
- All `src/**/*.ts`, `src/**/*.tsx`
- All `backend/src/**/*.ts`
- Existing loggers already present, just need migration

**Testing**:
1. Verify logs still appear in development
2. Verify sensitive data (tokens, passwords) not logged
3. Test log levels (debug, info, warn, error)

**Impact**: Production debugging, security (no sensitive data leaks)

---

### Task 8: Add Integration Tests for Critical User Flows
**Priority**: P1 (HIGH)  
**Effort**: 20 hours  
**Area**: Testing  

**Target Flows**:
1. **Auth Flow**: Signup → Email Verify → Profile Complete → Login → Biometric Setup
2. **Job Posting Flow**: Create Job → Admin Approval → Publish → Receive Applications
3. **Job Completion Flow**: Accept Application → Chat → Complete Job → Payment → Review
4. **Payment Flow**: Coin Purchase → Sadad Checkout → Webhook → Balance Update
5. **Chat Flow**: Start Chat → Send Message → Send Media → Read Receipt

**Test Framework**: Jest + Supertest (backend), Detox/Maestro (E2E frontend)

**Files to Create**:
- `backend/src/tests/integration/auth.integration.test.ts`
- `backend/src/tests/integration/job.integration.test.ts`
- `backend/src/tests/integration/payment.integration.test.ts`
- `backend/src/tests/integration/chat.integration.test.ts`
- `e2e/tests/auth-flow.e2e.test.ts` (Detox)
- `e2e/tests/job-posting-flow.e2e.test.ts`

**Coverage Target**: 80% for critical flows

**Testing**:
1. Run integration tests in CI/CD
2. Mock external services (Sadad, Twilio, Firebase)
3. Use test database

**Impact**: Regression prevention, production confidence

---

### Task 9: Add API Documentation (Swagger/OpenAPI)
**Priority**: P1 (HIGH)  
**Effort**: 12 hours  
**Area**: Backend / Documentation  

**Current State**:
- No API documentation
- 150+ endpoints undocumented
- Frontend devs rely on reading code

**Required Actions**:
1. **Install Swagger**:
```bash
npm install swagger-jsdoc swagger-ui-express
```

2. **Add JSDoc Comments** to routes:
```typescript
/**
 * @swagger
 * /api/v1/jobs:
 *   post:
 *     summary: Create a new job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateJobRequest'
 *     responses:
 *       201:
 *         description: Job created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Job'
 */
router.post('/', authenticateFirebaseToken, sanitizeJobData, async (req, res) => {
  // ... handler
});
```

3. **Generate Documentation**:
```typescript
// backend/src/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GUILD API',
      version: '1.0.0',
      description: 'Job marketplace platform API',
    },
    servers: [
      { url: 'https://guild-yf7q.onrender.com', description: 'Production' },
      { url: 'http://localhost:5000', description: 'Development' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };
```

4. **Mount in server**:
```typescript
// backend/src/server.ts
import { swaggerUi, swaggerSpec } from './swagger';
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

**Files**:
- `backend/src/swagger.ts` (new)
- All `backend/src/routes/*.ts` (add JSDoc)
- `backend/src/server.ts` (mount Swagger UI)

**Testing**:
1. Visit `http://localhost:5000/api-docs`
2. Test endpoints via Swagger UI
3. Verify request/response schemas

**Impact**: Developer productivity, onboarding, API contract clarity

---

### Task 10: Implement Automated Database Backups
**Priority**: P1 (HIGH)  
**Effort**: 6 hours  
**Area**: Infrastructure / Data Safety  

**Current State**:
- No automated backups
- Firestore has automatic backups (7-day retention)
- PostgreSQL (if enabled) has no backups

**Required Actions**:
1. **Firestore**:
   - Enable scheduled exports to Cloud Storage
   - Set up daily backups
   - Configure 30-day retention

2. **PostgreSQL** (if enabled):
   - Set up pg_dump cron job
   - Store in S3/GCS
   - Configure daily backups
   - Test restore process

3. **Redis** (if used):
   - Enable RDB/AOF persistence
   - Schedule snapshots

**Files**:
- `infrastructure/backup-scripts/firestore-backup.sh` (new)
- `infrastructure/backup-scripts/postgres-backup.sh` (new)
- `.github/workflows/backup.yml` (new - scheduled GitHub Action)

**Testing**:
1. Run backup script manually
2. Verify backup file created
3. Test restore from backup

**Impact**: Data loss prevention, disaster recovery

---

## 🟡 P2 - MEDIUM (WITHIN 4 WEEKS)

### Task 11: Break Down Large Screens (>1,000 lines)
**Priority**: P2 (MEDIUM)  
**Effort**: 16 hours  
**Area**: Frontend / Code Quality  

**Target Screens**:
- `chat/[jobId].tsx` (2,327 lines) → Break into 5+ components
- `home.tsx` (1,247 lines) → Break into 4+ components
- `profile.tsx` (1,879 lines) → Break into 6+ components
- `search.tsx` (1,209 lines) → Break into 4+ components
- `add-job.tsx` (1,826 lines) → Already modular with steps, extract more

**Approach**:
1. Identify logical sections (e.g., Header, Body, Footer, Modals)
2. Extract into separate component files
3. Create `_components/` subdirectories per screen
4. Extract custom hooks into `_hooks/` subdirectories
5. Maintain functionality (no logic changes)

**Example** (`chat/[jobId].tsx`):
```
Before:
- chat/[jobId].tsx (2,327 lines)

After:
- chat/[jobId].tsx (400 lines - main orchestrator)
- chat/_components/ChatHeader.tsx (200 lines)
- chat/_components/MessageList.tsx (300 lines)
- chat/_components/ChatInput.tsx (250 lines)
- chat/_components/MediaViewer.tsx (200 lines)
- chat/_hooks/useChatMessages.ts (150 lines)
- chat/_hooks/useChatActions.ts (150 lines)
```

**Files**:
- Refactor 5+ large screens

**Testing**:
1. Manual testing of each screen
2. Verify no regressions
3. Check performance (should improve)

**Impact**: Maintainability, readability, performance (smaller bundles)

---

### Task 12: Remove Commented-Out Code
**Priority**: P2 (MEDIUM)  
**Effort**: 4 hours  
**Area**: Code Quality  

**Current State**:
- Numerous commented-out code blocks
- Unclear if they're needed or obsolete

**Required Actions**:
1. **Search for commented code**:
```bash
grep -r "// *[a-zA-Z]" src/ backend/src/ | grep -v "///" | wc -l
```

2. **Review each block**:
   - If obsolete → Delete
   - If needed later → Create TODO issue in GitHub, then delete
   - If needed now → Uncomment and fix

3. **Document decisions** in commit messages

**Files**:
- All `src/**/*.ts`, `src/**/*.tsx`
- All `backend/src/**/*.ts`

**Testing**:
1. Run full test suite
2. Manual smoke testing

**Impact**: Code clarity, reduced confusion

---

### Task 13: Resolve All TODO Comments
**Priority**: P2 (MEDIUM)  
**Effort**: 12 hours  
**Area**: Code Quality  

**Current State**:
- ~50+ TODO comments scattered throughout codebase

**Required Actions**:
1. **Find all TODOs**:
```bash
grep -rn "TODO\|FIXME\|HACK\|WIP" src/ backend/src/ --exclude-dir=node_modules > todos.txt
```

2. **Categorize**:
   - **Fix Now**: Simple fixes (<30 min each)
   - **Create Issue**: Complex features (create GitHub issue)
   - **Remove**: No longer relevant

3. **Address**:
   - Fix 80% immediately
   - Create GitHub issues for 20%
   - Remove all TODO comments from code

**Example TODOs Found**:
```typescript
// TODO: Add pagination ← Create Issue #123
// FIXME: Handle edge case ← Fix now
// HACK: Temporary solution ← Refactor or document why it's needed
```

**Files**:
- All source files

**Testing**:
1. Verify fixes don't break existing functionality
2. Test new features added

**Impact**: Code quality, feature completeness

---

### Task 14: Add JSDoc Comments to All Services
**Priority**: P2 (MEDIUM)  
**Effort**: 10 hours  
**Area**: Documentation  

**Current State**:
- 97 service modules
- Inconsistent documentation

**Required Actions**:
1. **Add JSDoc to all exported functions**:
```typescript
/**
 * Creates a new job posting
 * 
 * @param {CreateJobRequest} jobData - Job details
 * @param {string} userId - ID of the user creating the job
 * @returns {Promise<Job>} Created job object
 * @throws {ValidationError} If job data is invalid
 * @throws {InsufficientFundsError} If user lacks coins for promotion
 * 
 * @example
 * const job = await jobService.createJob({
 *   title: 'Fix my sink',
 *   budget: 100,
 *   category: 'plumbing'
 * }, 'user123');
 */
export async function createJob(jobData: CreateJobRequest, userId: string): Promise<Job> {
  // ...
}
```

2. **Document Service Classes**:
```typescript
/**
 * JobService - Manages job postings, applications, and completions
 * 
 * Responsibilities:
 * - Create, read, update, delete jobs
 * - Handle job applications and acceptance
 * - Manage job status transitions
 * - Calculate and deduct promotion costs
 * 
 * Dependencies:
 * - Firestore (jobs collection)
 * - CoinJobService (promotions)
 * - NotificationService (alerts)
 */
export class JobService {
  // ...
}
```

**Files**:
- All `backend/src/services/**/*.ts`
- All `src/services/**/*.ts`

**Testing**:
- No functional changes, documentation only

**Impact**: Developer onboarding, code understanding

---

### Task 15: Optimize Bundle Size
**Priority**: P2 (MEDIUM)  
**Effort**: 8 hours  
**Area**: Frontend / Performance  

**Current State**:
- Bundle size: ~15-20 MB (estimated)
- No code splitting
- All dependencies bundled

**Required Actions**:
1. **Analyze Bundle**:
```bash
npx expo export --platform ios --output-dir ./dist
npx react-native-bundle-visualizer
```

2. **Lazy Load Heavy Screens**:
```typescript
// Before
import ChatScreen from './(modals)/chat/[jobId]';

// After
const ChatScreen = React.lazy(() => import('./(modals)/chat/[jobId]'));
```

3. **Remove Unused Dependencies**:
```bash
npx depcheck
```

4. **Optimize Images**:
   - Compress large images
   - Use WebP format
   - Implement progressive loading

5. **Tree-Shaking**:
   - Import only needed functions (e.g., `import { X } from 'lucide-react-native'` not `import * as Icons`)

**Files**:
- `app.json` (metro.config.js if exists)
- All import statements

**Testing**:
1. Verify app still functions
2. Measure bundle size reduction
3. Test on slow network (3G)

**Impact**: App startup time, download size, user experience

---

### Task 16: Implement Error Boundary for Frontend
**Priority**: P2 (MEDIUM)  
**Effort**: 4 hours  
**Area**: Frontend / Error Handling  

**Current State**:
- No global error boundary
- App crashes propagate to user

**Required Actions**:
1. **Create Error Boundary**:
```typescript
// src/components/ErrorBoundary.tsx
import React from 'react';
import { View, Text, Button } from 'react-native';
import { logger } from '@/utils/logger';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary caught error:', error, errorInfo);
    // Send to crash reporting (Sentry, Crashlytics)
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Something went wrong</Text>
          <Button title="Restart App" onPress={() => this.setState({ hasError: false, error: null })} />
        </View>
      );
    }

    return this.props.children;
  }
}
```

2. **Wrap Root Component**:
```typescript
// app/_layout.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          {/* ... */}
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

**Files**:
- `src/components/ErrorBoundary.tsx` (new)
- `app/_layout.tsx`

**Testing**:
1. Trigger intentional error
2. Verify error boundary catches it
3. Verify user sees friendly message

**Impact**: User experience, crash prevention

---

### Task 17: Add Rate Limiting to Critical Endpoints
**Priority**: P2 (MEDIUM)  
**Effort**: 6 hours  
**Area**: Backend / Security  

**Current State**:
- Basic rate limiting in `server.ts`
- No endpoint-specific limits

**Required Actions**:
1. **Install express-rate-limit** (already installed)
2. **Add Strict Limits to**:
   - `/api/v1/auth/signup` → 5 requests/hour per IP
   - `/api/v1/auth/login` → 10 requests/15min per IP
   - `/api/v1/payments/**` → 20 requests/hour per user
   - `/api/v1/jobs` (POST) → 50 requests/day per user
   - `/api/v1/chat/messages` (POST) → 100 requests/min per user

3. **Implement**:
```typescript
// backend/src/middleware/rateLimits.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis';

export const authLimiter = rateLimit({
  store: new RedisStore({ client: redis }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many authentication attempts, please try again later.',
});

export const paymentLimiter = rateLimit({
  store: new RedisStore({ client: redis }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Too many payment requests, please try again later.',
});
```

4. **Apply to Routes**:
```typescript
// backend/src/routes/auth.ts
router.post('/login', authLimiter, async (req, res) => {
  // ...
});
```

**Files**:
- `backend/src/middleware/rateLimits.ts` (new)
- `backend/src/routes/auth.ts`
- `backend/src/routes/payments.routes.ts`
- `backend/src/routes/jobs.ts`

**Testing**:
1. Make 11 requests to `/api/v1/auth/login` in 15 minutes (should fail on 11th)
2. Verify rate limit headers in response
3. Test after window expires

**Impact**: DDoS prevention, abuse protection

---

### Task 18: Add Monitoring and Alerting (Sentry/DataDog)
**Priority**: P2 (MEDIUM)  
**Effort**: 6 hours  
**Area**: Infrastructure / Observability  

**Current State**:
- No error tracking
- No performance monitoring
- No alerting

**Required Actions**:
1. **Install Sentry**:
```bash
# Frontend
npx expo install @sentry/react-native

# Backend
npm install @sentry/node @sentry/tracing
```

2. **Configure Frontend**:
```typescript
// app/_layout.tsx
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

3. **Configure Backend**:
```typescript
// backend/src/server.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Add before routes
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// Add before other error handlers
app.use(Sentry.Handlers.errorHandler());
```

4. **Set Up Alerts**:
   - Error rate > 1% → Email/Slack
   - Response time > 2s → Email/Slack
   - Payment failures → Immediate alert

**Files**:
- `app/_layout.tsx`
- `backend/src/server.ts`
- `.env` (add `SENTRY_DSN`)

**Testing**:
1. Trigger test error
2. Verify error appears in Sentry dashboard
3. Test alert notification

**Impact**: Production visibility, proactive issue detection

---

### Task 19: Add Unit Tests for Services (80% Coverage)
**Priority**: P2 (MEDIUM)  
**Effort**: 24 hours  
**Area**: Testing  

**Current State**:
- 97 service modules
- ~5-10 service tests exist
- Coverage: ~10-20%

**Target**: 80% coverage for all services

**Required Actions**:
1. **Install Coverage Tool**:
```bash
npm install --save-dev jest-coverage
```

2. **Write Tests for Each Service**:
```typescript
// backend/src/services/__tests__/jobService.test.ts
import { jobService } from '../jobService';
import { db } from '../../config/firebase';

jest.mock('../../config/firebase');

describe('JobService', () => {
  describe('createJob', () => {
    it('should create a job with valid data', async () => {
      const mockJobData = {
        title: 'Fix my sink',
        budget: 100,
        category: 'plumbing',
      };
      
      const mockJob = { id: 'job123', ...mockJobData };
      (db.collection as jest.Mock).mockReturnValue({
        add: jest.fn().mockResolvedValue({ id: 'job123' }),
      });
      
      const result = await jobService.createJob(mockJobData, 'user123');
      
      expect(result).toMatchObject(mockJobData);
      expect(result.id).toBe('job123');
    });
    
    it('should throw error if budget is negative', async () => {
      const mockJobData = {
        title: 'Fix my sink',
        budget: -100,
        category: 'plumbing',
      };
      
      await expect(jobService.createJob(mockJobData, 'user123')).rejects.toThrow('Invalid budget');
    });
  });
});
```

3. **Run Coverage Report**:
```bash
npm run test:coverage
```

4. **Target Services** (prioritize by criticality):
   - `jobService`
   - `CoinService`, `CoinWalletService`
   - `SadadPaymentService`, `AppleIAPService`
   - `chatService`
   - `GuildService`
   - `FirebaseService`, `GIDService`

**Files**:
- Create `__tests__/` in each service directory
- `backend/jest.config.js` (update coverage thresholds)

**Testing**:
1. Run tests: `npm test`
2. Check coverage: `npm run test:coverage`
3. Aim for 80% line coverage

**Impact**: Code quality, regression prevention, refactoring confidence

---

### Task 20: Implement Feature Flags
**Priority**: P2 (MEDIUM)  
**Effort**: 8 hours  
**Area**: Infrastructure / Release Management  

**Current State**:
- No feature flag system
- New features require new releases

**Required Actions**:
1. **Install LaunchDarkly / Unleash / Custom**:
```bash
npm install launchdarkly-node-server-sdk
npm install launchdarkly-react-native-client-sdk
```

2. **Create Feature Flag Service**:
```typescript
// backend/src/services/FeatureFlagService.ts
import LaunchDarkly from 'launchdarkly-node-server-sdk';

export class FeatureFlagService {
  private client: LaunchDarkly.LDClient;
  
  async initialize() {
    this.client = LaunchDarkly.init(process.env.LAUNCHDARKLY_SDK_KEY!);
    await this.client.waitForInitialization();
  }
  
  async isEnabled(flagKey: string, userId: string): Promise<boolean> {
    const user = { key: userId };
    return await this.client.variation(flagKey, user, false);
  }
}

export const featureFlagService = new FeatureFlagService();
```

3. **Use in Code**:
```typescript
// Example: Gradual rollout of new payment flow
if (await featureFlagService.isEnabled('new-payment-flow', userId)) {
  return await newPaymentFlow();
} else {
  return await oldPaymentFlow();
}
```

4. **Define Flags**:
   - `guild-court-enabled`: Enable/disable Guild Court feature
   - `escrow-payments-enabled`: Enable/disable escrow payments
   - `demo-mode-enabled`: Enable/disable demo mode
   - `new-chat-ui-enabled`: A/B test new chat UI

**Files**:
- `backend/src/services/FeatureFlagService.ts` (new)
- `src/contexts/FeatureFlagContext.tsx` (new - frontend)
- `.env` (add `LAUNCHDARKLY_SDK_KEY`)

**Testing**:
1. Toggle flag in dashboard
2. Verify feature appears/disappears
3. Test both states (on/off)

**Impact**: Safe deployments, gradual rollouts, A/B testing

---

## 🟢 P3 - LOW (NICE TO HAVE)

### Task 21: Add Storybook for Component Library
**Priority**: P3 (LOW)  
**Effort**: 12 hours  
**Area**: Frontend / Documentation  

**Current State**:
- 50+ reusable components
- No visual documentation

**Required Actions**:
1. **Install Storybook for React Native**:
```bash
npx sb init --type react-native
```

2. **Write Stories for Key Components**:
```typescript
// src/components/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import Button from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    title: 'Primary Button',
    variant: 'primary',
    onPress: () => console.log('Pressed'),
  },
};

export const Secondary: Story = {
  args: {
    title: 'Secondary Button',
    variant: 'secondary',
  },
};
```

3. **Document All Components**:
   - Button
   - JobCard
   - Input fields
   - Modals
   - Lists

**Files**:
- `.storybook/` (new directory)
- `src/components/**/*.stories.tsx` (new files)

**Testing**:
1. Run Storybook: `npm run storybook`
2. Verify components render correctly
3. Test interactive props

**Impact**: Design system documentation, component showcase

---

### Task 22: Implement E2E Tests (Detox/Maestro)
**Priority**: P3 (LOW)  
**Effort**: 20 hours  
**Area**: Testing  

**Current State**:
- No E2E tests for mobile app
- Admin portal has 1 E2E test

**Required Actions**:
1. **Install Detox**:
```bash
npm install --save-dev detox
detox init
```

2. **Write E2E Tests**:
```typescript
// e2e/auth-flow.e2e.test.ts
describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });
  
  it('should complete full signup flow', async () => {
    await element(by.id('welcome-signup-button')).tap();
    await element(by.id('signup-name-input')).typeText('Test User');
    await element(by.id('signup-email-input')).typeText('test@example.com');
    await element(by.id('signup-password-input')).typeText('password123');
    await element(by.id('signup-confirm-password-input')).typeText('password123');
    await element(by.id('signup-submit-button')).tap();
    
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(5000);
    await expect(element(by.id('home-screen'))).toBeVisible();
  });
});
```

3. **Test Critical Flows**:
   - Authentication (signup, login, logout)
   - Job posting
   - Chat
   - Payment
   - Profile editing

**Files**:
- `e2e/` (new directory)
- `.detoxrc.js` (config)
- `package.json` (add scripts)

**Testing**:
1. Run E2E tests: `npm run e2e`
2. Test on iOS simulator
3. Test on Android emulator

**Impact**: End-to-end confidence, UI regression prevention

---

### Task 23: Add Performance Monitoring (React Native Performance)
**Priority**: P3 (LOW)  
**Effort**: 6 hours  
**Area**: Frontend / Performance  

**Current State**:
- No performance metrics
- Render times unknown

**Required Actions**:
1. **Install Performance Monitoring**:
```bash
npm install @react-native-firebase/perf
```

2. **Add Traces**:
```typescript
// src/app/(modals)/add-job.tsx
import perf from '@react-native-firebase/perf';

const AddJobScreen = () => {
  useEffect(() => {
    const trace = perf().startTrace('add_job_screen_load');
    
    return () => {
      trace.stop();
    };
  }, []);
  
  const handleSubmit = async () => {
    const trace = perf().startTrace('job_submission');
    try {
      await submitJob();
    } finally {
      trace.stop();
    }
  };
};
```

3. **Monitor Key Metrics**:
   - Screen load times
   - API call durations
   - Image loading times
   - Animation frame rates

**Files**:
- All critical screens
- `firebase.json` (enable Performance Monitoring)

**Testing**:
1. Verify traces appear in Firebase Console
2. Check performance metrics
3. Identify bottlenecks

**Impact**: Performance visibility, optimization targets

---

### Task 24: Implement Deep Linking (Universal Links / App Links)
**Priority**: P3 (LOW)  
**Effort**: 8 hours  
**Area**: Frontend / UX  

**Current State**:
- No deep linking
- Cannot share direct links to jobs, profiles, etc.

**Required Actions**:
1. **Configure Expo Linking**:
```typescript
// app.config.js
export default {
  // ...
  scheme: 'guild',
  ios: {
    associatedDomains: ['applinks:guild.app'],
  },
  android: {
    intentFilters: [
      {
        action: 'VIEW',
        data: [
          { scheme: 'https', host: 'guild.app', pathPrefix: '/' },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
};
```

2. **Handle Deep Links**:
```typescript
// app/_layout.tsx
import * as Linking from 'expo-linking';

function useDeepLinking() {
  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
      const { hostname, path, queryParams } = Linking.parse(event.url);
      
      if (path === '/jobs/:id') {
        router.push(`/(modals)/job/${queryParams.id}`);
      } else if (path === '/profile/:userId') {
        router.push(`/(modals)/user-profile/${queryParams.userId}`);
      }
    };
    
    Linking.addEventListener('url', handleUrl);
    
    // Check initial URL
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });
    
    return () => Linking.removeEventListener('url', handleUrl);
  }, []);
}
```

3. **Supported Links**:
   - `https://guild.app/jobs/:id` → Job details
   - `https://guild.app/profile/:userId` → User profile
   - `https://guild.app/chat/:chatId` → Chat
   - `https://guild.app/guilds/:guildId` → Guild page

**Files**:
- `app.config.js`
- `app/_layout.tsx`
- `.well-known/apple-app-site-association` (for iOS)
- `.well-known/assetlinks.json` (for Android)

**Testing**:
1. Open link in browser (should open app)
2. Share link via SMS (should open app)
3. Test on iOS and Android

**Impact**: User acquisition, sharing, retention

---

### Task 25: Add Localization for More Languages
**Priority**: P3 (LOW)  
**Effort**: 16 hours  
**Area**: Frontend / i18n  

**Current State**:
- English and Arabic supported
- RTL implemented

**Required Actions**:
1. **Add Language Files**:
```typescript
// src/locales/fr.ts (French)
export default {
  welcome: 'Bienvenue',
  login: 'Se connecter',
  signup: "S'inscrire",
  // ... 500+ strings
};

// src/locales/es.ts (Spanish)
export default {
  welcome: 'Bienvenido',
  login: 'Iniciar sesión',
  signup: 'Registrarse',
  // ... 500+ strings
};
```

2. **Update i18n Config**:
```typescript
// src/contexts/I18nProvider.tsx
import fr from '../locales/fr';
import es from '../locales/es';

i18n.translations = {
  en,
  ar,
  fr,
  es,
};
```

3. **Add Language Selector**:
```typescript
// src/app/(modals)/settings.tsx
<Picker
  selectedValue={locale}
  onValueChange={setLocale}
>
  <Picker.Item label="English" value="en" />
  <Picker.Item label="العربية" value="ar" />
  <Picker.Item label="Français" value="fr" />
  <Picker.Item label="Español" value="es" />
</Picker>
```

4. **Target Languages**:
   - French (France, Canada, Africa)
   - Spanish (Spain, Latin America)
   - Hindi (India)
   - Urdu (Pakistan)
   - Filipino (Philippines)

**Files**:
- `src/locales/fr.ts` (new)
- `src/locales/es.ts` (new)
- `src/locales/hi.ts` (new)
- `src/contexts/I18nProvider.tsx`

**Testing**:
1. Switch to each language
2. Verify all screens display correct translations
3. Test RTL for Arabic/Urdu

**Impact**: Global reach, user base expansion

---

## 📊 SUMMARY

| Priority | Tasks | Total Effort (hours) |
|----------|-------|----------------------|
| **P0 (Critical)** | 4 | 15 |
| **P1 (High)** | 6 | 78 |
| **P2 (Medium)** | 10 | 116 |
| **P3 (Low)** | 5 | 70 |
| **TOTAL** | **25** | **279 hours (~7 weeks)** |

---

## 🚀 RECOMMENDED EXECUTION ORDER

### Week 1-2 (P0 - CRITICAL)
1. Task 1: Fix Firestore messages security rules (2h)
2. Task 2: Remove hardcoded Firebase config (4h)
3. Task 3: Add missing Firestore security rules (6h)
4. Task 4: Fix wallet transactions permissions (3h)

**Milestone**: 🔒 Security vulnerabilities eliminated

---

### Week 3-4 (P1 - HIGH Part 1)
5. Task 5: Clarify PostgreSQL/Prisma status (4h)
6. Task 6: Clarify Redis usage (3h)
7. Task 7: Replace console.log with logger (8h)
8. Task 8: Add integration tests for critical flows (20h)

**Milestone**: 🧪 Core testing infrastructure in place

---

### Week 5-6 (P1 - HIGH Part 2)
9. Task 9: Add API documentation (12h)
10. Task 10: Implement automated backups (6h)

**Milestone**: 📚 Documentation + Safety nets

---

### Week 7-10 (P2 - MEDIUM)
11. Task 11: Break down large screens (16h)
12. Task 12: Remove commented code (4h)
13. Task 13: Resolve all TODOs (12h)
14. Task 14: Add JSDoc to services (10h)
15. Task 15: Optimize bundle size (8h)
16. Task 16: Implement error boundary (4h)
17. Task 17: Add rate limiting (6h)
18. Task 18: Add monitoring (Sentry) (6h)
19. Task 19: Add unit tests (24h)
20. Task 20: Implement feature flags (8h)

**Milestone**: 🎯 Production-grade quality

---

### Week 11+ (P3 - LOW - Optional)
21. Task 21: Add Storybook (12h)
22. Task 22: Implement E2E tests (20h)
23. Task 23: Add performance monitoring (6h)
24. Task 24: Implement deep linking (8h)
25. Task 25: Add more languages (16h)

**Milestone**: 🚀 World-class product

---

## 🎯 CRITICAL PATH (MINIMUM VIABLE LAUNCH)

**To launch in production, you MUST complete**:
- ✅ All P0 tasks (Tasks 1-4) - **15 hours**
- ✅ Tasks 5-7 from P1 (Infrastructure clarity + logging) - **15 hours**
- ✅ Task 8 from P1 (Integration tests) - **20 hours**
- ✅ Task 10 from P1 (Backups) - **6 hours**
- ✅ Task 18 from P2 (Monitoring) - **6 hours**

**Minimum time to production**: ~62 hours (~1.5-2 weeks with 2-3 developers)

---

*Generated by AI Senior Engineer/CTO Audit System*  
*All tasks evidence-based from actual codebase examination*


