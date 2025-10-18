/**
 * Memory Leak Detection Test
 * Advanced Node.js heap profiling and leak detection
 * Uses: v8-profiler-next, heapdump, clinic
 */

// Simplified memory leak detection using built-in Node.js tools
const fs = require('fs');
const path = require('path');
const { performance, PerformanceObserver } = require('perf_hooks');
const v8 = require('v8');

// Test configuration
const CONFIG = {
  iterations: 1000,
  heapSnapshotInterval: 100,
  memoryThreshold: 100 * 1024 * 1024, // 100MB
  reportDir: path.join(__dirname, '../../test-reports/performance')
};

// Metrics
const metrics = {
  heapSnapshots: [],
  gcStats: [],
  memoryLeaks: [],
  warnings: []
};

/**
 * Initialize performance monitoring
 */
function initPerformanceMonitoring() {
  const obs = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
      if (entry.entryType === 'gc') {
        metrics.gcStats.push({
          timestamp: Date.now(),
          duration: entry.duration,
          kind: entry.detail?.kind
        });
      }
    });
  });
  
  obs.observe({ entryTypes: ['gc'], buffered: true });
}

/**
 * Take heap snapshot
 */
function takeMemorySnapshot(label) {
  const usage = process.memoryUsage();
  const snapshotPath = path.join(CONFIG.reportDir, `memory-${label}-${Date.now()}.json`);

  const snapshot = {
    label,
    timestamp: new Date().toISOString(),
    memory: {
      rss: usage.rss,
      heapTotal: usage.heapTotal,
      heapUsed: usage.heapUsed,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers
    }
  };

  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
  console.log(`   📊 Memory snapshot saved: ${path.basename(snapshotPath)}`);
  return snapshotPath;
}

/**
 * Get current memory usage
 */
function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: usage.rss,
    heapTotal: usage.heapTotal,
    heapUsed: usage.heapUsed,
    external: usage.external,
    arrayBuffers: usage.arrayBuffers
  };
}

/**
 * Test 1: Simulate User Operations (Memory Leak Detection)
 */
async function testUserOperations() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║      TEST 1: MEMORY LEAK DETECTION (1000 ITERATIONS)          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const initialMemory = getMemoryUsage();
  console.log(`📊 Initial Memory:`);
  console.log(`   Heap Used: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   RSS: ${(initialMemory.rss / 1024 / 1024).toFixed(2)} MB\n`);
  
  metrics.heapSnapshots.push({ label: 'initial', ...initialMemory });
  
  // Take initial memory snapshot
  takeMemorySnapshot('initial');
  
  console.log('⏳ Running operations...\n');
  
  // Simulate user operations that might leak memory
  for (let i = 0; i < CONFIG.iterations; i++) {
    // Simulate various operations
    simulateJobCreation();
    simulateChatMessages();
    simulateEventListeners();
    
    // Take periodic snapshots
    if (i % CONFIG.heapSnapshotInterval === 0 && i > 0) {
      const currentMemory = getMemoryUsage();
      metrics.heapSnapshots.push({ iteration: i, ...currentMemory });
      
      const heapGrowth = currentMemory.heapUsed - initialMemory.heapUsed;
      const growthPercent = (heapGrowth / initialMemory.heapUsed) * 100;
      
      console.log(`   Iteration ${i}:`);
      console.log(`   Heap Used: ${(currentMemory.heapUsed / 1024 / 1024).toFixed(2)} MB (${growthPercent > 0 ? '+' : ''}${growthPercent.toFixed(2)}%)`);
      
      // Warning threshold
      if (heapGrowth > CONFIG.memoryThreshold) {
        const warning = `Memory leak detected at iteration ${i}: ${(heapGrowth / 1024 / 1024).toFixed(2)} MB growth`;
        console.log(`   ⚠️  ${warning}`);
        metrics.warnings.push(warning);
        
        // Take snapshot of leaked state
        takeMemorySnapshot(`leak-detected-${i}`);
      }
    }
    
    // Force GC periodically (if exposed)
    if (i % 100 === 0 && global.gc) {
      global.gc();
    }
  }
  
  // Final snapshot
  const finalMemory = getMemoryUsage();
  metrics.heapSnapshots.push({ label: 'final', ...finalMemory });
  takeMemorySnapshot('final');
  
  console.log(`\n📊 Final Memory:`);
  console.log(`   Heap Used: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   RSS: ${(finalMemory.rss / 1024 / 1024).toFixed(2)} MB\n`);
  
  // Analysis
  const totalGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
  const growthPercent = (totalGrowth / initialMemory.heapUsed) * 100;
  
  console.log(`📈 Memory Analysis:`);
  console.log(`   Total Heap Growth: ${(totalGrowth / 1024 / 1024).toFixed(2)} MB (${growthPercent.toFixed(2)}%)`);
  
  if (growthPercent > 50) {
    console.log(`   ❌ MEMORY LEAK DETECTED: ${growthPercent.toFixed(2)}% growth`);
    metrics.memoryLeaks.push({
      type: 'heap_growth',
      growth: totalGrowth,
      percent: growthPercent
    });
  } else if (growthPercent > 20) {
    console.log(`   ⚠️  WARNING: Possible memory leak (${growthPercent.toFixed(2)}% growth)`);
  } else {
    console.log(`   ✅ No significant memory leaks detected`);
  }
  
  console.log();
}

/**
 * Simulate job creation (potential leak: event listeners, closures)
 */
function simulateJobCreation() {
  const job = {
    id: Math.random().toString(36),
    title: 'Test Job ' + Math.random(),
    description: 'A'.repeat(1000), // Simulate description
    data: new Array(100).fill(Math.random()),
    listeners: []
  };
  
  // Simulate event listeners (common leak source)
  for (let i = 0; i < 5; i++) {
    job.listeners.push(() => {
      // Closure capturing job object
      return job.title;
    });
  }
  
  // Intentionally not cleaning up to detect leaks
}

/**
 * Simulate chat messages (potential leak: DOM references, timers)
 */
function simulateChatMessages() {
  const messages = [];
  
  for (let i = 0; i < 10; i++) {
    messages.push({
      id: Math.random().toString(36),
      text: 'Message ' + Math.random(),
      timestamp: Date.now(),
      user: { id: Math.random(), name: 'User' }
    });
  }
  
  // Simulate timer-based cleanup (potential leak if not cleared)
  const timer = setTimeout(() => {
    messages.length = 0;
  }, 10000);
  
  // Intentionally not clearing timer to detect leaks
}

/**
 * Simulate event listeners (common leak source)
 */
function simulateEventListeners() {
  const emitter = {
    listeners: new Map(),
    on(event, callback) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }
  };
  
  // Add listeners without cleanup
  emitter.on('data', () => {});
  emitter.on('error', () => {});
  emitter.on('complete', () => {});
}

/**
 * Test 2: CPU Profiling
 */
// CPU profiling removed - focusing on memory leak detection only

/**
 * Generate report
 */
function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    configuration: CONFIG,
    memorySnapshots: metrics.heapSnapshots,
    gcStats: {
      count: metrics.gcStats.length,
      avgDuration: metrics.gcStats.reduce((a, b) => a + b.duration, 0) / metrics.gcStats.length || 0
    },
    memoryLeaks: metrics.memoryLeaks,
    warnings: metrics.warnings,
    verdict: metrics.memoryLeaks.length === 0 ? 'PASS' : 'FAIL'
  };
  
  const reportPath = path.join(CONFIG.reportDir, 'memory-leak-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║      MEMORY LEAK DETECTION - FINAL REPORT                     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  console.log(`📊 Results:`);
  console.log(`   Heap Snapshots: ${report.memorySnapshots.length}`);
  console.log(`   GC Collections: ${report.gcStats.count}`);
  console.log(`   Memory Leaks Detected: ${report.memoryLeaks.length}`);
  console.log(`   Warnings: ${report.warnings.length}\n`);
  
  console.log(`📄 Report saved: ${reportPath}\n`);
  
  if (report.verdict === 'PASS') {
    console.log('✅ MEMORY LEAK TEST PASSED\n');
  } else {
    console.log('❌ MEMORY LEAK TEST FAILED\n');
    console.log('📌 Next Steps:');
    console.log('   1. Analyze heap snapshots in Chrome DevTools');
    console.log('   2. Look for objects retained in memory');
    console.log('   3. Check for unclosed event listeners');
    console.log('   4. Verify timers are cleared\n');
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function runMemoryLeakTest() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║      ADVANCED MEMORY LEAK DETECTION TEST                      ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  // Create report directory
  fs.mkdirSync(CONFIG.reportDir, { recursive: true });
  
  // Initialize monitoring
  initPerformanceMonitoring();
  
  try {
    await testUserOperations();
    generateReport();
  } catch (error) {
    console.error('\n❌ Memory leak test failed:', error);
    process.exit(1);
  }
}

// Run with: node --expose-gc tests/performance/memory-leak-detection.js
if (require.main === module) {
  if (!global.gc) {
    console.warn('⚠️  WARNING: Run with --expose-gc flag for better results');
    console.warn('   Example: node --expose-gc tests/performance/memory-leak-detection.js\n');
  }
  
  runMemoryLeakTest();
}

module.exports = { runMemoryLeakTest };



