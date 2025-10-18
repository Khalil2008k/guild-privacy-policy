/**
 * Connection Test Runner
 * Executes comprehensive system connection tests
 */

import { connectionTester, SystemHealthReport } from './connectionTester';
import { logger } from './logger';

/**
 * Run all connection tests and generate report
 */
export async function runSystemConnectionTests(): Promise<SystemHealthReport> {
  try {
    logger.info('🚀 Starting comprehensive system connection tests...');
    
    const report = await connectionTester.runAllTests();
    
    // Log detailed results
    console.log('\n' + '='.repeat(80));
    console.log('🔍 GUILD SYSTEM CONNECTION TEST RESULTS');
    console.log('='.repeat(80));
    console.log(`📊 Overall Status: ${getStatusEmoji(report.overallStatus)} ${report.overallStatus.toUpperCase()}`);
    console.log(`📈 Tests: ${report.totalTests} total, ${report.passedTests} passed, ${report.failedTests} failed, ${report.warningTests} warnings`);
    console.log(`⏰ Generated: ${report.generatedAt.toISOString()}`);
    console.log('');
    
    // Log each connection result
    report.connections.forEach((connection, index) => {
      const statusEmoji = getStatusEmoji(connection.status);
      const responseTime = connection.responseTime < 1000 ? 
        `${connection.responseTime}ms` : 
        `${(connection.responseTime / 1000).toFixed(2)}s`;
        
      console.log(`${index + 1}. ${statusEmoji} ${connection.name}`);
      console.log(`   ${connection.details}`);
      console.log(`   Response Time: ${responseTime}`);
      
      if (connection.data && Object.keys(connection.data).length > 0) {
        console.log(`   Data: ${JSON.stringify(connection.data, null, 2).replace(/\n/g, '\n   ')}`);
      }
      console.log('');
    });
    
    console.log('='.repeat(80));
    
    // Generate recommendations
    generateRecommendations(report);
    
    return report;
    
  } catch (error: any) {
    logger.error('Connection test runner failed', { error: error.message });
    throw error;
  }
}

/**
 * Get status emoji for display
 */
function getStatusEmoji(status: string): string {
  switch (status) {
    case 'success':
    case 'healthy':
      return '✅';
    case 'warning':
    case 'degraded':
      return '⚠️';
    case 'error':
    case 'critical':
      return '❌';
    default:
      return '❓';
  }
}

/**
 * Generate recommendations based on test results
 */
function generateRecommendations(report: SystemHealthReport): void {
  console.log('💡 RECOMMENDATIONS:');
  console.log('-'.repeat(50));
  
  const failedConnections = report.connections.filter(c => c.status === 'error');
  const warningConnections = report.connections.filter(c => c.status === 'warning');
  
  if (report.overallStatus === 'healthy') {
    console.log('🎉 System is healthy and ready for production!');
    console.log('✅ All critical connections are working properly');
    
    if (warningConnections.length > 0) {
      console.log('');
      console.log('⚠️ Minor warnings (expected for future integrations):');
      warningConnections.forEach(conn => {
        console.log(`   - ${conn.name}: ${conn.details}`);
      });
    }
    
    console.log('');
    console.log('🚀 Ready for PSP integration - all endpoints prepared');
    
  } else if (report.overallStatus === 'degraded') {
    console.log('⚠️ System has some issues but is functional');
    
    if (failedConnections.length > 0) {
      console.log('');
      console.log('❌ Failed connections that need attention:');
      failedConnections.forEach(conn => {
        console.log(`   - ${conn.name}: ${conn.details}`);
      });
    }
    
    if (warningConnections.length > 0) {
      console.log('');
      console.log('⚠️ Warnings to monitor:');
      warningConnections.forEach(conn => {
        console.log(`   - ${conn.name}: ${conn.details}`);
      });
    }
    
  } else {
    console.log('🚨 System has critical issues that must be resolved');
    
    console.log('');
    console.log('❌ Critical failures:');
    failedConnections.forEach(conn => {
      console.log(`   - ${conn.name}: ${conn.details}`);
    });
    
    console.log('');
    console.log('🔧 Immediate actions required:');
    console.log('   1. Check backend server status');
    console.log('   2. Verify Firebase configuration');
    console.log('   3. Ensure all services are running');
    console.log('   4. Check network connectivity');
  }
  
  console.log('');
  console.log('📋 Next Steps:');
  console.log('   1. Fix any failed connections');
  console.log('   2. Monitor warning connections');
  console.log('   3. Integrate PSP API when ready');
  console.log('   4. Run tests again after changes');
  
  console.log('-'.repeat(50));
}

/**
 * Quick connection test for specific connections
 */
export async function testSpecificConnections(connectionIds: number[]): Promise<void> {
  logger.info('🔍 Testing specific connections', { connectionIds });
  
  for (const id of connectionIds) {
    try {
      let result;
      
      switch (id) {
        case 1:
          result = await connectionTester.testConnection1();
          break;
        case 2:
          result = await connectionTester.testConnection2();
          break;
        case 3:
          result = await connectionTester.testConnection3();
          break;
        case 4:
          result = await connectionTester.testConnection4();
          break;
        case 5:
          result = await connectionTester.testConnection5();
          break;
        case 6:
          result = await connectionTester.testConnection6();
          break;
        case 7:
          result = await connectionTester.testConnection7();
          break;
        case 8:
          result = await connectionTester.testConnection8();
          break;
        case 9:
          result = await connectionTester.testConnection9();
          break;
        case 10:
          result = await connectionTester.testConnection10();
          break;
        case 11:
          result = await connectionTester.testConnection11();
          break;
        default:
          console.log(`❓ Unknown connection ID: ${id}`);
          continue;
      }
      
      const statusEmoji = getStatusEmoji(result.status);
      console.log(`${statusEmoji} Connection ${id}: ${result.name}`);
      console.log(`   ${result.details}`);
      console.log(`   Response Time: ${result.responseTime}ms`);
      console.log('');
      
    } catch (error: any) {
      console.log(`❌ Connection ${id} test failed: ${error.message}`);
    }
  }
}

export default {
  runSystemConnectionTests,
  testSpecificConnections
};
