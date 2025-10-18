#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 DEBUGGING GUILD APP ISSUES');
console.log('================================');

// Check if main files exist
const mainFiles = [
  'src/app/_layout.tsx',
  'src/app/(main)/home.tsx',
  'src/app/(modals)/guild-map.tsx',
  'src/contexts/AuthContext.tsx'
];

console.log('\n📁 Checking main files:');
mainFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

// Check package.json
console.log('\n📦 Checking package.json:');
try {
  const pkg = require('./package.json');
  console.log('✅ package.json found');
  console.log(`📱 App name: ${pkg.name}`);
  console.log(`🚀 Version: ${pkg.version}`);
} catch (error) {
  console.log('❌ package.json error:', error.message);
}

// Check for common issues
console.log('\n🔧 Checking for common issues:');

const issues = [];

try {
  const layoutContent = fs.readFileSync('src/app/_layout.tsx', 'utf8');

  if (layoutContent.includes('expo-router')) {
    console.log('✅ expo-router found in layout');
  } else {
    issues.push('expo-router not properly imported');
  }

  if (layoutContent.includes('ErrorBoundary')) {
    console.log('✅ ErrorBoundary found');
  } else {
    issues.push('ErrorBoundary missing');
  }

  if (layoutContent.includes('AuthProvider')) {
    console.log('✅ AuthProvider found');
  } else {
    issues.push('AuthProvider missing');
  }
} catch (error) {
  issues.push('Cannot read layout file: ' + error.message);
}

if (issues.length > 0) {
  console.log('\n⚠️  Issues found:');
  issues.forEach(issue => console.log(`   - ${issue}`));
} else {
  console.log('\n✅ No obvious issues found');
}

console.log('\n🎯 RECOMMENDATIONS:');
console.log('1. Try clearing Metro cache: npx expo start --clear');
console.log('2. Check if all dependencies are installed');
console.log('3. Verify Firebase configuration');
console.log('4. Check for syntax errors in components');

console.log('\n🏁 Debug complete');
