#!/usr/bin/env node

/**
 * Translation Validation Script
 * 
 * Validates translation coverage and detects hard-coded strings
 * 
 * Usage: node scripts/validate-translations.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const LOCALES_DIR = path.join(__dirname, '../src/locales');
const SRC_DIR = path.join(__dirname, '../src');
const EN_JSON = path.join(LOCALES_DIR, 'en.json');
const AR_JSON = path.join(LOCALES_DIR, 'ar.json');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Read JSON files
function readJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    log(`Error reading ${filePath}: ${error.message}`, 'red');
    return null;
  }
}

// Recursively get all keys from nested JSON object
function getAllKeys(obj, prefix = '') {
  const keys = [];
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getAllKeys(obj[key], prefix ? `${prefix}.${key}` : key));
    } else {
      keys.push(prefix ? `${prefix}.${key}` : key);
    }
  }
  return keys;
}

// Check for missing translations
function checkMissingTranslations() {
  log('\n📊 Checking Translation Coverage...', 'cyan');
  
  const enData = readJSON(EN_JSON);
  const arData = readJSON(AR_JSON);
  
  if (!enData || !arData) {
    log('❌ Failed to read translation files', 'red');
    return false;
  }
  
  const enKeys = getAllKeys(enData);
  const arKeys = getAllKeys(arData);
  
  const missingKeys = enKeys.filter(key => !arKeys.includes(key));
  
  if (missingKeys.length === 0) {
    log('✅ All translation keys are present in Arabic!', 'green');
    log(`   Total keys: ${enKeys.length}`, 'green');
    log(`   Coverage: 100%`, 'green');
    return true;
  } else {
    log(`⚠️  Missing ${missingKeys.length} translation keys in Arabic:`, 'yellow');
    missingKeys.forEach(key => {
      log(`   - ${key}`, 'yellow');
    });
    const coverage = ((enKeys.length - missingKeys.length) / enKeys.length * 100).toFixed(1);
    log(`   Coverage: ${coverage}% (${enKeys.length - missingKeys.length}/${enKeys.length})`, 'yellow');
    return false;
  }
}

// Detect hard-coded strings in source files
function detectHardCodedStrings() {
  log('\n🔍 Detecting Hard-Coded Strings...', 'cyan');
  
  const hardCodedPattern = /isRTL\s*\?\s*['"](.*?)['"]\s*:\s*['"](.*?)['"]/g;
  const files = [];
  const issues = [];
  
  // Recursively find all TypeScript/JavaScript files
  function findFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip node_modules, build directories, etc.
      if (entry.isDirectory()) {
        if (!['node_modules', 'dist', 'build', '.expo', 'coverage'].includes(entry.name)) {
          findFiles(fullPath);
        }
      } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  
  findFiles(SRC_DIR);
  
  files.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const matches = [...line.matchAll(hardCodedPattern)];
        matches.forEach(match => {
          issues.push({
            file: path.relative(SRC_DIR, filePath),
            line: index + 1,
            code: line.trim(),
            arabic: match[1],
            english: match[2],
          });
        });
      });
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  if (issues.length === 0) {
    log('✅ No hard-coded strings detected!', 'green');
    return true;
  } else {
    log(`⚠️  Found ${issues.length} hard-coded string(s):`, 'yellow');
    issues.forEach(issue => {
      log(`   ${issue.file}:${issue.line}`, 'yellow');
      log(`     ${issue.code.substring(0, 80)}${issue.code.length > 80 ? '...' : ''}`, 'yellow');
    });
    return false;
  }
}

// Check for unused translation keys
function checkUnusedKeys() {
  log('\n🔎 Checking for Unused Translation Keys...', 'cyan');
  
  const enData = readJSON(EN_JSON);
  if (!enData) {
    log('❌ Failed to read English translation file', 'red');
    return false;
  }
  
  const enKeys = getAllKeys(enData);
  const usedKeys = new Set();
  const files = [];
  
  // Find all source files
  function findFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (!['node_modules', 'dist', 'build', '.expo', 'coverage'].includes(entry.name)) {
          findFiles(fullPath);
        }
      } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  
  findFiles(SRC_DIR);
  
  // Check for t('key') or t("key") patterns
  const tPattern = /t\(['"]([^'"]+)['"]\)/g;
  
  files.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const matches = [...content.matchAll(tPattern)];
      matches.forEach(match => {
        usedKeys.add(match[1]);
      });
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  const unusedKeys = enKeys.filter(key => !usedKeys.has(key));
  
  if (unusedKeys.length === 0) {
    log('✅ All translation keys are being used!', 'green');
    return true;
  } else {
    log(`⚠️  Found ${unusedKeys.length} unused translation key(s):`, 'yellow');
    unusedKeys.slice(0, 20).forEach(key => {
      log(`   - ${key}`, 'yellow');
    });
    if (unusedKeys.length > 20) {
      log(`   ... and ${unusedKeys.length - 20} more`, 'yellow');
    }
    return false;
  }
}

// Main execution
function main() {
  log('\n🌍 Translation Validation Script', 'cyan');
  log('=' .repeat(50), 'cyan');
  
  let allPassed = true;
  
  // Check missing translations
  if (!checkMissingTranslations()) {
    allPassed = false;
  }
  
  // Detect hard-coded strings
  if (!detectHardCodedStrings()) {
    allPassed = false;
  }
  
  // Check unused keys
  if (!checkUnusedKeys()) {
    allPassed = false;
  }
  
  // Summary
  log('\n' + '='.repeat(50), 'cyan');
  if (allPassed) {
    log('✅ All checks passed!', 'green');
    process.exit(0);
  } else {
    log('⚠️  Some issues found. Please review and fix.', 'yellow');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { checkMissingTranslations, detectHardCodedStrings, checkUnusedKeys };








