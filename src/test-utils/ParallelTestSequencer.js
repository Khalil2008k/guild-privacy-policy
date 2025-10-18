
// Parallel Test Sequencer for Optimized Test Distribution
const Sequencer = require('@jest/test-sequencer').default;

class ParallelTestSequencer extends Sequencer {
  sort(tests) {
    // Sort tests by estimated execution time for better parallel distribution
    const testsWithTime = tests.map(test => ({
      test,
      estimatedTime: this.estimateTestTime(test)
    }));

    return testsWithTime
      .sort((a, b) => b.estimatedTime - a.estimatedTime)
      .map(item => item.test);
  }

  estimateTestTime(test) {
    // Estimate based on test file size and complexity
    const fileSize = require('fs').statSync(test.path).size;
    const complexity = this.calculateComplexity(test.path);

    return fileSize * complexity * 0.001; // Rough estimation
  }

  calculateComplexity(filePath) {
    try {
      const content = require('fs').readFileSync(filePath, 'utf8');
      const lines = content.split('\n').length;
      const functions = (content.match(/function|=>/g) || []).length;
      const asyncCalls = (content.match(/await|Promise/g) || []).length;

      return Math.max(1, lines * 0.1 + functions * 0.5 + asyncCalls * 0.3);
    } catch {
      return 1;
    }
  }
}

module.exports = ParallelTestSequencer;
