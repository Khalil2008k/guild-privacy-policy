/**
 * Main test runner for GUILD app automated testing
 * Runs continuously until stopped
 */

const { spawn } = require('child_process');
const winston = require('winston');
const path = require('path');
const fs = require('fs');
const os = require('os');

class ContinuousTestRunner {
  constructor() {
    this.isRunning = true;
    this.cycle = 1;

    // Get binary paths
    this.detoxPath = path.join(__dirname, '../node_modules/.bin/detox.cmd');
    this.artilleryPath = path.join(__dirname, '../node_modules/.bin/artillery.cmd');

    // Simple console logger to avoid EBADF errors
    this.logger = {
      info: (message, meta) => console.log(`[${new Date().toISOString()}] INFO: ${message}`, meta || ''),
      error: (message, meta) => console.error(`[${new Date().toISOString()}] ERROR: ${message}`, meta || ''),
      log: (level, message, meta) => console.log(`[${new Date().toISOString()}] ${level.toUpperCase()}: ${message}`, meta || '')
    };

    // Ensure logs directory exists
    fs.mkdirSync(path.join(__dirname, '../logs'), { recursive: true });
  }

  // Safe logging method
  safeLog(level, message, meta = {}) {
    this.logger.log(level, message, meta);
  }

  async runUITests() {
    return new Promise((resolve) => {
      this.safeLog('info', 'Starting UI tests...');

      const detox = spawn(this.detoxPath, ['test', '-c', 'android', '--record-logs', 'all'], {
        cwd: path.join(__dirname, '../detox'),
        stdio: 'pipe'
      });

      let output = '';
      let errorOutput = '';

      detox.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        this.safeLog('info', `UI Test: ${text.trim()}`);
      });

      detox.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        this.safeLog('error', `UI Test Error: ${text.trim()}`);
      });

      detox.on('close', (code) => {
        const success = code === 0;
        this.safeLog('info', `UI tests completed: ${success ? 'PASSED' : 'FAILED'} (Exit code: ${code})`);

        resolve({
          success,
          output,
          errorOutput,
          exitCode: code
        });
      });

      // Timeout after 15 minutes
      setTimeout(() => {
        detox.kill('SIGTERM');
        resolve({
          success: false,
          output: 'UI tests timed out after 15 minutes',
          errorOutput: 'Timeout',
          exitCode: -1
        });
      }, 15 * 60 * 1000);
    });
  }

  async runLoadTests() {
    return new Promise((resolve) => {
      this.safeLog('info', 'Starting load tests...');

      const reportsDir = path.join(__dirname, '../reports/load');
      fs.mkdirSync(reportsDir, { recursive: true });
      const artillery = spawn(this.artilleryPath, [
        'run',
        'load/scenarios/user-journey.yml',
        '-o',
        path.join(reportsDir, `cycle-${this.cycle}.json`)
      ], {
        cwd: path.join(__dirname, '../load'),
        stdio: 'pipe'
      });

      let output = '';
      let errorOutput = '';

      artillery.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        this.safeLog('info', `Load Test: ${text.trim()}`);
      });

      artillery.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        this.safeLog('error', `Load Test Error: ${text.trim()}`);
      });

      artillery.on('close', (code) => {
        const success = code === 0;
        this.safeLog('info', `Load tests completed: ${success ? 'PASSED' : 'FAILED'} (Exit code: ${code})`);

        resolve({
          success,
          output,
          errorOutput,
          exitCode: code
        });
      });

      // Timeout after 20 minutes
      setTimeout(() => {
        artillery.kill('SIGTERM');
        resolve({
          success: false,
          output: 'Load tests timed out after 20 minutes',
          errorOutput: 'Timeout',
          exitCode: -1
        });
      }, 20 * 60 * 1000);
    });
  }

  async runSingleUserTest() {
    return new Promise((resolve) => {
      this.safeLog('info', 'Running single user baseline test...');

      const reportsDir = path.join(__dirname, '../reports/load');
      fs.mkdirSync(reportsDir, { recursive: true });
      const artillery = spawn(this.artilleryPath, [
        'run',
        'load/scenarios/single-user.yml',
        '-o',
        path.join(reportsDir, `baseline-${this.cycle}.json`)
      ], {
        cwd: path.join(__dirname, '../load'),
        stdio: 'pipe'
      });

      artillery.on('close', (code) => {
        resolve({ success: code === 0 });
      });

      setTimeout(() => {
        artillery.kill('SIGTERM');
      }, 2 * 60 * 1000);
    });
  }

  async generateReport() {
    this.safeLog('info', 'Generating AI-powered report...');

    return new Promise((resolve) => {
      const analyze = spawn('node', ['analyze.js', this.cycle.toString()], {
        cwd: __dirname,
        stdio: 'pipe'
      });

      let output = '';
      let errorOutput = '';

      analyze.stdout.on('data', (data) => {
        output += data.toString();
        this.safeLog('info', `Analysis: ${data.toString().trim()}`);
      });

      analyze.stderr.on('data', (data) => {
        errorOutput += data.toString();
        this.safeLog('error', `Analysis Error: ${data.toString().trim()}`);
      });

      analyze.on('close', (code) => {
        const success = code === 0;
        this.safeLog('info', `Report generation: ${success ? 'COMPLETED' : 'FAILED'}`);

        resolve({
          success,
          output,
          errorOutput,
          exitCode: code
        });
      });

      setTimeout(() => {
        analyze.kill('SIGTERM');
        resolve({
          success: false,
          output: 'Analysis timed out',
          errorOutput: 'Timeout',
          exitCode: -1
        });
      }, 5 * 60 * 1000);
    });
  }

  async runCycle() {
    const cycleStart = new Date();
    this.safeLog('info', `🚀 Starting test cycle ${this.cycle} at ${cycleStart.toISOString()}`);

    // Track results
    const results = {
      cycle: this.cycle,
      startTime: cycleStart.toISOString(),
      uiTests: null,
      loadTests: null,
      singleUserTest: null,
      report: null,
      endTime: null,
      duration: null
    };

    try {
      // 1. Run single user baseline test
      results.singleUserTest = await this.runSingleUserTest();
      this.safeLog('info', `Baseline test: ${results.singleUserTest.success ? 'PASSED' : 'FAILED'}`);

      // 2. Run UI tests
      results.uiTests = await this.runUITests();
      this.safeLog('info', `UI test results: ${results.uiTests.success ? 'PASSED' : 'FAILED'}`);

      // 3. Run load tests
      results.loadTests = await this.runLoadTests();
      this.safeLog('info', `Load test results: ${results.loadTests.success ? 'PASSED' : 'FAILED'}`);

      // 4. Generate AI report
      results.report = await this.generateReport();
      this.safeLog('info', `Report generation: ${results.report.success ? 'COMPLETED' : 'FAILED'}`);

      // Calculate duration
      results.endTime = new Date().toISOString();
      results.duration = Math.round((new Date(results.endTime) - new Date(results.startTime)) / 1000);

      this.safeLog('info', `✅ Test cycle ${this.cycle} completed in ${results.duration} seconds`);

    } catch (error) {
      this.safeLog('error', `❌ Test cycle ${this.cycle} failed:`, error);
      results.error = error.message;
    }

    // Save cycle results
    const reportsDir = path.join(__dirname, '../reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    const resultsPath = path.join(reportsDir, `cycle-${this.cycle}.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

    this.cycle++;
  }

  async start() {
    console.log(`
╔══════════════════════════════════════╗
║      GUILD App - Automated Testing   ║
║         Continuous Test Runner       ║
╚══════════════════════════════════════╝

🚀 Starting automated testing...
📊 Reports will be generated every ~5 minutes
📁 Check testing/reports/ for results
⏹️  Press Ctrl+C to stop

    `);

    while (this.isRunning) {
      try {
        await this.runCycle();

        // Wait 5 minutes before next cycle (adjust as needed)
        const waitTime = 5 * 60 * 1000; // 5 minutes
        this.safeLog('info', `Waiting ${waitTime / 1000} seconds before next cycle...`);

        await new Promise(resolve => setTimeout(resolve, waitTime));

      } catch (error) {
        this.safeLog('error', 'Error in test cycle:', error);
        // Continue running even if a cycle fails
        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute on error
      }
    }

    this.safeLog('info', '🛑 Test runner stopped');
  }

  stop() {
    this.isRunning = false;
    this.safeLog('info', 'Received stop signal, shutting down gracefully...');
  }

  // Graceful shutdown handling
  setupSignalHandlers() {
    process.on('SIGINT', () => {
      console.log('\n🛑 Received SIGINT, stopping test runner...');
      this.stop();
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, stopping test runner...');
      this.stop();
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.safeLog('error', 'Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      this.safeLog('error', 'Uncaught Exception:', error);
      this.stop();
    });
  }
}

// Main execution
if (require.main === module) {
  const runner = new ContinuousTestRunner();
  runner.setupSignalHandlers();
  runner.start().catch(console.error);
}

module.exports = ContinuousTestRunner;
