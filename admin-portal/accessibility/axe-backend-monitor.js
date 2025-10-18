const { AxePuppeteer } = require('@axe-core/puppeteer');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Axe Accessibility Test for Backend Monitor Page
 * Tests WCAG 2.1 AA compliance and accessibility best practices
 */

async function runAxeTest() {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('♿ Starting Axe accessibility test for Backend Monitor page...');
    
    // Navigate to the page
    await page.goto('http://localhost:3000/backend-monitor', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for the page to fully load
    await page.waitForSelector('.backend-monitor', { timeout: 10000 });
    
    // Run axe accessibility tests
    const results = await new AxePuppeteer(page)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .withRules([
        'color-contrast',
        'color-contrast-enhanced',
        'keyboard-navigation',
        'focus-order-semantics',
        'focus-traps',
        'focusable-controls',
        'interactive-element-affordance',
        'logical-tab-order',
        'managed-focus',
        'offscreen-content-hidden',
        'use-landmarks',
        'visual-order-follows-dom',
        'works-without-javascript',
        'bypass',
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
        'aria-allowed-attr',
        'aria-required-attr',
        'aria-required-children',
        'aria-required-parent',
        'aria-roles',
        'aria-valid-attr',
        'aria-valid-attr-value',
        'button-name',
        'checkboxgroup',
        'dlitem',
        'document-title',
        'duplicate-id',
        'form-field-multiple-labels',
        'frame-title',
        'html-has-lang',
        'html-lang-valid',
        'image-alt',
        'input-image-alt',
        'label',
        'link-name',
        'list',
        'listitem',
        'marquee',
        'meta-refresh',
        'meta-viewport',
        'object-alt',
        'radiogroup',
        'region',
        'scope-attr-valid',
        'server-side-image-map',
        'td-headers-attr',
        'th-has-data-cells',
        'valid-lang',
        'video-caption',
        'video-description',
        'accesskeys',
        'area-alt',
        'aria-allowed-attr',
        'aria-required-attr',
        'aria-required-children',
        'aria-required-parent',
        'aria-roles',
        'aria-valid-attr',
        'aria-valid-attr-value',
        'audio-caption',
        'blink',
        'button-name',
        'bypass',
        'checkboxgroup',
        'color-contrast',
        'color-contrast-enhanced',
        'definition-list',
        'dlitem',
        'document-title',
        'duplicate-id',
        'duplicate-id-active',
        'duplicate-id-aria',
        'empty-heading',
        'empty-table-header',
        'form-field-multiple-labels',
        'frame-title',
        'frame-title-unique',
        'html-has-lang',
        'html-lang-valid',
        'html-xml-lang-mismatch',
        'image-alt',
        'image-redundant-alt',
        'input-image-alt',
        'label',
        'landmark-banner-is-top-level',
        'landmark-complementary-is-top-level',
        'landmark-contentinfo-is-top-level',
        'landmark-main-is-top-level',
        'landmark-no-duplicate-banner',
        'landmark-no-duplicate-contentinfo',
        'landmark-no-duplicate-main',
        'landmark-one-main',
        'landmark-unique',
        'link-name',
        'list',
        'listitem',
        'marquee',
        'meta-refresh',
        'meta-viewport',
        'meta-viewport-large',
        'object-alt',
        'page-has-heading-one',
        'page-has-main',
        'presentation-role-conflict',
        'radiogroup',
        'region',
        'scope-attr-valid',
        'scrollable-region-focusable',
        'server-side-image-map',
        'skip-link',
        'tabindex',
        'td-headers-attr',
        'th-has-data-cells',
        'valid-lang',
        'video-caption',
        'video-description',
        'video-description',
        'autocomplete-valid',
        'avoid-inline-spacing',
        'css-orientation-lock',
        'focus-order-semantics',
        'hidden-content',
        'label-content-name-mismatch',
        'link-in-text-block',
        'no-autoplay-audio',
        'p-as-heading',
        'table-duplicate-name',
        'td-has-header',
        'th-has-data-cells',
        'valid-lang',
        'video-caption',
        'video-description'
      ])
      .analyze();
    
    // Extract results
    const violations = results.violations;
    const passes = results.passes;
    const incomplete = results.incomplete;
    const inapplicable = results.inapplicable;
    
    console.log('\n📊 Axe Accessibility Results:');
    console.log('=============================');
    
    // Summary
    console.log(`\n✅ Passed: ${passes.length} checks`);
    console.log(`❌ Violations: ${violations.length} checks`);
    console.log(`⚠️  Incomplete: ${incomplete.length} checks`);
    console.log(`ℹ️  Inapplicable: ${inapplicable.length} checks`);
    
    // Overall score
    const totalChecks = passes.length + violations.length + incomplete.length;
    const passRate = ((passes.length / totalChecks) * 100).toFixed(1);
    console.log(`\n🎯 Overall Accessibility Score: ${passRate}%`);
    
    // Check if meets requirements (95%+ for accessibility)
    const requirements = {
      accessibility: 95
    };
    
    const accessibilityPass = parseFloat(passRate) >= requirements.accessibility;
    console.log(`\n♿ Accessibility: ${accessibilityPass ? '✅ PASS' : '❌ FAIL'} (${passRate}%, required: ${requirements.accessibility}%)`);
    
    // Detailed violation report
    if (violations.length > 0) {
      console.log('\n❌ Accessibility Violations:');
      console.log('============================');
      
      violations.forEach((violation, index) => {
        console.log(`\n${index + 1}. ${violation.id}: ${violation.description}`);
        console.log(`   Impact: ${violation.impact}`);
        console.log(`   Help: ${violation.help}`);
        console.log(`   Help URL: ${violation.helpUrl}`);
        
        if (violation.nodes && violation.nodes.length > 0) {
          console.log(`   Affected Elements: ${violation.nodes.length}`);
          violation.nodes.forEach((node, nodeIndex) => {
            console.log(`   ${nodeIndex + 1}. ${node.html}`);
            if (node.failureSummary) {
              console.log(`      ${node.failureSummary}`);
            }
          });
        }
      });
    }
    
    // Detailed pass report
    if (passes.length > 0) {
      console.log('\n✅ Accessibility Passes:');
      console.log('========================');
      
      passes.forEach((pass, index) => {
        console.log(`${index + 1}. ${pass.id}: ${pass.description}`);
      });
    }
    
    // Incomplete checks
    if (incomplete.length > 0) {
      console.log('\n⚠️  Incomplete Checks:');
      console.log('=====================');
      
      incomplete.forEach((incomplete, index) => {
        console.log(`${index + 1}. ${incomplete.id}: ${incomplete.description}`);
        console.log(`   Reason: ${incomplete.help}`);
      });
    }
    
    // Recommendations
    console.log('\n💡 Accessibility Recommendations:');
    console.log('==================================');
    
    if (violations.some(v => v.id === 'color-contrast')) {
      console.log('• Improve color contrast ratios (WCAG 2.1 AA requires 4.5:1 for normal text)');
    }
    
    if (violations.some(v => v.id === 'color-contrast-enhanced')) {
      console.log('• Improve color contrast ratios (WCAG 2.1 AAA requires 7:1 for normal text)');
    }
    
    if (violations.some(v => v.id === 'keyboard-navigation')) {
      console.log('• Ensure all interactive elements are keyboard accessible');
    }
    
    if (violations.some(v => v.id === 'focus-order-semantics')) {
      console.log('• Fix focus order to match logical reading order');
    }
    
    if (violations.some(v => v.id === 'focus-traps')) {
      console.log('• Implement proper focus traps for modal dialogs');
    }
    
    if (violations.some(v => v.id === 'focusable-controls')) {
      console.log('• Ensure all interactive elements are focusable');
    }
    
    if (violations.some(v => v.id === 'interactive-element-affordance')) {
      console.log('• Make interactive elements visually distinct');
    }
    
    if (violations.some(v => v.id === 'logical-tab-order')) {
      console.log('• Fix tab order to follow logical sequence');
    }
    
    if (violations.some(v => v.id === 'managed-focus')) {
      console.log('• Implement proper focus management');
    }
    
    if (violations.some(v => v.id === 'offscreen-content-hidden')) {
      console.log('• Hide offscreen content from screen readers');
    }
    
    if (violations.some(v => v.id === 'use-landmarks')) {
      console.log('• Use proper landmark elements (header, main, nav, aside, footer)');
    }
    
    if (violations.some(v => v.id === 'visual-order-follows-dom')) {
      console.log('• Ensure visual order matches DOM order');
    }
    
    if (violations.some(v => v.id === 'works-without-javascript')) {
      console.log('• Ensure core functionality works without JavaScript');
    }
    
    if (violations.some(v => v.id === 'bypass')) {
      console.log('• Provide skip links to bypass repetitive content');
    }
    
    if (violations.some(v => v.id === 'image-alt')) {
      console.log('• Add alt text to all images');
    }
    
    if (violations.some(v => v.id === 'label')) {
      console.log('• Add labels to all form controls');
    }
    
    if (violations.some(v => v.id === 'link-name')) {
      console.log('• Add descriptive text to all links');
    }
    
    if (violations.some(v => v.id === 'list')) {
      console.log('• Use proper list elements (ul, ol, dl)');
    }
    
    if (violations.some(v => v.id === 'listitem')) {
      console.log('• Use proper list item elements (li, dt, dd)');
    }
    
    if (violations.some(v => v.id === 'meta-description')) {
      console.log('• Add meta description to the page');
    }
    
    if (violations.some(v => v.id === 'object-alt')) {
      console.log('• Add alt text to object elements');
    }
    
    if (violations.some(v => v.id === 'tabindex')) {
      console.log('• Remove tabindex from non-interactive elements');
    }
    
    if (violations.some(v => v.id === 'td-headers-attr')) {
      console.log('• Add headers attribute to table cells');
    }
    
    if (violations.some(v => v.id === 'th-has-data-cells')) {
      console.log('• Ensure table headers have associated data cells');
    }
    
    if (violations.some(v => v.id === 'valid-lang')) {
      console.log('• Use valid language codes in lang attribute');
    }
    
    if (violations.some(v => v.id === 'video-caption')) {
      console.log('• Add captions to video elements');
    }
    
    if (violations.some(v => v.id === 'video-description')) {
      console.log('• Add descriptions to video elements');
    }
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'axe-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Return results for CI/CD
    return {
      success: accessibilityPass,
      score: parseFloat(passRate),
      violations: violations.length,
      passes: passes.length,
      incomplete: incomplete.length,
      inapplicable: inapplicable.length,
      reportPath
    };
    
  } catch (error) {
    console.error('❌ Axe accessibility test failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test if called directly
if (require.main === module) {
  runAxeTest()
    .then((results) => {
      console.log('\n🎉 Axe accessibility test completed successfully!');
      process.exit(results.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Axe accessibility test failed:', error);
      process.exit(1);
    });
}

module.exports = { runAxeTest };








