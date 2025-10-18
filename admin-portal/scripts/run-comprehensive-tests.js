#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Backend Monitor Page
 * Runs Jest unit tests, Playwright E2E tests, Lighthouse performance tests, and Axe accessibility tests
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const config = {
  jest: {
    testPathPattern: 'src/pages/__tests__/BackendMonitor.test.tsx',
    coverage: true,
    verbose: true
  },
  playwright: {
    testPathPattern: 'e2e/backend-monitor.spec.ts',
    headed: false,
    workers: 1
  },
  lighthouse: {
    script: 'performance/lighthouse-backend-monitor.js',
    timeout: 60000
  },
  axe: {
    script: 'accessibility/axe-backend-monitor.js',
    timeout: 30000
  }
};

// Test results
const results = {
  jest: { success: false, output: '', coverage: 0 },
  playwright: { success: false, output: '', passed: 0, failed: 0 },
  lighthouse: { success: false, output: '', scores: {} },
  axe: { success: false, output: '', score: 0 }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  log(`${colors.bright}${colors.cyan}${message}${colors.reset}`);
  log(`${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
}

function logSection(message) {
  log(`\n${colors.bright}${colors.blue}${message}${colors.reset}`);
  log(`${colors.blue}${'-'.repeat(message.length)}${colors.reset}`);
}

function logSuccess(message) {
  log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logWarning(message) {
  log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logInfo(message) {
  log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

// Run Jest unit tests
async function runJestTests() {
  logSection('Running Jest Unit Tests');
  
  try {
    const command = `npm test -- --testPathPattern="${config.jest.testPathPattern}" --coverage --verbose --watchAll=false`;
    logInfo(`Running: ${command}`);
    
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 60000
    });
    
    results.jest.success = true;
    results.jest.output = output;
    
    // Extract coverage percentage
    const coverageMatch = output.match(/All files\s+\|\s+(\d+(?:\.\d+)?)/);
    if (coverageMatch) {
      results.jest.coverage = parseFloat(coverageMatch[1]);
    }
    
    logSuccess('Jest tests completed successfully');
    logInfo(`Coverage: ${results.jest.coverage}%`);
    
  } catch (error) {
    results.jest.success = false;
    results.jest.output = error.stdout || error.message;
    logError('Jest tests failed');
    logError(error.message);
  }
}

// Run Playwright E2E tests
async function runPlaywrightTests() {
  logSection('Running Playwright E2E Tests');
  
  try {
    const command = `npx playwright test ${config.playwright.testPathPattern} --headed=${config.playwright.headed} --workers=${config.playwright.workers}`;
    logInfo(`Running: ${command}`);
    
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 120000
    });
    
    results.playwright.success = true;
    results.playwright.output = output;
    
    // Extract test results
    const passedMatch = output.match(/(\d+) passed/);
    const failedMatch = output.match(/(\d+) failed/);
    
    if (passedMatch) {
      results.playwright.passed = parseInt(passedMatch[1]);
    }
    if (failedMatch) {
      results.playwright.failed = parseInt(failedMatch[1]);
    }
    
    logSuccess('Playwright tests completed successfully');
    logInfo(`Passed: ${results.playwright.passed}, Failed: ${results.playwright.failed}`);
    
  } catch (error) {
    results.playwright.success = false;
    results.playwright.output = error.stdout || error.message;
    logError('Playwright tests failed');
    logError(error.message);
  }
}

// Run Lighthouse performance tests
async function runLighthouseTests() {
  logSection('Running Lighthouse Performance Tests');
  
  try {
    const command = `node ${config.lighthouse.script}`;
    logInfo(`Running: ${command}`);
    
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: config.lighthouse.timeout
    });
    
    results.lighthouse.success = true;
    results.lighthouse.output = output;
    
    // Extract scores
    const performanceMatch = output.match(/Performance Score: (\d+)/);
    const accessibilityMatch = output.match(/Accessibility Score: (\d+)/);
    const bestPracticesMatch = output.match(/Best Practices Score: (\d+)/);
    const seoMatch = output.match(/SEO Score: (\d+)/);
    
    if (performanceMatch) {
      results.lighthouse.scores.performance = parseInt(performanceMatch[1]);
    }
    if (accessibilityMatch) {
      results.lighthouse.scores.accessibility = parseInt(accessibilityMatch[1]);
    }
    if (bestPracticesMatch) {
      results.lighthouse.scores.bestPractices = parseInt(bestPracticesMatch[1]);
    }
    if (seoMatch) {
      results.lighthouse.scores.seo = parseInt(seoMatch[1]);
    }
    
    logSuccess('Lighthouse tests completed successfully');
    logInfo(`Performance: ${results.lighthouse.scores.performance}/100`);
    logInfo(`Accessibility: ${results.lighthouse.scores.accessibility}/100`);
    logInfo(`Best Practices: ${results.lighthouse.scores.bestPractices}/100`);
    logInfo(`SEO: ${results.lighthouse.scores.seo}/100`);
    
  } catch (error) {
    results.lighthouse.success = false;
    results.lighthouse.output = error.stdout || error.message;
    logError('Lighthouse tests failed');
    logError(error.message);
  }
}

// Run Axe accessibility tests
async function runAxeTests() {
  logSection('Running Axe Accessibility Tests');
  
  try {
    const command = `node ${config.axe.script}`;
    logInfo(`Running: ${command}`);
    
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: config.axe.timeout
    });
    
    results.axe.success = true;
    results.axe.output = output;
    
    // Extract accessibility score
    const scoreMatch = output.match(/Overall Accessibility Score: (\d+(?:\.\d+)?)%/);
    if (scoreMatch) {
      results.axe.score = parseFloat(scoreMatch[1]);
    }
    
    logSuccess('Axe tests completed successfully');
    logInfo(`Accessibility Score: ${results.axe.score}%`);
    
  } catch (error) {
    results.axe.success = false;
    results.axe.output = error.stdout || error.message;
    logError('Axe tests failed');
    logError(error.message);
  }
}

// Generate comprehensive report
function generateReport() {
  logHeader('Comprehensive Test Report');
  
  // Overall status
  const allTestsPassed = results.jest.success && 
                       results.playwright.success && 
                       results.lighthouse.success && 
                       results.axe.success;
  
  logSection('Overall Status');
  if (allTestsPassed) {
    logSuccess('All tests passed successfully!');
  } else {
    logError('Some tests failed. See details below.');
  }
  
  // Jest results
  logSection('Jest Unit Tests');
  if (results.jest.success) {
    logSuccess(`✅ Passed (Coverage: ${results.jest.coverage}%)`);
  } else {
    logError('❌ Failed');
  }
  
  // Playwright results
  logSection('Playwright E2E Tests');
  if (results.playwright.success) {
    logSuccess(`✅ Passed (${results.playwright.passed} passed, ${results.playwright.failed} failed)`);
  } else {
    logError('❌ Failed');
  }
  
  // Lighthouse results
  logSection('Lighthouse Performance Tests');
  if (results.lighthouse.success) {
    const scores = results.lighthouse.scores;
    logSuccess(`✅ Passed`);
    logInfo(`Performance: ${scores.performance}/100`);
    logInfo(`Accessibility: ${scores.accessibility}/100`);
    logInfo(`Best Practices: ${scores.bestPractices}/100`);
    logInfo(`SEO: ${scores.seo}/100`);
    
    // Check if scores meet requirements
    const requirements = {
      performance: 90,
      accessibility: 95,
      bestPractices: 90,
      seo: 90
    };
    
    if (scores.performance < requirements.performance) {
      logWarning(`Performance score ${scores.performance} is below required ${requirements.performance}`);
    }
    if (scores.accessibility < requirements.accessibility) {
      logWarning(`Accessibility score ${scores.accessibility} is below required ${requirements.accessibility}`);
    }
    if (scores.bestPractices < requirements.bestPractices) {
      logWarning(`Best Practices score ${scores.bestPractices} is below required ${requirements.bestPractices}`);
    }
    if (scores.seo < requirements.seo) {
      logWarning(`SEO score ${scores.seo} is below required ${requirements.seo}`);
    }
  } else {
    logError('❌ Failed');
  }
  
  // Axe results
  logSection('Axe Accessibility Tests');
  if (results.axe.success) {
    logSuccess(`✅ Passed (Score: ${results.axe.score}%)`);
    
    if (results.axe.score < 95) {
      logWarning(`Accessibility score ${results.axe.score}% is below required 95%`);
    }
  } else {
    logError('❌ Failed');
  }
  
  // Recommendations
  logSection('Recommendations');
  
  if (!results.jest.success) {
    logInfo('• Fix Jest unit test failures');
  }
  
  if (!results.playwright.success) {
    logInfo('• Fix Playwright E2E test failures');
  }
  
  if (!results.lighthouse.success) {
    logInfo('• Fix Lighthouse performance issues');
  }
  
  if (!results.axe.success) {
    logInfo('• Fix Axe accessibility violations');
  }
  
  if (results.lighthouse.scores.performance < 90) {
    logInfo('• Optimize performance (target: 90+)');
  }
  
  if (results.lighthouse.scores.accessibility < 95) {
    logInfo('• Improve accessibility (target: 95+)');
  }
  
  if (results.lighthouse.scores.bestPractices < 90) {
    logInfo('• Follow best practices (target: 90+)');
  }
  
  if (results.lighthouse.scores.seo < 90) {
    logInfo('• Improve SEO (target: 90+)');
  }
  
  if (results.axe.score < 95) {
    logInfo('• Fix accessibility violations (target: 95%+)');
  }
  
  // Save report to file
  const reportPath = path.join(__dirname, '..', 'test-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    overall: {
      success: allTestsPassed,
      totalTests: 4,
      passedTests: [results.jest.success, results.playwright.success, results.lighthouse.success, results.axe.success].filter(Boolean).length
    },
    results
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  logInfo(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return allTestsPassed;
}

// Main execution
async function main() {
  logHeader('Comprehensive Test Suite for Backend Monitor Page');
  
  try {
    // Run all tests
    await runJestTests();
    await runPlaywrightTests();
    await runLighthouseTests();
    await runAxeTests();
    
    // Generate report
    const success = generateReport();
    
    // Exit with appropriate code
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    logError('Test suite failed with error:');
    logError(error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, runJestTests, runPlaywrightTests, runLighthouseTests, runAxeTests, generateReport };








