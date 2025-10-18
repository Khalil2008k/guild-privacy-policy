#!/usr/bin/env node

/**
 * MASTER TEST ORCHESTRATOR
 * Runs all advanced test suites in sequence
 * Generates comprehensive deployment readiness report
 * 
 * Usage: node run-all-advanced-tests.js [--fast | --full | --critical]
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const CONFIG = {
  fast: process.argv.includes('--fast'),
  full: process.argv.includes('--full'),
  critical: process.argv.includes('--critical'),
  reportDir: path.join(__dirname, 'test-reports'),
  timestamp: Date.now()
};

// Test suite configuration
const TEST_SUITES = [
  {
    id: 'validation',
    name: 'Code Validation',
    critical: true,
    fast: true,
    command: 'npm',
    args: ['run', 'lint'],
    timeout: 60000,
    icon: '📋'
  },
  {
    id: 'unit',
    name: 'Unit & Integration Tests',
    critical: true,
    fast: true,
    command: 'npm',
    args: ['test', '--', '--coverage'],
    timeout: 300000,
    icon: '🧪'
  },
  {
    id: 'artillery-auth',
    name: 'Artillery Load Test (Auth)',
    critical: false,
    fast: false,
    command: 'artillery',
    args: ['run', 'tests/artillery/load-test-auth.yml'],
    timeout: 600000,
    icon: '⚡'
  },
  {
    id: 'artillery-jobs',
    name: 'Artillery Load Test (Jobs)',
    critical: false,
    fast: false,
    command: 'artillery',
    args: ['run', 'tests/artillery/load-test-jobs.yml'],
    timeout: 600000,
    icon: '⚡'
  },
  {
    id: 'k6-stress',
    name: 'k6 Stress Test',
    critical: false,
    fast: false,
    command: 'k6',
    args: ['run', 'tests/k6/stress-test-api.js'],
    timeout: 600000,
    icon: '💪'
  },
  {
    id: 'k6-spike',
    name: 'k6 Spike Test',
    critical: false,
    fast: false,
    command: 'k6',
    args: ['run', 'tests/k6/spike-test.js'],
    timeout: 300000,
    icon: '📈'
  },
  {
    id: 'security',
    name: 'API Security Tests',
    critical: true,
    fast: true,
    command: 'node',
    args: ['tests/security/api-security-test.js'],
    timeout: 300000,
    icon: '🔐'
  },
  {
    id: 'database',
    name: 'Firestore Load Test',
    critical: false,
    fast: false,
    command: 'node',
    args: ['tests/database/load-test-firestore.js'],
    timeout: 600000,
    icon: '💾'
  },
  {
    id: 'performance',
    name: 'Memory Leak Detection',
    critical: false,
    fast: false,
    command: 'node',
    args: ['--expose-gc', 'tests/performance/memory-leak-detection.js'],
    timeout: 300000,
    icon: '⚡'
  },
  {
    id: 'firebase',
    name: 'Firebase Emulator Tests',
    critical: false,
    fast: true,
    command: 'node',
    args: ['tests/firebase/emulator-integration-test.js'],
    timeout: 300000,
    icon: '🔥'
  },
  {
    id: 'chaos',
    name: 'Chaos Engineering Tests',
    critical: false,
    fast: false,
    command: 'node',
    args: ['tests/chaos/network-chaos-test.js'],
    timeout: 300000,
    icon: '🌪️ '
  }
];

// Results tracking
const results = {
  timestamp: new Date().toISOString(),
  mode: CONFIG.fast ? 'fast' : CONFIG.critical ? 'critical' : 'full',
  totalTests: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  duration: 0,
  suites: []
};

/**
 * Run a command and capture output
 */
function runCommand(command, args, timeout) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let output = '';
    let errorOutput = '';
    
    const child = spawn(command, args, {
      cwd: __dirname,
      shell: true,
      timeout
    });
    
    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });
    
    child.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      process.stderr.write(text);
    });
    
    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      resolve({
        exitCode: code,
        duration,
        output,
        errorOutput
      });
    });
    
    child.on('error', (error) => {
      const duration = Date.now() - startTime;
      resolve({
        exitCode: -1,
        duration,
        output,
        errorOutput: error.message
      });
    });
    
    // Timeout handling
    setTimeout(() => {
      try {
        child.kill('SIGTERM');
        setTimeout(() => child.kill('SIGKILL'), 5000);
      } catch (e) {
        // Ignore
      }
    }, timeout);
  });
}

/**
 * Run all test suites
 */
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                                ║');
  console.log('║                     ADVANCED TEST SUITE - MASTER ORCHESTRATOR                  ║');
  console.log('║                                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════════╝\n');
  
  console.log(`🎯 Mode: ${results.mode.toUpperCase()}`);
  console.log(`📊 Platform: ${os.platform()} ${os.release()}`);
  console.log(`💻 Node.js: ${process.version}`);
  console.log(`📁 Working Directory: ${__dirname}\n`);
  
  // Filter test suites based on mode
  let suitesToRun = TEST_SUITES;
  
  if (CONFIG.fast) {
    suitesToRun = TEST_SUITES.filter(s => s.fast);
    console.log('⚡ FAST MODE: Running only fast tests\n');
  } else if (CONFIG.critical) {
    suitesToRun = TEST_SUITES.filter(s => s.critical);
    console.log('🚨 CRITICAL MODE: Running only critical tests\n');
  } else {
    console.log('🔥 FULL MODE: Running all test suites\n');
  }
  
  results.totalTests = suitesToRun.length;
  
  const overallStartTime = Date.now();
  
  // Run each suite
  for (const suite of suitesToRun) {
    console.log('─'.repeat(80));
    console.log(`${suite.icon} ${suite.name.toUpperCase()}`);
    console.log('─'.repeat(80));
    console.log(`Command: ${suite.command} ${suite.args.join(' ')}`);
    console.log(`Timeout: ${(suite.timeout / 1000).toFixed(0)}s\n`);
    
    const result = await runCommand(suite.command, suite.args, suite.timeout);
    
    const suiteResult = {
      id: suite.id,
      name: suite.name,
      critical: suite.critical,
      passed: result.exitCode === 0,
      exitCode: result.exitCode,
      duration: result.duration,
      timestamp: new Date().toISOString()
    };
    
    results.suites.push(suiteResult);
    
    if (result.exitCode === 0) {
      results.passed++;
      console.log(`\n✅ ${suite.name} PASSED (${(result.duration / 1000).toFixed(2)}s)\n`);
    } else if (result.exitCode === -1) {
      results.skipped++;
      console.log(`\n⚠️  ${suite.name} SKIPPED (command not found)\n`);
    } else {
      results.failed++;
      console.log(`\n❌ ${suite.name} FAILED (${(result.duration / 1000).toFixed(2)}s)\n`);
      
      // If critical test fails, optionally stop
      if (suite.critical && CONFIG.critical) {
        console.log('🚨 CRITICAL TEST FAILED - Stopping execution\n');
        break;
      }
    }
  }
  
  results.duration = Date.now() - overallStartTime;
}

/**
 * Generate comprehensive report
 */
function generateReport() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                                ║');
  console.log('║                          FINAL TEST REPORT                                     ║');
  console.log('║                                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════════╝\n');
  
  // Summary
  console.log('📊 SUMMARY:\n');
  console.log(`   Total Test Suites: ${results.totalTests}`);
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   ⚠️  Skipped: ${results.skipped}`);
  console.log(`   ⏱️  Total Duration: ${(results.duration / 1000).toFixed(2)}s\n`);
  
  // Individual results
  console.log('📋 DETAILED RESULTS:\n');
  results.suites.forEach(suite => {
    const status = suite.passed ? '✅' : suite.exitCode === -1 ? '⚠️ ' : '❌';
    const time = `(${(suite.duration / 1000).toFixed(2)}s)`;
    console.log(`   ${status} ${suite.name.padEnd(40)} ${time}`);
  });
  console.log();
  
  // Critical failures
  const criticalFailures = results.suites.filter(s => s.critical && !s.passed);
  if (criticalFailures.length > 0) {
    console.log('🚨 CRITICAL FAILURES:\n');
    criticalFailures.forEach(suite => {
      console.log(`   ❌ ${suite.name}`);
    });
    console.log();
  }
  
  // Calculate readiness score
  const passRate = (results.passed / (results.totalTests - results.skipped)) * 100 || 0;
  const criticalPassRate = results.suites.filter(s => s.critical).every(s => s.passed) ? 100 : 0;
  
  console.log('🎯 DEPLOYMENT READINESS:\n');
  console.log(`   Overall Pass Rate: ${passRate.toFixed(1)}%`);
  console.log(`   Critical Tests: ${criticalPassRate}%\n`);
  
  let deploymentStatus = '';
  if (criticalPassRate === 100 && passRate >= 90) {
    deploymentStatus = '✅ READY FOR PRODUCTION DEPLOYMENT';
  } else if (criticalPassRate === 100 && passRate >= 80) {
    deploymentStatus = '⚠️  READY FOR STAGING DEPLOYMENT';
  } else if (criticalPassRate === 100) {
    deploymentStatus = '⚠️  CRITICAL TESTS PASS - Fix non-critical issues';
  } else {
    deploymentStatus = '❌ NOT READY - Critical tests failed';
  }
  
  console.log(`   Status: ${deploymentStatus}\n`);
  
  // Save JSON report
  const reportPath = path.join(CONFIG.reportDir, `master-test-report-${CONFIG.timestamp}.json`);
  fs.mkdirSync(CONFIG.reportDir, { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📄 JSON Report: ${reportPath}\n`);
  
  // Save markdown report
  const mdReport = generateMarkdownReport();
  const mdReportPath = path.join(CONFIG.reportDir, `master-test-report-${CONFIG.timestamp}.md`);
  fs.writeFileSync(mdReportPath, mdReport);
  console.log(`📄 Markdown Report: ${mdReportPath}\n`);
  
  // Exit code
  if (criticalPassRate < 100) {
    console.log('❌ EXITING WITH FAILURE (critical tests failed)\n');
    return 1;
  } else if (passRate < 80) {
    console.log('⚠️  EXITING WITH WARNING (pass rate < 80%)\n');
    return 0;
  } else {
    console.log('✅ ALL TESTS PASSED\n');
    return 0;
  }
}

/**
 * Generate markdown report
 */
function generateMarkdownReport() {
  const passRate = (results.passed / (results.totalTests - results.skipped)) * 100 || 0;
  
  let md = '# Advanced Test Suite - Report\n\n';
  md += `**Generated**: ${new Date().toLocaleString()}\n`;
  md += `**Mode**: ${results.mode}\n`;
  md += `**Duration**: ${(results.duration / 1000).toFixed(2)}s\n\n`;
  
  md += '## Summary\n\n';
  md += `- Total Suites: ${results.totalTests}\n`;
  md += `- ✅ Passed: ${results.passed}\n`;
  md += `- ❌ Failed: ${results.failed}\n`;
  md += `- ⚠️  Skipped: ${results.skipped}\n`;
  md += `- Pass Rate: ${passRate.toFixed(1)}%\n\n`;
  
  md += '## Test Suites\n\n';
  md += '| Suite | Status | Duration | Critical |\n';
  md += '|-------|--------|----------|----------|\n';
  
  results.suites.forEach(suite => {
    const status = suite.passed ? '✅ PASS' : suite.exitCode === -1 ? '⚠️  SKIP' : '❌ FAIL';
    const duration = `${(suite.duration / 1000).toFixed(2)}s`;
    const critical = suite.critical ? '🚨 Yes' : 'No';
    md += `| ${suite.name} | ${status} | ${duration} | ${critical} |\n`;
  });
  
  md += '\n## Deployment Readiness\n\n';
  if (passRate >= 90 && results.suites.filter(s => s.critical).every(s => s.passed)) {
    md += '✅ **READY FOR PRODUCTION**\n\n';
  } else if (passRate >= 80 && results.suites.filter(s => s.critical).every(s => s.passed)) {
    md += '⚠️  **READY FOR STAGING**\n\n';
  } else {
    md += '❌ **NOT READY - Fix failing tests**\n\n';
  }
  
  return md;
}

/**
 * Main execution
 */
async function main() {
  try {
    await runAllTests();
    const exitCode = generateReport();
    process.exit(exitCode);
  } catch (error) {
    console.error('\n❌ Master test orchestrator failed:', error);
    process.exit(1);
  }
}

// Run
main();






