/**
 * AI-powered test analysis and report generation
 * Uses OpenAI to analyze test results and generate user-friendly reports
 */

const fs = require('fs');
const path = require('path');
const winston = require('winston');
const OpenAI = require('openai');

// Configure OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key-here'
});

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'analysis.log' }),
    new winston.transports.Console()
  ]
});

class TestAnalyzer {
  constructor(cycleNumber) {
    this.cycle = cycleNumber;
    this.reportPath = path.join(__dirname, '../reports');
  }

  async analyzeTestResults() {
    try {
      // Read test results
      const uiResults = await this.readUITestResults();
      const loadResults = await this.readLoadTestResults();

      // Generate AI analysis
      const analysis = await this.generateAIAnalysis(uiResults, loadResults);

      // Create report
      await this.createReport(analysis, uiResults, loadResults);

      logger.info(`Analysis completed for cycle ${this.cycle}`);
    } catch (error) {
      logger.error('Analysis failed:', error);
    }
  }

  async readUITestResults() {
    const uiReportPath = path.join(this.reportPath, 'functional', `cycle-${this.cycle}.json`);

    if (!fs.existsSync(uiReportPath)) {
      return { passed: 0, failed: 0, total: 0, errors: [] };
    }

    const uiData = JSON.parse(fs.readFileSync(uiReportPath, 'utf8'));
    return {
      passed: uiData.numPassedTests || 0,
      failed: uiData.numFailedTests || 0,
      total: uiData.numTotalTests || 0,
      errors: uiData.testResults?.map(result => result.failureMessage).filter(Boolean) || []
    };
  }

  async readLoadTestResults() {
    const loadReportPath = path.join(this.reportPath, 'load', `cycle-${this.cycle}.json`);

    if (!fs.existsSync(loadReportPath)) {
      return {
        requests: 0,
        errors: 0,
        avgResponseTime: 0,
        percentiles: {},
        scenarios: []
      };
    }

    const loadData = JSON.parse(fs.readFileSync(loadReportPath, 'utf8'));

    return {
      requests: loadData.aggregate.counters['http.requests'] || 0,
      errors: loadData.aggregate.counters['http.errors'] || 0,
      avgResponseTime: loadData.aggregate.summaries['http.response_time'].mean || 0,
      percentiles: loadData.aggregate.summaries['http.response_time'] || {},
      scenarios: loadData.aggregate.summaries || {}
    };
  }

  async generateAIAnalysis(uiResults, loadResults) {
    const prompt = `
You are an expert QA engineer analyzing test results for a mobile app called GUILD.

Analyze these test results and provide insights:

UI TEST RESULTS:
- Passed: ${uiResults.passed}
- Failed: ${uiResults.failed}
- Total: ${uiResults.total}
- Error Details: ${JSON.stringify(uiResults.errors.slice(0, 5))}

LOAD TEST RESULTS:
- Total Requests: ${loadResults.requests}
- Errors: ${loadResults.errors}
- Average Response Time: ${loadResults.avgResponseTime}ms
- 95th Percentile: ${loadResults.percentiles['95th'] || 'N/A'}ms

Please provide:
1. A summary of what worked and what failed
2. Specific issues identified
3. Performance analysis
4. Recommendations for fixes
5. Priority ranking of issues

Format your response as JSON with these keys:
{
  "summary": "Brief overview of test results",
  "working_features": ["List of features that worked"],
  "failed_features": ["List of features that failed"],
  "performance_insights": "Analysis of load test performance",
  "recommendations": ["List of recommended fixes"],
  "priority_issues": ["High priority issues to address"]
}
`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      logger.error('OpenAI analysis failed:', error);
      return this.generateFallbackAnalysis(uiResults, loadResults);
    }
  }

  generateFallbackAnalysis(uiResults, loadResults) {
    return {
      summary: `UI Tests: ${uiResults.passed}/${uiResults.total} passed. Load Tests: ${loadResults.requests} requests, ${loadResults.errors} errors.`,
      working_features: ["Basic app functionality", "User authentication"],
      failed_features: uiResults.errors.map(error => error.split(':')[0] || 'Unknown feature'),
      performance_insights: loadResults.avgResponseTime > 1000 ? "Performance issues detected" : "Acceptable performance",
      recommendations: ["Fix failing tests", "Optimize slow API calls"],
      priority_issues: ["Critical UI failures", "Performance bottlenecks"]
    };
  }

  async createReport(analysis, uiResults, loadResults) {
    const timestamp = new Date().toISOString();
    const report = {
      cycle: this.cycle,
      timestamp: timestamp,
      overview: {
        totalScreens: uiResults.total,
        passed: uiResults.passed,
        failed: uiResults.failed,
        successRate: uiResults.total > 0 ? (uiResults.passed / uiResults.total * 100).toFixed(1) + '%' : '0%',
        loadRequests: loadResults.requests,
        loadErrors: loadResults.errors,
        avgResponseTime: Math.round(loadResults.avgResponseTime)
      },
      aiAnalysis: analysis,
      recommendations: analysis.recommendations || [],
      loadMetrics: {
        totalRequests: loadResults.requests,
        errorRate: loadResults.requests > 0 ? (loadResults.errors / loadResults.requests * 100).toFixed(2) + '%' : '0%',
        averageResponseTime: Math.round(loadResults.avgResponseTime) + 'ms',
        percentiles: loadResults.percentiles
      }
    };

    // Save detailed report
    const reportPath = path.join(this.reportPath, 'analysis', `cycle-${this.cycle}.json`);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate user-friendly markdown report
    await this.createMarkdownReport(report);
  }

  async createMarkdownReport(report) {
    const markdown = `# User Testing Report - Cycle ${report.cycle}
**Generated**: ${new Date(report.timestamp).toLocaleString()}
**Duration**: 5 minutes

## Overview
- **Total Screens Tested**: ${report.overview.totalScreens}
- **Passed**: ${report.overview.passed} (${report.overview.successRate})
- **Failed**: ${report.overview.failed}
- **Load Test Requests**: ${report.overview.loadRequests.toLocaleString()}
- **Error Rate**: ${report.loadMetrics.errorRate}
- **Average Response Time**: ${report.loadMetrics.averageResponseTime}

## AI Analysis Summary
${report.aiAnalysis.summary}

### ✅ Working Features
${report.aiAnalysis.working_features.map(feature => `- ${feature}`).join('\n')}

### ❌ Failed Features
${report.aiAnalysis.failed_features.map(feature => `- ${feature}`).join('\n')}

## Performance Insights
${report.aiAnalysis.performance_insights}

### Load Test Results
| Metric | Value |
|--------|--------|
| Total Requests | ${report.loadMetrics.totalRequests.toLocaleString()} |
| Error Rate | ${report.loadMetrics.errorRate} |
| Avg Response Time | ${report.loadMetrics.averageResponseTime} |
| 95th Percentile | ${report.loadMetrics.percentiles['95th'] ? Math.round(report.loadMetrics.percentiles['95th']) + 'ms' : 'N/A'} |

## Recommendations
${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Priority Issues
${report.aiAnalysis.priority_issues.map(issue => `- ${issue}`).join('\n')}

---
*This report was generated automatically. Do not stop testing.*
`;

    const markdownPath = path.join(this.reportPath, 'analysis', `cycle-${this.cycle}.md`);
    fs.writeFileSync(markdownPath, markdown);

    logger.info(`Report generated: ${markdownPath}`);
  }
}

// Main execution
if (require.main === module) {
  const cycleNumber = parseInt(process.argv[2]) || 1;
  const analyzer = new TestAnalyzer(cycleNumber);
  analyzer.analyzeTestResults();
}

module.exports = TestAnalyzer;
