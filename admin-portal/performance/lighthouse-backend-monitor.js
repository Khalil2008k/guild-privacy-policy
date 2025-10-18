const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

/**
 * Lighthouse Performance Test for Backend Monitor Page
 * Tests performance, accessibility, best practices, and SEO
 */

async function runLighthouseTest() {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
  };

  const config = {
    extends: 'lighthouse:default',
    settings: {
      onlyAudits: [
        'first-contentful-paint',
        'largest-contentful-paint',
        'first-meaningful-paint',
        'speed-index',
        'cumulative-layout-shift',
        'total-blocking-time',
        'interactive',
        'max-potential-fid',
        'uses-responsive-images',
        'uses-optimized-images',
        'uses-webp-images',
        'uses-text-compression',
        'uses-rel-preconnect',
        'uses-rel-preload',
        'efficient-animated-content',
        'appears-request',
        'color-contrast',
        'image-alt',
        'label',
        'link-name',
        'list',
        'listitem',
        'meta-description',
        'object-alt',
        'tabindex',
        'td-headers-attr',
        'th-has-data-cells',
        'valid-lang',
        'video-caption',
        'video-description',
        'bypass',
        'focus-traps',
        'focusable-controls',
        'heading-order',
        'interactive-element-affordance',
        'logical-tab-order',
        'managed-focus',
        'offscreen-content-hidden',
        'use-landmarks',
        'visual-order-follows-dom',
        'works-without-javascript',
        'no-vulnerable-libraries',
        'notification-on-start',
        'password-inputs-can-be-pasted-into',
        'uses-http2',
        'uses-passive-event-listeners',
        'is-on-https',
        'redirects-http',
        'service-worker',
        'viewport',
        'content-width',
        'image-aspect-ratio',
        'crawlable-anchors',
        'is-crawlable',
        'robots-txt',
        'tap-targets',
        'hreflang',
        'canonical',
        'font-display',
        'link-text',
        'plugins',
        'meta-refresh',
        'http-status-code',
        'unused-css-rules',
        'unused-javascript',
        'modern-image-formats',
        'offscreen-images',
        'render-blocking-resources',
        'unminified-css',
        'unminified-javascript',
        'uses-long-cache-ttl',
        'uses-optimized-images',
        'uses-text-compression',
        'uses-webp-images',
        'efficient-animated-content',
        'duplicated-javascript',
        'legacy-javascript',
        'mainthread-work-breakdown',
        'bootup-time',
        'uses-rel-preconnect',
        'uses-rel-preload',
        'critical-request-chains',
        'user-timings',
        'screenshot-thumbnails',
        'final-screenshot',
        'full-page-screenshot',
        'script-treemap-data',
        'network-requests',
        'network-rtt',
        'network-server-latency',
        'dom-size',
        'max-potential-fid',
        'cumulative-layout-shift',
        'total-blocking-time',
        'first-contentful-paint',
        'largest-contentful-paint',
        'first-meaningful-paint',
        'speed-index',
        'interactive',
        'estimated-input-latency',
        'uses-responsive-images',
        'uses-optimized-images',
        'uses-webp-images',
        'uses-text-compression',
        'uses-rel-preconnect',
        'uses-rel-preload',
        'efficient-animated-content',
        'appears-request',
        'color-contrast',
        'image-alt',
        'label',
        'link-name',
        'list',
        'listitem',
        'meta-description',
        'object-alt',
        'tabindex',
        'td-headers-attr',
        'th-has-data-cells',
        'valid-lang',
        'video-caption',
        'video-description',
        'bypass',
        'focus-traps',
        'focusable-controls',
        'heading-order',
        'interactive-element-affordance',
        'logical-tab-order',
        'managed-focus',
        'offscreen-content-hidden',
        'use-landmarks',
        'visual-order-follows-dom',
        'works-without-javascript',
        'no-vulnerable-libraries',
        'notification-on-start',
        'password-inputs-can-be-pasted-into',
        'uses-http2',
        'uses-passive-event-listeners',
        'is-on-https',
        'redirects-http',
        'service-worker',
        'viewport',
        'content-width',
        'image-aspect-ratio',
        'crawlable-anchors',
        'is-crawlable',
        'robots-txt',
        'tap-targets',
        'hreflang',
        'canonical',
        'font-display',
        'link-text',
        'plugins',
        'meta-refresh',
        'http-status-code',
        'unused-css-rules',
        'unused-javascript',
        'modern-image-formats',
        'offscreen-images',
        'render-blocking-resources',
        'unminified-css',
        'unminified-javascript',
        'uses-long-cache-ttl',
        'uses-optimized-images',
        'uses-text-compression',
        'uses-webp-images',
        'efficient-animated-content',
        'duplicated-javascript',
        'legacy-javascript',
        'mainthread-work-breakdown',
        'bootup-time',
        'uses-rel-preconnect',
        'uses-rel-preload',
        'critical-request-chains',
        'user-timings',
        'screenshot-thumbnails',
        'final-screenshot',
        'full-page-screenshot',
        'script-treemap-data',
        'network-requests',
        'network-rtt',
        'network-server-latency',
        'dom-size',
        'max-potential-fid',
        'cumulative-layout-shift',
        'total-blocking-time',
        'first-contentful-paint',
        'largest-contentful-paint',
        'first-meaningful-paint',
        'speed-index',
        'interactive',
        'estimated-input-latency'
      ],
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0
      },
      screenEmulation: {
        mobile: false,
        width: 1350,
        height: 940,
        deviceScaleFactor: 1,
        disabled: false
      },
      emulatedFormFactor: 'desktop',
      throttlingMethod: 'simulate',
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0
      }
    }
  };

  try {
    console.log('🚀 Starting Lighthouse test for Backend Monitor page...');
    
    const runnerResult = await lighthouse('http://localhost:3000/backend-monitor', options, config);
    
    // Extract metrics
    const lhr = runnerResult.lhr;
    const categories = lhr.categories;
    
    console.log('\n📊 Lighthouse Results:');
    console.log('====================');
    
    // Performance metrics
    const performance = categories.performance;
    console.log(`\n🎯 Performance Score: ${performance.score * 100}/100`);
    
    const audits = lhr.audits;
    
    // Core Web Vitals
    console.log('\n🔥 Core Web Vitals:');
    console.log(`LCP (Largest Contentful Paint): ${audits['largest-contentful-paint'].displayValue}`);
    console.log(`FID (First Input Delay): ${audits['max-potential-fid'].displayValue}`);
    console.log(`CLS (Cumulative Layout Shift): ${audits['cumulative-layout-shift'].displayValue}`);
    
    // Performance metrics
    console.log('\n⚡ Performance Metrics:');
    console.log(`FCP (First Contentful Paint): ${audits['first-contentful-paint'].displayValue}`);
    console.log(`SI (Speed Index): ${audits['speed-index'].displayValue}`);
    console.log(`TTI (Time to Interactive): ${audits['interactive'].displayValue}`);
    console.log(`TBT (Total Blocking Time): ${audits['total-blocking-time'].displayValue}`);
    
    // Accessibility
    const accessibility = categories.accessibility;
    console.log(`\n♿ Accessibility Score: ${accessibility.score * 100}/100`);
    
    // Best Practices
    const bestPractices = categories['best-practices'];
    console.log(`\n✅ Best Practices Score: ${bestPractices.score * 100}/100`);
    
    // SEO
    const seo = categories.seo;
    console.log(`\n🔍 SEO Score: ${seo.score * 100}/100`);
    
    // Check if scores meet requirements
    const requirements = {
      performance: 90,
      accessibility: 95,
      bestPractices: 90,
      seo: 90
    };
    
    console.log('\n🎯 Requirements Check:');
    console.log('=====================');
    
    const performancePass = performance.score * 100 >= requirements.performance;
    const accessibilityPass = accessibility.score * 100 >= requirements.accessibility;
    const bestPracticesPass = bestPractices.score * 100 >= requirements.bestPractices;
    const seoPass = seo.score * 100 >= requirements.seo;
    
    console.log(`Performance: ${performancePass ? '✅ PASS' : '❌ FAIL'} (${performance.score * 100}/100, required: ${requirements.performance})`);
    console.log(`Accessibility: ${accessibilityPass ? '✅ PASS' : '❌ FAIL'} (${accessibility.score * 100}/100, required: ${requirements.accessibility})`);
    console.log(`Best Practices: ${bestPracticesPass ? '✅ PASS' : '❌ FAIL'} (${bestPractices.score * 100}/100, required: ${requirements.bestPractices})`);
    console.log(`SEO: ${seoPass ? '✅ PASS' : '❌ FAIL'} (${seo.score * 100}/100, required: ${requirements.seo})`);
    
    // Overall result
    const allPass = performancePass && accessibilityPass && bestPracticesPass && seoPass;
    console.log(`\n🏆 Overall Result: ${allPass ? '✅ ALL REQUIREMENTS MET' : '❌ REQUIREMENTS NOT MET'}`);
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'lighthouse-report.html');
    fs.writeFileSync(reportPath, runnerResult.report);
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Performance recommendations
    console.log('\n💡 Performance Recommendations:');
    console.log('==============================');
    
    if (audits['unused-css-rules'].score < 1) {
      console.log('• Remove unused CSS rules');
    }
    
    if (audits['unused-javascript'].score < 1) {
      console.log('• Remove unused JavaScript');
    }
    
    if (audits['render-blocking-resources'].score < 1) {
      console.log('• Eliminate render-blocking resources');
    }
    
    if (audits['uses-text-compression'].score < 1) {
      console.log('• Enable text compression');
    }
    
    if (audits['uses-optimized-images'].score < 1) {
      console.log('• Optimize images');
    }
    
    if (audits['uses-webp-images'].score < 1) {
      console.log('• Use WebP image format');
    }
    
    if (audits['uses-long-cache-ttl'].score < 1) {
      console.log('• Use long cache TTL for static resources');
    }
    
    if (audits['uses-rel-preconnect'].score < 1) {
      console.log('• Use rel=preconnect for external domains');
    }
    
    if (audits['uses-rel-preload'].score < 1) {
      console.log('• Use rel=preload for critical resources');
    }
    
    // Accessibility recommendations
    console.log('\n♿ Accessibility Recommendations:');
    console.log('================================');
    
    if (audits['color-contrast'].score < 1) {
      console.log('• Improve color contrast ratios');
    }
    
    if (audits['image-alt'].score < 1) {
      console.log('• Add alt text to images');
    }
    
    if (audits['label'].score < 1) {
      console.log('• Add labels to form controls');
    }
    
    if (audits['link-name'].score < 1) {
      console.log('• Add descriptive link text');
    }
    
    if (audits['heading-order'].score < 1) {
      console.log('• Fix heading order');
    }
    
    if (audits['tabindex'].score < 1) {
      console.log('• Remove tabindex from non-interactive elements');
    }
    
    // Best practices recommendations
    console.log('\n✅ Best Practices Recommendations:');
    console.log('==================================');
    
    if (audits['no-vulnerable-libraries'].score < 1) {
      console.log('• Update vulnerable JavaScript libraries');
    }
    
    if (audits['uses-http2'].score < 1) {
      console.log('• Use HTTP/2');
    }
    
    if (audits['uses-passive-event-listeners'].score < 1) {
      console.log('• Use passive event listeners');
    }
    
    if (audits['is-on-https'].score < 1) {
      console.log('• Use HTTPS');
    }
    
    if (audits['service-worker'].score < 1) {
      console.log('• Register a service worker');
    }
    
    // SEO recommendations
    console.log('\n🔍 SEO Recommendations:');
    console.log('=======================');
    
    if (audits['meta-description'].score < 1) {
      console.log('• Add meta description');
    }
    
    if (audits['viewport'].score < 1) {
      console.log('• Add viewport meta tag');
    }
    
    if (audits['canonical'].score < 1) {
      console.log('• Add canonical URL');
    }
    
    if (audits['robots-txt'].score < 1) {
      console.log('• Add robots.txt file');
    }
    
    if (audits['tap-targets'].score < 1) {
      console.log('• Make tap targets at least 44px');
    }
    
    // Return results for CI/CD
    return {
      success: allPass,
      scores: {
        performance: performance.score * 100,
        accessibility: accessibility.score * 100,
        bestPractices: bestPractices.score * 100,
        seo: seo.score * 100
      },
      metrics: {
        lcp: audits['largest-contentful-paint'].numericValue,
        fid: audits['max-potential-fid'].numericValue,
        cls: audits['cumulative-layout-shift'].numericValue,
        fcp: audits['first-contentful-paint'].numericValue,
        si: audits['speed-index'].numericValue,
        tti: audits['interactive'].numericValue,
        tbt: audits['total-blocking-time'].numericValue
      },
      reportPath
    };
    
  } catch (error) {
    console.error('❌ Lighthouse test failed:', error);
    throw error;
  } finally {
    await chrome.kill();
  }
}

// Run the test if called directly
if (require.main === module) {
  runLighthouseTest()
    .then((results) => {
      console.log('\n🎉 Lighthouse test completed successfully!');
      process.exit(results.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Lighthouse test failed:', error);
      process.exit(1);
    });
}

module.exports = { runLighthouseTest };








