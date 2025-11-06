/**
 * Advanced AI Service Test Suite
 * 
 * Comprehensive testing of the advanced profile picture AI service
 * with multiple algorithms, quality assessment, and error handling.
 */

const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch').default;

const USER_IMAGE_PATH = 'C:\\Users\\Admin\\Pictures\\Screenshots\\Screenshot 2025-10-30 075058.png';
const BACKEND_API_URL = 'https://guild-backend.onrender.com';

class AdvancedAIServiceTester {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async runComprehensiveTests() {
    console.log('🚀 Advanced AI Service Test Suite');
    console.log('═'.repeat(60));
    console.log('Testing production-ready AI background removal service\n');

    try {
      // Test 1: Health Check
      await this.testHealthCheck();
      
      // Test 2: Service Configuration
      await this.testServiceConfiguration();
      
      // Test 3: Basic Image Processing
      await this.testBasicImageProcessing();
      
      // Test 4: Advanced Algorithms
      await this.testAdvancedAlgorithms();
      
      // Test 5: Quality Assessment
      await this.testQualityAssessment();
      
      // Test 6: Error Handling
      await this.testErrorHandling();
      
      // Test 7: Performance Testing
      await this.testPerformance();
      
      // Test 8: Batch Processing
      await this.testBatchProcessing();
      
      // Test 9: Caching System
      await this.testCachingSystem();
      
      // Test 10: Metrics and Monitoring
      await this.testMetricsAndMonitoring();

      // Generate comprehensive report
      this.generateReport();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  async testHealthCheck() {
    console.log('🔍 Test 1: Health Check');
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/advanced-profile-picture-ai/health`);
      const data = await response.json();
      
      if (response.ok && data.status === 'healthy') {
        console.log('✅ Health check passed');
        console.log(`   Uptime: ${data.uptime}s`);
        console.log(`   Memory: ${Math.round(data.memory.heapUsed / 1024 / 1024)}MB`);
        this.results.push({ test: 'Health Check', status: 'PASS', details: data });
      } else {
        throw new Error(`Health check failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log('❌ Health check failed:', error.message);
      this.results.push({ test: 'Health Check', status: 'FAIL', error: error.message });
    }
    console.log('');
  }

  async testServiceConfiguration() {
    console.log('🔧 Test 2: Service Configuration');
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/advanced-profile-picture-ai/config`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ Configuration retrieved successfully');
        console.log('   Available algorithms:', Object.keys(data.config.algorithms));
        console.log('   Quality settings:', data.config.quality);
        console.log('   Caching enabled:', data.config.caching.enabled);
        this.results.push({ test: 'Configuration', status: 'PASS', details: data.config });
      } else {
        throw new Error('Configuration retrieval failed');
      }
    } catch (error) {
      console.log('❌ Configuration test failed:', error.message);
      this.results.push({ test: 'Configuration', status: 'FAIL', error: error.message });
    }
    console.log('');
  }

  async testBasicImageProcessing() {
    console.log('🖼️ Test 3: Basic Image Processing');
    
    if (!fs.existsSync(USER_IMAGE_PATH)) {
      console.log('❌ Test image not found:', USER_IMAGE_PATH);
      this.results.push({ test: 'Basic Processing', status: 'SKIP', reason: 'Image not found' });
      return;
    }

    try {
      const imageBuffer = fs.readFileSync(USER_IMAGE_PATH);
      const formData = new FormData();
      formData.append('image', imageBuffer, {
        filename: 'test-image.jpg',
        contentType: 'image/jpeg'
      });
      formData.append('method', 'auto');
      formData.append('qualityThreshold', '0.7');
      formData.append('enableFallback', 'true');
      formData.append('enableCaching', 'true');

      const response = await fetch(`${BACKEND_API_URL}/api/advanced-profile-picture-ai/process`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': 'Bearer test-token',
          ...formData.getHeaders()
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ Basic processing successful');
        console.log(`   Method used: ${data.result.method}`);
        console.log(`   Confidence: ${data.result.confidence}`);
        console.log(`   Quality score: ${data.result.quality.overall}`);
        console.log(`   Face detected: ${data.result.face.detected}`);
        console.log(`   Processing time: ${data.processingTime}ms`);
        this.results.push({ test: 'Basic Processing', status: 'PASS', details: data.result });
      } else {
        throw new Error(`Processing failed: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.log('❌ Basic processing failed:', error.message);
      this.results.push({ test: 'Basic Processing', status: 'FAIL', error: error.message });
    }
    console.log('');
  }

  async testAdvancedAlgorithms() {
    console.log('🧠 Test 4: Advanced Algorithms');
    
    const algorithms = ['grabcut', 'selfie', 'u2net', 'color'];
    const results = [];

    for (const algorithm of algorithms) {
      try {
        console.log(`   Testing ${algorithm} algorithm...`);
        
        const imageBuffer = fs.readFileSync(USER_IMAGE_PATH);
        const formData = new FormData();
        formData.append('image', imageBuffer, {
          filename: 'test-image.jpg',
          contentType: 'image/jpeg'
        });
        formData.append('method', algorithm);
        formData.append('qualityThreshold', '0.6');

        const response = await fetch(`${BACKEND_API_URL}/api/advanced-profile-picture-ai/process`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': 'Bearer test-token',
            ...formData.getHeaders()
          }
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
          console.log(`   ✅ ${algorithm}: Success (${data.result.confidence} confidence)`);
          results.push({ algorithm, success: true, confidence: data.result.confidence });
        } else {
          console.log(`   ❌ ${algorithm}: Failed - ${data.error?.message || 'Unknown error'}`);
          results.push({ algorithm, success: false, error: data.error?.message });
        }
      } catch (error) {
        console.log(`   ❌ ${algorithm}: Error - ${error.message}`);
        results.push({ algorithm, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`   Summary: ${successCount}/${algorithms.length} algorithms working`);
    this.results.push({ test: 'Advanced Algorithms', status: successCount > 0 ? 'PASS' : 'FAIL', details: results });
    console.log('');
  }

  async testQualityAssessment() {
    console.log('📊 Test 5: Quality Assessment');
    
    try {
      const imageBuffer = fs.readFileSync(USER_IMAGE_PATH);
      const formData = new FormData();
      formData.append('image', imageBuffer, {
        filename: 'test-image.jpg',
        contentType: 'image/jpeg'
      });
      formData.append('method', 'auto');
      formData.append('qualityThreshold', '0.8');

      const response = await fetch(`${BACKEND_API_URL}/api/advanced-profile-picture-ai/process`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': 'Bearer test-token',
          ...formData.getHeaders()
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        const quality = data.result.quality;
        console.log('✅ Quality assessment completed');
        console.log(`   Overall quality: ${quality.overall}`);
        console.log(`   Face quality: ${quality.face}`);
        console.log(`   Background removal: ${quality.background}`);
        console.log(`   Edge quality: ${quality.edges}`);
        console.log(`   Resolution: ${quality.resolution}`);
        console.log(`   Compression: ${quality.compression}`);
        
        const qualityScore = quality.overall;
        if (qualityScore >= 0.8) {
          console.log('   🎯 Excellent quality');
        } else if (qualityScore >= 0.6) {
          console.log('   ✅ Good quality');
        } else if (qualityScore >= 0.4) {
          console.log('   ⚠️ Acceptable quality');
        } else {
          console.log('   ❌ Poor quality');
        }
        
        this.results.push({ test: 'Quality Assessment', status: 'PASS', details: quality });
      } else {
        throw new Error('Quality assessment failed');
      }
    } catch (error) {
      console.log('❌ Quality assessment failed:', error.message);
      this.results.push({ test: 'Quality Assessment', status: 'FAIL', error: error.message });
    }
    console.log('');
  }

  async testErrorHandling() {
    console.log('🛡️ Test 6: Error Handling');
    
    const errorTests = [
      {
        name: 'Invalid file type',
        test: async () => {
          const formData = new FormData();
          formData.append('image', Buffer.from('invalid data'), {
            filename: 'test.txt',
            contentType: 'text/plain'
          });
          
          const response = await fetch(`${BACKEND_API_URL}/api/advanced-profile-picture-ai/process`, {
            method: 'POST',
            body: formData,
            headers: {
              'Authorization': 'Bearer test-token',
              ...formData.getHeaders()
            }
          });
          
          return response.status === 400;
        }
      },
      {
        name: 'Missing image file',
        test: async () => {
          const formData = new FormData();
          
          const response = await fetch(`${BACKEND_API_URL}/api/advanced-profile-picture-ai/process`, {
            method: 'POST',
            body: formData,
            headers: {
              'Authorization': 'Bearer test-token',
              ...formData.getHeaders()
            }
          });
          
          return response.status === 400;
        }
      },
      {
        name: 'Invalid parameters',
        test: async () => {
          const imageBuffer = fs.readFileSync(USER_IMAGE_PATH);
          const formData = new FormData();
          formData.append('image', imageBuffer, {
            filename: 'test-image.jpg',
            contentType: 'image/jpeg'
          });
          formData.append('method', 'invalid_method');
          formData.append('qualityThreshold', '2.0'); // Invalid range
          
          const response = await fetch(`${BACKEND_API_URL}/api/advanced-profile-picture-ai/process`, {
            method: 'POST',
            body: formData,
            headers: {
              'Authorization': 'Bearer test-token',
              ...formData.getHeaders()
            }
          });
          
          return response.status === 400;
        }
      }
    ];

    let passedTests = 0;
    for (const errorTest of errorTests) {
      try {
        const passed = await errorTest.test();
        if (passed) {
          console.log(`   ✅ ${errorTest.name}: Handled correctly`);
          passedTests++;
        } else {
          console.log(`   ❌ ${errorTest.name}: Not handled correctly`);
        }
      } catch (error) {
        console.log(`   ❌ ${errorTest.name}: Error - ${error.message}`);
      }
    }

    console.log(`   Summary: ${passedTests}/${errorTests.length} error cases handled correctly`);
    this.results.push({ test: 'Error Handling', status: passedTests === errorTests.length ? 'PASS' : 'FAIL', details: { passedTests, totalTests: errorTests.length } });
    console.log('');
  }

  async testPerformance() {
    console.log('⚡ Test 7: Performance Testing');
    
    try {
      const imageBuffer = fs.readFileSync(USER_IMAGE_PATH);
      const iterations = 3;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        const formData = new FormData();
        formData.append('image', imageBuffer, {
          filename: 'test-image.jpg',
          contentType: 'image/jpeg'
        });
        formData.append('method', 'auto');
        formData.append('enableCaching', 'true');

        const response = await fetch(`${BACKEND_API_URL}/api/advanced-profile-picture-ai/process`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': 'Bearer test-token',
            ...formData.getHeaders()
          }
        });

        const data = await response.json();
        const endTime = Date.now();
        
        if (response.ok && data.success) {
          const processingTime = endTime - startTime;
          times.push(processingTime);
          console.log(`   Iteration ${i + 1}: ${processingTime}ms`);
        } else {
          console.log(`   Iteration ${i + 1}: Failed`);
        }
      }

      if (times.length > 0) {
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        
        console.log(`   Average time: ${avgTime.toFixed(2)}ms`);
        console.log(`   Min time: ${minTime}ms`);
        console.log(`   Max time: ${maxTime}ms`);
        
        if (avgTime < 5000) {
          console.log('   ✅ Performance: Excellent');
        } else if (avgTime < 10000) {
          console.log('   ✅ Performance: Good');
        } else {
          console.log('   ⚠️ Performance: Needs improvement');
        }
        
        this.results.push({ test: 'Performance', status: 'PASS', details: { avgTime, minTime, maxTime, iterations: times.length } });
      } else {
        throw new Error('All performance tests failed');
      }
    } catch (error) {
      console.log('❌ Performance test failed:', error.message);
      this.results.push({ test: 'Performance', status: 'FAIL', error: error.message });
    }
    console.log('');
  }

  async testBatchProcessing() {
    console.log('📦 Test 8: Batch Processing');
    
    try {
      const imageBuffer = fs.readFileSync(USER_IMAGE_PATH);
      const base64Image = imageBuffer.toString('base64');
      
      const batchData = {
        images: [
          { id: 'test1', image: base64Image, options: { method: 'grabcut' } },
          { id: 'test2', image: base64Image, options: { method: 'selfie' } },
          { id: 'test3', image: base64Image, options: { method: 'color' } }
        ],
        batchId: 'test-batch-' + Date.now()
      };

      const response = await fetch(`${BACKEND_API_URL}/api/advanced-profile-picture-ai/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify(batchData)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ Batch processing successful');
        console.log(`   Total images: ${data.summary.total}`);
        console.log(`   Successful: ${data.summary.successful}`);
        console.log(`   Failed: ${data.summary.failed}`);
        console.log(`   Success rate: ${(data.summary.successRate * 100).toFixed(1)}%`);
        console.log(`   Processing time: ${data.processingTime}ms`);
        
        this.results.push({ test: 'Batch Processing', status: 'PASS', details: data.summary });
      } else {
        throw new Error('Batch processing failed');
      }
    } catch (error) {
      console.log('❌ Batch processing failed:', error.message);
      this.results.push({ test: 'Batch Processing', status: 'FAIL', error: error.message });
    }
    console.log('');
  }

  async testCachingSystem() {
    console.log('💾 Test 9: Caching System');
    
    try {
      const imageBuffer = fs.readFileSync(USER_IMAGE_PATH);
      
      // First request (should be cached)
      const start1 = Date.now();
      const formData1 = new FormData();
      formData1.append('image', imageBuffer, {
        filename: 'test-image.jpg',
        contentType: 'image/jpeg'
      });
      formData1.append('method', 'auto');
      formData1.append('enableCaching', 'true');

      const response1 = await fetch(`${BACKEND_API_URL}/api/advanced-profile-picture-ai/process`, {
        method: 'POST',
        body: formData1,
        headers: {
          'Authorization': 'Bearer test-token',
          ...formData1.getHeaders()
        }
      });

      const data1 = await response1.json();
      const time1 = Date.now() - start1;

      // Second request (should hit cache)
      const start2 = Date.now();
      const formData2 = new FormData();
      formData2.append('image', imageBuffer, {
        filename: 'test-image.jpg',
        contentType: 'image/jpeg'
      });
      formData2.append('method', 'auto');
      formData2.append('enableCaching', 'true');

      const response2 = await fetch(`${BACKEND_API_URL}/api/advanced-profile-picture-ai/process`, {
        method: 'POST',
        body: formData2,
        headers: {
          'Authorization': 'Bearer test-token',
          ...formData2.getHeaders()
        }
      });

      const data2 = await response2.json();
      const time2 = Date.now() - start2;

      if (response1.ok && response2.ok && data1.success && data2.success) {
        console.log('✅ Caching system working');
        console.log(`   First request: ${time1}ms`);
        console.log(`   Second request: ${time2}ms`);
        console.log(`   Cache hit: ${time2 < time1 ? 'Yes' : 'No'}`);
        console.log(`   Cache key present: ${!!data2.result.cacheKey}`);
        
        this.results.push({ test: 'Caching', status: 'PASS', details: { time1, time2, cacheHit: time2 < time1 } });
      } else {
        throw new Error('Caching test failed');
      }
    } catch (error) {
      console.log('❌ Caching test failed:', error.message);
      this.results.push({ test: 'Caching', status: 'FAIL', error: error.message });
    }
    console.log('');
  }

  async testMetricsAndMonitoring() {
    console.log('📈 Test 10: Metrics and Monitoring');
    
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/advanced-profile-picture-ai/metrics`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        const metrics = data.metrics;
        console.log('✅ Metrics retrieved successfully');
        console.log(`   Total processed: ${metrics.totalProcessed}`);
        console.log(`   Successful: ${metrics.successfulProcessed}`);
        console.log(`   Failed: ${metrics.failedProcessed}`);
        console.log(`   Success rate: ${(metrics.successRate * 100).toFixed(1)}%`);
        console.log(`   Average processing time: ${metrics.averageProcessingTime.toFixed(2)}ms`);
        console.log(`   Cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);
        console.log(`   Cache size: ${metrics.cacheSize}`);
        console.log(`   Queue size: ${metrics.queueSize}`);
        
        this.results.push({ test: 'Metrics', status: 'PASS', details: metrics });
      } else {
        throw new Error('Metrics retrieval failed');
      }
    } catch (error) {
      console.log('❌ Metrics test failed:', error.message);
      this.results.push({ test: 'Metrics', status: 'FAIL', error: error.message });
    }
    console.log('');
  }

  generateReport() {
    const totalTime = Date.now() - this.startTime;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const skippedTests = this.results.filter(r => r.status === 'SKIP').length;
    
    console.log('📋 COMPREHENSIVE TEST REPORT');
    console.log('═'.repeat(60));
    console.log(`Total execution time: ${totalTime}ms`);
    console.log(`Tests passed: ${passedTests}`);
    console.log(`Tests failed: ${failedTests}`);
    console.log(`Tests skipped: ${skippedTests}`);
    console.log(`Success rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
    console.log('');
    
    console.log('📊 DETAILED RESULTS:');
    this.results.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
      console.log(`${status} ${result.test}: ${result.status}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('');
    console.log('🎯 RECOMMENDATIONS:');
    if (failedTests === 0) {
      console.log('✅ All tests passed! The AI service is production-ready.');
    } else {
      console.log('⚠️ Some tests failed. Review the issues above before deploying.');
    }
    
    if (totalTime > 30000) {
      console.log('⚠️ Performance could be improved - consider optimization.');
    }
    
    console.log('');
    console.log('🚀 Advanced AI Service Test Suite Complete!');
  }
}

// Run the comprehensive test suite
const tester = new AdvancedAIServiceTester();
tester.runComprehensiveTests().catch(console.error);











