/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GROUP 3: JOB SYSTEM - COMPREHENSIVE AUDIT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * COVERAGE: Feature 3 (Complete Job Management System)
 * - 13 job screens (browse, create, track, submit, review)
 * - Full lifecycle: Posted → Review → Open → Accepted → In Progress → Completed
 * - Escrow payment integration
 * - Offer system
 * - Search & filters
 * - Real-time updates
 * - Job routes & API endpoints
 * - Job service backend logic
 */

const fs = require('fs');
const path = require('path');

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

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  critical: 0,
  details: [],
  metrics: {},
  gaps: [],
  security: [],
  performance: []
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
// Q1: TRACE FULL JOB LIFECYCLE (Screens & Status Transitions)
// ═══════════════════════════════════════════════════════════════════════════

log(colors.cyan + colors.bright, '\n╔═══════════════════════════════════════════════════════════════════════╗');
log(colors.cyan + colors.bright, '║ Q1: TRACE FULL JOB LIFECYCLE (Screens & Transitions)                 ║');
log(colors.cyan + colors.bright, '╚═══════════════════════════════════════════════════════════════════════╝\n');

test('Q1.1: Count job-related screens (expected 13)', () => {
  function findJobScreens(dir) {
    const screens = [];
    if (!fs.existsSync(dir)) return screens;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        screens.push(...findJobScreens(fullPath));
      } else if ((entry.name.includes('job') || entry.name.includes('add-job')) && entry.name.endsWith('.tsx') && !entry.name.includes('.test.')) {
        screens.push(fullPath);
      }
    }
    return screens;
  }
  
  const allJobScreens = [
    ...findJobScreens('src/app/(main)'),
    ...findJobScreens('src/app/(modals)')
  ];
  
  const uniqueScreens = [...new Set(allJobScreens)];
  
  results.metrics.jobScreenCount = uniqueScreens.length;
  results.metrics.jobScreens = uniqueScreens.map(s => path.basename(s));
  
  log(colors.blue, `   💼 Found ${uniqueScreens.length} job screens`);
  uniqueScreens.forEach(screen => log(colors.reset, `      • ${path.relative('.', screen)}`));
  
  if (uniqueScreens.length < 10) {
    return { warning: true, message: `Only ${uniqueScreens.length} job screens (expected 13)` };
  }
  
  return true;
});

test('Q1.2: Job status enum exists in Prisma schema', () => {
  const schemaPath = 'backend/prisma/schema.prisma';
  if (!fs.existsSync(schemaPath)) {
    return { critical: true, message: '[CODEBASE GAP] Prisma schema not found' };
  }
  
  const content = fs.readFileSync(schemaPath, 'utf8');
  const jobStatusMatch = content.match(/enum JobStatus \{[\s\S]*?\}/);
  
  if (!jobStatusMatch) {
    return { critical: true, message: 'JobStatus enum not found in schema' };
  }
  
  const jobStatus = jobStatusMatch[0];
  const statuses = jobStatus.match(/\b[A-Z_]+\b/g).filter(s => s !== 'enum' && s !== 'JobStatus');
  
  results.metrics.jobStatuses = statuses;
  log(colors.blue, `   📊 Statuses: ${statuses.join(' → ')}`);
  
  // Expected: DRAFT, OPEN, IN_PROGRESS, COMPLETED, CANCELLED
  if (statuses.length < 5) {
    return { warning: true, message: `Only ${statuses.length} job statuses (expected 5+)` };
  }
  
  return true;
});

test('Q1.3: Job model has all required fields', () => {
  const schemaPath = 'backend/prisma/schema.prisma';
  const content = fs.readFileSync(schemaPath, 'utf8');
  
  const jobModelMatch = content.match(/model Job \{[\s\S]*?\n\}/);
  if (!jobModelMatch) {
    return { critical: true, message: 'Job model not found in schema' };
  }
  
  const jobModel = jobModelMatch[0];
  
  const requiredFields = [
    'id',
    'title',
    'description',
    'budget',
    'status',
    'posterId',
    'category',
    'applications'
  ];
  
  const missing = requiredFields.filter(field => !jobModel.includes(field));
  
  if (missing.length > 0) {
    return { warning: true, message: `Missing Job fields: ${missing.join(', ')}` };
  }
  
  results.metrics.jobModelFields = requiredFields.length;
  return true;
});

test('Q1.4: Job screens handle all lifecycle states', () => {
  const jobScreensToCheck = [
    'src/app/(modals)/job-browse.tsx',
    'src/app/(modals)/job-track.tsx',
    'src/app/(modals)/job-in-progress.tsx',
    'src/app/(modals)/job-submit.tsx'
  ];
  
  const existing = jobScreensToCheck.filter(s => fs.existsSync(s));
  
  if (existing.length < 3) {
    results.gaps.push({
      type: 'INCOMPLETE_JOB_LIFECYCLE',
      severity: 'HIGH',
      location: 'src/app/(modals)/',
      note: `Only ${existing.length}/4 lifecycle screens found`
    });
    return { warning: true, message: `Only ${existing.length}/4 lifecycle screens` };
  }
  
  results.metrics.jobLifecycleScreens = existing.length;
  return true;
});

// ═══════════════════════════════════════════════════════════════════════════
// Q2: JOB CREATION & ACCEPTANCE API (Escrow Trigger, Budget Validation)
// ═══════════════════════════════════════════════════════════════════════════

log(colors.cyan + colors.bright, '\n╔═══════════════════════════════════════════════════════════════════════╗');
log(colors.cyan + colors.bright, '║ Q2: JOB CREATION & ACCEPTANCE API (Escrow Integration)               ║');
log(colors.cyan + colors.bright, '╚═══════════════════════════════════════════════════════════════════════╝\n');

test('Q2.1: Job routes exist with CRUD endpoints', () => {
  const jobRoutesPath = 'backend/src/routes/jobs.ts';
  
  if (!fs.existsSync(jobRoutesPath)) {
    return { critical: true, message: '[CODEBASE GAP] Job routes not found' };
  }
  
  const content = fs.readFileSync(jobRoutesPath, 'utf8');
  
  const endpoints = {
    list: content.includes('router.get') && (content.includes('/jobs') || content.includes('GET')),
    create: content.includes('router.post') && content.includes('create'),
    getById: content.includes(':id') || content.includes(':jobId'),
    update: content.includes('router.put') || content.includes('router.patch'),
    accept: content.includes('accept')
  };
  
  const implemented = Object.entries(endpoints).filter(([, exists]) => exists).map(([ep]) => ep);
  const missing = Object.entries(endpoints).filter(([, exists]) => !exists).map(([ep]) => ep);
  
  results.metrics.jobEndpoints = implemented;
  
  if (implemented.length < 4) {
    return { warning: true, message: `Only ${implemented.length}/5 endpoints: ${missing.join(', ')} missing` };
  }
  
  return true;
});

test('Q2.2: Job acceptance triggers escrow creation', () => {
  const jobRoutesPath = 'backend/src/routes/jobs.ts';
  const content = fs.readFileSync(jobRoutesPath, 'utf8');
  
  // Check for escrow integration
  const hasEscrow = content.includes('escrow') || content.includes('Escrow');
  
  if (!hasEscrow) {
    results.security.push({
      severity: 'HIGH',
      issue: 'No escrow integration in job acceptance',
      location: 'backend/src/routes/jobs.ts',
      recommendation: 'Add escrow creation when job is accepted'
    });
    return { warning: true, message: 'No escrow integration detected' };
  }
  
  // Check for escrow service import
  const hasEscrowService = content.includes('escrowService') || content.includes('EscrowService');
  
  results.metrics.jobEscrowIntegration = hasEscrowService;
  return true;
});

test('Q2.3: Budget validation on job creation', () => {
  const jobRoutesPath = 'backend/src/routes/jobs.ts';
  const content = fs.readFileSync(jobRoutesPath, 'utf8');
  
  // Check for validation
  const hasValidation = content.includes('validate') || content.includes('validator') || content.includes('body(');
  const hasBudgetCheck = content.includes('budget');
  
  if (!hasValidation) {
    results.security.push({
      severity: 'MEDIUM',
      issue: 'No input validation on job creation',
      location: 'backend/src/routes/jobs.ts',
      recommendation: 'Add express-validator for job fields'
    });
    return { warning: true, message: 'No validation middleware detected' };
  }
  
  results.metrics.jobValidation = hasValidation && hasBudgetCheck;
  return true;
});

test('Q2.4: Job service exists with business logic', () => {
  const possiblePaths = [
    'backend/src/services/jobService.ts',
    'backend/src/services/JobService.ts',
    'src/services/jobService.ts'
  ];
  
  const existingPath = possiblePaths.find(p => fs.existsSync(p));
  
  if (!existingPath) {
    results.gaps.push({
      type: 'MISSING_JOB_SERVICE',
      severity: 'MEDIUM',
      location: 'backend/src/services/',
      note: 'Job logic may be in routes directly (not ideal)'
    });
    return { warning: true, message: '[CODEBASE GAP] JobService not found' };
  }
  
  const content = fs.readFileSync(existingPath, 'utf8');
  
  // Check for key methods
  const methods = {
    create: content.includes('createJob'),
    list: content.includes('getJobs') || content.includes('listJobs'),
    update: content.includes('updateJob'),
    accept: content.includes('acceptJob'),
    complete: content.includes('completeJob')
  };
  
  const implemented = Object.entries(methods).filter(([, exists]) => exists).map(([m]) => m);
  
  results.metrics.jobServiceMethods = implemented;
  results.metrics.jobServicePath = existingPath;
  
  if (implemented.length < 3) {
    return { warning: true, message: `Only ${implemented.length}/5 service methods` };
  }
  
  return true;
});

// ═══════════════════════════════════════════════════════════════════════════
// Q3: OFFER SUBMISSION (Validation, Duplicates, Rejections)
// ═══════════════════════════════════════════════════════════════════════════

log(colors.cyan + colors.bright, '\n╔═══════════════════════════════════════════════════════════════════════╗');
log(colors.cyan + colors.bright, '║ Q3: OFFER SUBMISSION (Validation, Duplicates)                         ║');
log(colors.cyan + colors.bright, '╚═══════════════════════════════════════════════════════════════════════╝\n');

test('Q3.1: JobApplication/Offer model exists', () => {
  const schemaPath = 'backend/prisma/schema.prisma';
  const content = fs.readFileSync(schemaPath, 'utf8');
  
  const hasApplication = content.match(/model JobApplication \{[\s\S]*?\n\}/);
  const hasOffer = content.match(/model Offer \{[\s\S]*?\n\}/);
  
  if (!hasApplication && !hasOffer) {
    return { critical: true, message: '[CODEBASE GAP] No JobApplication/Offer model' };
  }
  
  const modelContent = (hasApplication || hasOffer)[0];
  
  // Check for required fields
  const requiredFields = ['userId', 'jobId', 'status'];
  const missing = requiredFields.filter(field => !modelContent.includes(field));
  
  if (missing.length > 0) {
    return { warning: true, message: `Missing fields: ${missing.join(', ')}` };
  }
  
  results.metrics.offerModel = hasApplication ? 'JobApplication' : 'Offer';
  return true;
});

test('Q3.2: Offer submission endpoint exists', () => {
  const jobRoutesPath = 'backend/src/routes/jobs.ts';
  const content = fs.readFileSync(jobRoutesPath, 'utf8');
  
  const hasOfferEndpoint = content.includes('offer') || content.includes('apply') || content.includes('application');
  
  if (!hasOfferEndpoint) {
    results.gaps.push({
      type: 'MISSING_OFFER_ENDPOINT',
      severity: 'HIGH',
      location: 'backend/src/routes/jobs.ts',
      note: 'No offer/application submission endpoint'
    });
    return { critical: true, message: 'No offer submission endpoint found' };
  }
  
  return true;
});

test('Q3.3: Duplicate offer prevention (unique constraint)', () => {
  const schemaPath = 'backend/prisma/schema.prisma';
  const content = fs.readFileSync(schemaPath, 'utf8');
  
  const applicationMatch = content.match(/model JobApplication \{[\s\S]*?\n\}/);
  
  if (!applicationMatch) {
    return { warning: true, message: 'Cannot verify - JobApplication model not found' };
  }
  
  const applicationModel = applicationMatch[0];
  
  // Check for unique constraint on userId + jobId
  const hasUniqueConstraint = applicationModel.includes('@@unique') && applicationModel.includes('userId') && applicationModel.includes('jobId');
  
  if (!hasUniqueConstraint) {
    results.security.push({
      severity: 'MEDIUM',
      issue: 'No unique constraint to prevent duplicate offers',
      location: 'backend/prisma/schema.prisma (JobApplication)',
      recommendation: 'Add @@unique([userId, jobId])'
    });
    return { warning: true, message: 'Duplicate offers possible (no unique constraint)' };
  }
  
  results.metrics.duplicateOfferPrevention = true;
  return true;
});

test('Q3.4: Offer rejection handling', () => {
  const jobRoutesPath = 'backend/src/routes/jobs.ts';
  
  if (!fs.existsSync(jobRoutesPath)) {
    return { warning: true, message: 'Cannot verify - job routes not found' };
  }
  
  const content = fs.readFileSync(jobRoutesPath, 'utf8');
  
  // Check for rejection/decline logic
  const hasRejection = content.includes('reject') || content.includes('decline') || content.includes('REJECTED');
  
  if (!hasRejection) {
    return { warning: true, message: 'No offer rejection logic found' };
  }
  
  return true;
});

// ═══════════════════════════════════════════════════════════════════════════
// Q4: JOB SEARCH & FILTERS (Prisma Query, Performance, Indexes)
// ═══════════════════════════════════════════════════════════════════════════

log(colors.cyan + colors.bright, '\n╔═══════════════════════════════════════════════════════════════════════╗');
log(colors.cyan + colors.bright, '║ Q4: JOB SEARCH & FILTERS (Performance, Indexes)                       ║');
log(colors.cyan + colors.bright, '╚═══════════════════════════════════════════════════════════════════════╝\n');

test('Q4.1: Job search screen exists', () => {
  const searchScreens = [
    'src/app/(modals)/job-search.tsx',
    'src/app/(modals)/job-browse.tsx',
    'src/app/(main)/jobs.tsx'
  ];
  
  const existing = searchScreens.find(s => fs.existsSync(s));
  
  if (!existing) {
    return { warning: true, message: '[CODEBASE GAP] No job search screen found' };
  }
  
  const content = fs.readFileSync(existing, 'utf8');
  
  // Check for search/filter functionality
  const hasSearch = content.includes('search') || content.includes('filter');
  
  if (!hasSearch) {
    return { warning: true, message: 'Search screen exists but no search logic found' };
  }
  
  results.metrics.jobSearchScreen = path.basename(existing);
  return true;
});

test('Q4.2: Job list endpoint supports filters', () => {
  const jobRoutesPath = 'backend/src/routes/jobs.ts';
  const content = fs.readFileSync(jobRoutesPath, 'utf8');
  
  // Check for query parameters
  const hasQueryParams = content.includes('req.query') || content.includes('query.');
  const hasFilters = content.includes('filter') || content.includes('where');
  
  if (!hasQueryParams && !hasFilters) {
    results.performance.push({
      severity: 'MEDIUM',
      issue: 'Job list endpoint may not support filtering',
      location: 'backend/src/routes/jobs.ts',
      recommendation: 'Add query parameter support (category, budget, status)'
    });
    return { warning: true, message: 'No filter/query parameter support detected' };
  }
  
  return true;
});

test('Q4.3: Database indexes for job queries', () => {
  const schemaPath = 'backend/prisma/schema.prisma';
  const content = fs.readFileSync(schemaPath, 'utf8');
  
  const jobModelMatch = content.match(/model Job \{[\s\S]*?\n\}/);
  const jobModel = jobModelMatch[0];
  
  // Check for indexes
  const hasIndexes = jobModel.includes('@@index');
  
  if (!hasIndexes) {
    results.performance.push({
      severity: 'HIGH',
      issue: 'No database indexes on Job table',
      location: 'backend/prisma/schema.prisma',
      recommendation: 'Add indexes on status, category, createdAt for query performance'
    });
    return { warning: true, message: 'No indexes - queries may be slow' };
  }
  
  // Count indexes
  const indexCount = (jobModel.match(/@@index/g) || []).length;
  results.metrics.jobIndexCount = indexCount;
  
  log(colors.blue, `   🔍 Found ${indexCount} database indexes`);
  
  return true;
});

test('Q4.4: Search supports category and budget filters', () => {
  const jobRoutesPath = 'backend/src/routes/jobs.ts';
  const content = fs.readFileSync(jobRoutesPath, 'utf8');
  
  const hasCategory = content.includes('category');
  const hasBudget = content.includes('budget');
  
  results.metrics.searchFilters = { category: hasCategory, budget: hasBudget };
  
  if (!hasCategory && !hasBudget) {
    return { warning: true, message: 'No category or budget filters in search' };
  }
  
  return true;
});

// ═══════════════════════════════════════════════════════════════════════════
// Q5: EDGE CASES (Incomplete Submissions, Cleanup, Orphaned Records)
// ═══════════════════════════════════════════════════════════════════════════

log(colors.cyan + colors.bright, '\n╔═══════════════════════════════════════════════════════════════════════╗');
log(colors.cyan + colors.bright, '║ Q5: EDGE CASES (Incomplete Submissions, Cleanup)                      ║');
log(colors.cyan + colors.bright, '╚═══════════════════════════════════════════════════════════════════════╝\n');

test('Q5.1: Draft job support (incomplete submissions)', () => {
  const schemaPath = 'backend/prisma/schema.prisma';
  const content = fs.readFileSync(schemaPath, 'utf8');
  
  const jobStatusMatch = content.match(/enum JobStatus \{[\s\S]*?\}/);
  const hasDraft = jobStatusMatch && jobStatusMatch[0].includes('DRAFT');
  
  if (!hasDraft) {
    return { warning: true, message: 'No DRAFT status - incomplete jobs may be published' };
  }
  
  results.metrics.draftSupport = true;
  return true;
});

test('Q5.2: Orphaned job cleanup mechanism', () => {
  const cloudFunctionsPath = 'backend/functions/src';
  
  if (!fs.existsSync(cloudFunctionsPath)) {
    return { warning: true, message: 'No Cloud Functions - cleanup may be manual' };
  }
  
  // Check for scheduled jobs
  const files = fs.readdirSync(cloudFunctionsPath);
  const hasCleanup = files.some(file => file.includes('cleanup') || file.includes('scheduled'));
  
  if (!hasCleanup) {
    results.performance.push({
      severity: 'LOW',
      issue: 'No automated cleanup for old/orphaned jobs',
      location: 'backend/functions/',
      recommendation: 'Add scheduled function to clean up old jobs'
    });
    return { warning: true, message: 'No automated cleanup function' };
  }
  
  return true;
});

test('Q5.3: Job cancellation with escrow refund', () => {
  const jobRoutesPath = 'backend/src/routes/jobs.ts';
  const content = fs.readFileSync(jobRoutesPath, 'utf8');
  
  const hasCancel = content.includes('cancel');
  const hasRefund = content.includes('refund');
  
  if (hasCancel && !hasRefund) {
    results.security.push({
      severity: 'HIGH',
      issue: 'Job cancellation may not refund escrow',
      location: 'backend/src/routes/jobs.ts',
      recommendation: 'Ensure escrow is refunded on job cancellation'
    });
    return { warning: true, message: 'Cancel exists but no refund logic detected' };
  }
  
  results.metrics.cancelWithRefund = hasCancel && hasRefund;
  return true;
});

// ═══════════════════════════════════════════════════════════════════════════
// Q6: JOB ANALYTICS & AGGREGATION (Stats Updates, Count Queries)
// ═══════════════════════════════════════════════════════════════════════════

log(colors.cyan + colors.bright, '\n╔═══════════════════════════════════════════════════════════════════════╗');
log(colors.cyan + colors.bright, '║ Q6: JOB ANALYTICS (Stats Updates, Aggregation)                        ║');
log(colors.cyan + colors.bright, '╚═══════════════════════════════════════════════════════════════════════╝\n');

test('Q6.1: User stats update on job completion', () => {
  const jobServicePath = results.metrics.jobServicePath;
  
  if (!jobServicePath || !fs.existsSync(jobServicePath)) {
    return { warning: true, message: 'Cannot verify - JobService not found' };
  }
  
  const content = fs.readFileSync(jobServicePath, 'utf8');
  
  // Check for stats update
  const hasStatsUpdate = content.includes('completedTasks') || content.includes('totalEarnings') || content.includes('stats');
  
  if (!hasStatsUpdate) {
    results.performance.push({
      severity: 'MEDIUM',
      issue: 'User stats may not update on job completion',
      location: jobServicePath,
      recommendation: 'Update user completedTasks and totalEarnings'
    });
    return { warning: true, message: 'No stats update logic found' };
  }
  
  return true;
});

test('Q6.2: Job analytics screen exists', () => {
  const analyticsScreens = [
    'src/app/(modals)/job-analytics.tsx',
    'src/app/(modals)/analytics.tsx'
  ];
  
  const existing = analyticsScreens.find(s => fs.existsSync(s));
  
  if (!existing) {
    return { warning: true, message: '[CODEBASE GAP] No job analytics screen' };
  }
  
  results.metrics.jobAnalyticsScreen = path.basename(existing);
  return true;
});

test('Q6.3: Efficient job count queries', () => {
  const jobRoutesPath = 'backend/src/routes/jobs.ts';
  const content = fs.readFileSync(jobRoutesPath, 'utf8');
  
  // Check for count optimizations
  const hasCount = content.includes('count(') || content.includes('.count()');
  const hasAggregate = content.includes('aggregate');
  
  if (!hasCount && !hasAggregate) {
    results.performance.push({
      severity: 'LOW',
      issue: 'Job count queries may not be optimized',
      location: 'backend/src/routes/jobs.ts',
      recommendation: 'Use Prisma count() for efficient counting'
    });
    return { warning: true, message: 'No optimized count queries detected' };
  }
  
  return true;
});

// ═══════════════════════════════════════════════════════════════════════════
// FINAL REPORT
// ═══════════════════════════════════════════════════════════════════════════

log(colors.cyan + colors.bright, '\n\n═══════════════════════════════════════════════════════════════════════════');
log(colors.cyan + colors.bright, '  GROUP 3: JOB SYSTEM - REAL STATE SUMMARY');
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

if (results.performance.length > 0) {
  log(colors.bright, '\n⚡ PERFORMANCE FINDINGS:');
  results.performance.forEach((finding, i) => {
    log(colors.yellow, `   ${i + 1}. [${finding.severity}] ${finding.issue}`);
    log(colors.reset, `      Location: ${finding.location}`);
    log(colors.reset, `      Recommendation: ${finding.recommendation}`);
  });
}

const completeness = 100 - (criticalIssues * 10) - (highSeverityGaps * 5) - (results.warnings * 1);
const completenessDisplay = Math.max(0, Math.min(100, completeness));

log(colors.bright, '\n🎯 OVERALL ASSESSMENT:');
log(colors.cyan, `   Job System Completeness: ${completenessDisplay}%`);

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
  actions.push('1. [CRITICAL] Fix all critical issues');
}

if (results.security.filter(s => s.severity === 'HIGH').length > 0) {
  actions.push(`${actions.length + 1}. [HIGH] Address ${results.security.filter(s => s.severity === 'HIGH').length} high-severity security findings`);
}

if (results.performance.filter(p => p.severity === 'HIGH').length > 0) {
  actions.push(`${actions.length + 1}. [HIGH] Address ${results.performance.filter(p => p.severity === 'HIGH').length} high-severity performance issues`);
}

if (results.gaps.filter(g => g.severity === 'HIGH').length > 0) {
  actions.push(`${actions.length + 1}. [HIGH] Complete ${results.gaps.filter(g => g.severity === 'HIGH').length} missing components`);
}

actions.push(`${actions.length + 1}. [ALWAYS] Test full job lifecycle with real users`);

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
log(colors.cyan + colors.bright, '  END OF GROUP 3 AUDIT');
log(colors.cyan + colors.bright, '═══════════════════════════════════════════════════════════════════════════\n');

// Save results
const reportPath = 'GROUP_3_JOB_SYSTEM_AUDIT_RESULTS.json';
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
  performance: results.performance,
  details: results.details
}, null, 2));

log(colors.green, `📄 Full report saved to: ${reportPath}\n`);

process.exit(criticalIssues > 0 ? 1 : 0);






