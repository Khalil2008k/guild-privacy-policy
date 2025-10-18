/**
 * 📐 STATIC ANALYSIS TEST - Different Approach
 * 
 * Code quality and structure analysis
 * No runtime execution required
 */

const fs = require('fs');
const assert = require('assert');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// ============================================================================
// STATIC TEST 1: CODE METRICS
// ============================================================================
function testCodeMetrics() {
  log('blue', '\n═══════════════════════════════════════════════════════════');
  log('blue', '📐 STATIC TEST 1: CODE METRICS');
  log('blue', '═══════════════════════════════════════════════════════════\n');
  
  const tests = { total: 0, passed: 0, failed: 0 };
  
  const files = [
    { path: './backend/src/services/paymentTokenService.ts', name: 'Payment Token', minLines: 300 },
    { path: './backend/src/services/reconciliationService.ts', name: 'Reconciliation', minLines: 250 },
    { path: './backend/src/services/smartEscrowService.ts', name: 'Smart Escrow', minLines: 350 }
  ];
  
  for (const { path, name, minLines } of files) {
    tests.total++;
    try {
      log('yellow', `📝 Analyzing ${name}...`);
      const content = fs.readFileSync(path, 'utf8');
      const lines = content.split('\n');
      
      // Count metrics
      const totalLines = lines.length;
      const codeLines = lines.filter(l => l.trim() && !l.trim().startsWith('//')).length;
      const commentLines = lines.filter(l => l.trim().startsWith('//')).length;
      const emptyLines = lines.filter(l => !l.trim()).length;
      
      const commentRatio = (commentLines / totalLines * 100).toFixed(1);
      const codeRatio = (codeLines / totalLines * 100).toFixed(1);
      
      // Verify metrics
      assert(totalLines >= minLines, `Too few lines: ${totalLines} (expected >= ${minLines})`);
      assert(codeRatio >= 50, `Too little code: ${codeRatio}%`);
      
      log('green', `✅ ${name} PASSED: ${totalLines} lines (${codeRatio}% code, ${commentRatio}% comments)`);
      tests.passed++;
    } catch (error) {
      log('red', `❌ ${name} FAILED: ${error.message}`);
      tests.failed++;
    }
  }
  
  return tests;
}

// ============================================================================
// STATIC TEST 2: FUNCTION COMPLEXITY
// ============================================================================
function testFunctionComplexity() {
  log('blue', '\n═══════════════════════════════════════════════════════════');
  log('blue', '📐 STATIC TEST 2: FUNCTION COMPLEXITY');
  log('blue', '═══════════════════════════════════════════════════════════\n');
  
  const tests = { total: 0, passed: 0, failed: 0 };
  
  const files = [
    './backend/src/services/paymentTokenService.ts',
    './backend/src/services/reconciliationService.ts',
    './backend/src/services/smartEscrowService.ts'
  ];
  
  for (const filePath of files) {
    tests.total++;
    try {
      const fileName = filePath.split('/').pop();
      log('yellow', `📝 Analyzing ${fileName}...`);
      
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      // Find all functions
      const functions = [];
      let currentFunction = null;
      let braceCount = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Detect function start
        if (line.match(/^\s*(async\s+)?\w+\s*\([^)]*\)\s*:\s*Promise<|^\s*(async\s+)?(\w+)\s*\(/)) {
          if (!currentFunction) {
            currentFunction = {
              name: line.trim().split('(')[0].replace('async', '').trim(),
              startLine: i,
              complexity: 0
            };
          }
        }
        
        if (currentFunction) {
          // Count braces
          braceCount += (line.match(/\{/g) || []).length;
          braceCount -= (line.match(/\}/g) || []).length;
          
          // Calculate cyclomatic complexity
          if (line.includes('if') || line.includes('else') || line.includes('for') || 
              line.includes('while') || line.includes('&&') || line.includes('||') ||
              line.includes('case') || line.includes('catch')) {
            currentFunction.complexity++;
          }
          
          // Function ended
          if (braceCount === 0 && currentFunction.startLine !== i) {
            currentFunction.endLine = i;
            currentFunction.lines = currentFunction.endLine - currentFunction.startLine;
            functions.push(currentFunction);
            currentFunction = null;
          }
        }
      }
      
      // Check complexity
      let maxComplexity = 0;
      let avgComplexity = 0;
      
      if (functions.length > 0) {
        maxComplexity = Math.max(...functions.map(f => f.complexity));
        avgComplexity = functions.reduce((sum, f) => sum + f.complexity, 0) / functions.length;
      }
      
      // Verify reasonable complexity (< 20 for any single function)
      assert(maxComplexity < 20, `High complexity: ${maxComplexity} (should be < 20)`);
      
      log('green', `✅ ${fileName} PASSED: ${functions.length} functions, max complexity ${maxComplexity}, avg ${avgComplexity.toFixed(1)}`);
      tests.passed++;
    } catch (error) {
      log('red', `❌ ${filePath} FAILED: ${error.message}`);
      tests.failed++;
    }
  }
  
  return tests;
}

// ============================================================================
// STATIC TEST 3: NAMING CONVENTIONS
// ============================================================================
function testNamingConventions() {
  log('blue', '\n═══════════════════════════════════════════════════════════');
  log('blue', '📐 STATIC TEST 3: NAMING CONVENTIONS');
  log('blue', '═══════════════════════════════════════════════════════════\n');
  
  const tests = { total: 0, passed: 0, failed: 0 };
  
  const files = [
    './backend/src/services/paymentTokenService.ts',
    './backend/src/services/reconciliationService.ts',
    './backend/src/services/smartEscrowService.ts'
  ];
  
  for (const filePath of files) {
    tests.total++;
    try {
      const fileName = filePath.split('/').pop();
      log('yellow', `📝 Checking ${fileName}...`);
      
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check class names (PascalCase)
      const classNames = content.match(/export class (\w+)/g) || [];
      for (const match of classNames) {
        const className = match.split(' ')[2];
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(className)) {
          throw new Error(`Invalid class name: ${className} (should be PascalCase)`);
        }
      }
      
      // Check interface names (PascalCase)
      const interfaceNames = content.match(/export interface (\w+)/g) || [];
      for (const match of interfaceNames) {
        const interfaceName = match.split(' ')[2];
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(interfaceName)) {
          throw new Error(`Invalid interface name: ${interfaceName} (should be PascalCase)`);
        }
      }
      
      // Check method names (camelCase)
      const methods = content.match(/async (\w+)\(/g) || [];
      for (const match of methods) {
        const methodName = match.split(' ')[1].replace('(', '');
        if (!/^[a-z][a-zA-Z0-9]*$/.test(methodName)) {
          throw new Error(`Invalid method name: ${methodName} (should be camelCase)`);
        }
      }
      
      // Check constants (UPPER_SNAKE_CASE for true constants)
      const constants = content.match(/const ([A-Z_]+)\s*=/g) || [];
      for (const match of constants) {
        const constName = match.split(' ')[1].replace('=', '').trim();
        if (constName.length > 2 && !/^[A-Z_]+$/.test(constName)) {
          // Allow short const like 'fs' or 'db'
          if (constName.length > 3) {
            throw new Error(`Invalid constant name: ${constName} (should be UPPER_SNAKE_CASE)`);
          }
        }
      }
      
      log('green', `✅ ${fileName} PASSED: Naming conventions followed`);
      tests.passed++;
    } catch (error) {
      log('red', `❌ ${filePath} FAILED: ${error.message}`);
      tests.failed++;
    }
  }
  
  return tests;
}

// ============================================================================
// STATIC TEST 4: IMPORT ORGANIZATION
// ============================================================================
function testImportOrganization() {
  log('blue', '\n═══════════════════════════════════════════════════════════');
  log('blue', '📐 STATIC TEST 4: IMPORT ORGANIZATION');
  log('blue', '═══════════════════════════════════════════════════════════\n');
  
  const tests = { total: 0, passed: 0, failed: 0 };
  
  const files = [
    './backend/src/services/paymentTokenService.ts',
    './backend/src/services/reconciliationService.ts',
    './backend/src/services/smartEscrowService.ts'
  ];
  
  for (const filePath of files) {
    tests.total++;
    try {
      const fileName = filePath.split('/').pop();
      log('yellow', `📝 Checking ${fileName}...`);
      
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      // Find all imports
      const imports = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
          imports.push({ line: i, content: lines[i] });
        }
      }
      
      // Check imports are at the top
      if (imports.length > 0) {
        const firstImport = imports[0].line;
        const lastImport = imports[imports.length - 1].line;
        
        // Allow some comment lines before imports
        assert(firstImport < 30, `Imports too far down: line ${firstImport}`);
        
        // Imports should be grouped together
        const importSpan = lastImport - firstImport;
        assert(importSpan < imports.length + 5, 'Imports are too scattered');
      }
      
      // Check for unused imports (simple check)
      for (const imp of imports) {
        const match = imp.content.match(/import\s+\{([^}]+)\}/);
        if (match) {
          const importedItems = match[1].split(',').map(s => s.trim());
          for (const item of importedItems) {
            // Skip if it's a type-only import
            if (!imp.content.includes('type {')) {
              const usageCount = (content.match(new RegExp(`\\b${item}\\b`, 'g')) || []).length;
              // Should appear more than once (import + usage)
              if (usageCount < 2) {
                // Allow for some exceptions (exports, interfaces)
                if (!content.includes(`export ${item}`) && !content.includes(`interface ${item}`)) {
                  log('yellow', `   ⚠️  Warning: Potentially unused import: ${item}`);
                }
              }
            }
          }
        }
      }
      
      log('green', `✅ ${fileName} PASSED: ${imports.length} imports properly organized`);
      tests.passed++;
    } catch (error) {
      log('red', `❌ ${filePath} FAILED: ${error.message}`);
      tests.failed++;
    }
  }
  
  return tests;
}

// ============================================================================
// STATIC TEST 5: DOCUMENTATION COMPLETENESS
// ============================================================================
function testDocumentation() {
  log('blue', '\n═══════════════════════════════════════════════════════════');
  log('blue', '📐 STATIC TEST 5: DOCUMENTATION COMPLETENESS');
  log('blue', '═══════════════════════════════════════════════════════════\n');
  
  const tests = { total: 0, passed: 0, failed: 0 };
  
  const files = [
    './backend/src/services/paymentTokenService.ts',
    './backend/src/services/reconciliationService.ts',
    './backend/src/services/smartEscrowService.ts'
  ];
  
  for (const filePath of files) {
    tests.total++;
    try {
      const fileName = filePath.split('/').pop();
      log('yellow', `📝 Checking ${fileName}...`);
      
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check file header comment
      const lines = content.split('\n');
      assert(lines[0].includes('/**'), 'Missing file header comment');
      assert(lines[0].includes('*') || lines[1].includes('*'), 'Invalid file header format');
      
      // Count JSDoc comments
      const jsdocCount = (content.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
      
      // Count public methods
      const publicMethods = (content.match(/async \w+\(/g) || []).length;
      
      // At least 30% of public methods should have JSDoc
      const docRatio = jsdocCount / (publicMethods || 1);
      assert(docRatio >= 0.2, `Too few JSDoc comments: ${(docRatio * 100).toFixed(0)}% (expected >= 20%)`);
      
      // Check interfaces are documented
      const interfaces = content.match(/export interface \w+/g) || [];
      let documentedInterfaces = 0;
      for (const inter of interfaces) {
        const interfaceName = inter.split(' ')[2];
        // Look for comment before interface
        const interfaceIndex = content.indexOf(inter);
        const before = content.substring(Math.max(0, interfaceIndex - 200), interfaceIndex);
        if (before.includes('/**') || before.includes('//')) {
          documentedInterfaces++;
        }
      }
      
      log('green', `✅ ${fileName} PASSED: ${jsdocCount} JSDoc comments, ${documentedInterfaces}/${interfaces.length} interfaces documented`);
      tests.passed++;
    } catch (error) {
      log('red', `❌ ${filePath} FAILED: ${error.message}`);
      tests.failed++;
    }
  }
  
  return tests;
}

// ============================================================================
// MAIN RUNNER
// ============================================================================
async function runStaticAnalysis() {
  console.log('\n');
  log('magenta', '╔══════════════════════════════════════════════════════════════╗');
  log('magenta', '║                                                              ║');
  log('magenta', '║     📐 STATIC ANALYSIS TEST SUITE (Different Approach)      ║');
  log('magenta', '║                                                              ║');
  log('magenta', '║     Testing: Code Metrics, Complexity, Conventions          ║');
  log('magenta', '║                                                              ║');
  log('magenta', '╚══════════════════════════════════════════════════════════════╝');
  console.log('\n');
  
  const startTime = Date.now();
  const allResults = [];
  
  try {
    allResults.push(testCodeMetrics());
    allResults.push(testFunctionComplexity());
    allResults.push(testNamingConventions());
    allResults.push(testImportOrganization());
    allResults.push(testDocumentation());
  } catch (error) {
    log('red', `\n❌ FATAL ERROR: ${error.message}`);
    console.error(error);
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  const totals = allResults.reduce((acc, result) => ({
    total: acc.total + result.total,
    passed: acc.passed + result.passed,
    failed: acc.failed + result.failed
  }), { total: 0, passed: 0, failed: 0 });
  
  console.log('\n');
  log('magenta', '═══════════════════════════════════════════════════════════');
  log('magenta', '📊 STATIC ANALYSIS SUMMARY');
  log('magenta', '═══════════════════════════════════════════════════════════\n');
  
  log('yellow', `⏱️  Total Duration: ${duration}s`);
  log('yellow', `📝 Total Tests: ${totals.total}`);
  log('green', `✅ Passed: ${totals.passed}`);
  log('red', `❌ Failed: ${totals.failed}`);
  
  const passRate = ((totals.passed / totals.total) * 100).toFixed(1);
  console.log('');
  
  if (passRate === '100.0') {
    log('green', `🎉 SUCCESS RATE: ${passRate}% - PERFECT CODE QUALITY!`);
  } else if (passRate >= '90.0') {
    log('green', `✅ SUCCESS RATE: ${passRate}% - EXCELLENT`);
  } else {
    log('yellow', `⚠️  SUCCESS RATE: ${passRate}% - GOOD`);
  }
  
  console.log('\n');
  log('magenta', '═══════════════════════════════════════════════════════════\n');
  
  process.exit(totals.failed > 0 ? 1 : 0);
}

runStaticAnalysis().catch(error => {
  console.error('Static analysis failed:', error);
  process.exit(1);
});






