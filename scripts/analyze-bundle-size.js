/**
 * Bundle Size Analysis Script
 * 
 * COMMENT: PRODUCTION HARDENING - Task 5.5
 * Analyzes bundle size for Expo/React Native app
 * Target: < 20 MB for production builds
 */

const fs = require('fs');
const path = require('path');

const TARGET_SIZE_MB = 20; // 20 MB target
const WARNING_SIZE_MB = 15; // 15 MB warning threshold

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Get file size
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Analyze bundle size
 */
function analyzeBundleSize() {
  console.log(`${colors.cyan}📦 Bundle Size Analysis${colors.reset}\n`);

  const projectRoot = path.resolve(__dirname, '..');
  const buildDirs = [
    path.join(projectRoot, '.expo'),
    path.join(projectRoot, 'dist'),
    path.join(projectRoot, 'build'),
    path.join(projectRoot, 'web-build'),
  ];

  const results = {
    totalSize: 0,
    files: [],
    warnings: [],
    errors: [],
  };

  // Check for Expo build outputs
  buildDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = getAllFiles(dir);
      files.forEach(file => {
        const size = getFileSize(file);
        if (size > 0) {
          results.files.push({
            path: path.relative(projectRoot, file),
            size,
            sizeFormatted: formatBytes(size),
          });
          results.totalSize += size;
        }
      });
    }
  });

  // Analyze node_modules size (production dependencies only)
  const nodeModulesPath = path.join(projectRoot, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    const dependencies = getProductionDependencies(projectRoot);
    dependencies.forEach(dep => {
      const depPath = path.join(nodeModulesPath, dep.name);
      if (fs.existsSync(depPath)) {
        const size = getDirectorySize(depPath);
        if (size > 1024 * 1024) { // Only report if > 1MB
          results.files.push({
            path: `node_modules/${dep.name}`,
            size,
            sizeFormatted: formatBytes(size),
            type: 'dependency',
          });
        }
      }
    });
  }

  // Calculate total size in MB
  const totalSizeMB = results.totalSize / (1024 * 1024);

  // Sort files by size (largest first)
  results.files.sort((a, b) => b.size - a.size);

  // Report results
  console.log(`${colors.cyan}📊 Bundle Size Report${colors.reset}`);
  console.log(`${'='.repeat(60)}\n`);
  console.log(`Total Size: ${formatBytes(results.totalSize)} (${totalSizeMB.toFixed(2)} MB)`);
  console.log(`Target: < ${TARGET_SIZE_MB} MB\n`);

  // Check against target
  if (totalSizeMB > TARGET_SIZE_MB) {
    results.errors.push(`Bundle size exceeds target: ${totalSizeMB.toFixed(2)} MB > ${TARGET_SIZE_MB} MB`);
    console.log(`${colors.red}❌ Bundle size exceeds target!${colors.reset}`);
    console.log(`${colors.red}   Current: ${totalSizeMB.toFixed(2)} MB${colors.reset}`);
    console.log(`${colors.red}   Target: < ${TARGET_SIZE_MB} MB${colors.reset}`);
    console.log(`${colors.red}   Over by: ${(totalSizeMB - TARGET_SIZE_MB).toFixed(2)} MB${colors.reset}\n`);
  } else if (totalSizeMB > WARNING_SIZE_MB) {
    results.warnings.push(`Bundle size approaching target: ${totalSizeMB.toFixed(2)} MB > ${WARNING_SIZE_MB} MB`);
    console.log(`${colors.yellow}⚠️  Bundle size approaching target${colors.reset}`);
    console.log(`${colors.yellow}   Current: ${totalSizeMB.toFixed(2)} MB${colors.reset}`);
    console.log(`${colors.yellow}   Warning threshold: ${WARNING_SIZE_MB} MB${colors.reset}\n`);
  } else {
    console.log(`${colors.green}✅ Bundle size within target${colors.reset}`);
    console.log(`${colors.green}   Current: ${totalSizeMB.toFixed(2)} MB${colors.reset}`);
    console.log(`${colors.green}   Target: < ${TARGET_SIZE_MB} MB${colors.reset}`);
    console.log(`${colors.green}   Remaining: ${(TARGET_SIZE_MB - totalSizeMB).toFixed(2)} MB${colors.reset}\n`);
  }

  // Show largest files
  console.log(`${colors.cyan}📁 Largest Files/Dependencies:${colors.reset}`);
  console.log(`${'='.repeat(60)}\n`);
  const topFiles = results.files.slice(0, 10);
  topFiles.forEach((file, index) => {
    const prefix = file.type === 'dependency' ? '📦' : '📄';
    console.log(`${index + 1}. ${prefix} ${file.path}`);
    console.log(`   Size: ${file.sizeFormatted}\n`);
  });

  // Recommendations
  if (totalSizeMB > WARNING_SIZE_MB) {
    console.log(`${colors.cyan}💡 Recommendations:${colors.reset}`);
    console.log(`${'='.repeat(60)}\n`);
    console.log('1. Remove unused dependencies');
    console.log('2. Use dynamic imports for large libraries');
    console.log('3. Enable tree-shaking in build configuration');
    console.log('4. Optimize images and assets');
    console.log('5. Split large components into smaller chunks');
    console.log('6. Use code splitting for routes\n');
  }

  // Write results to file
  const reportPath = path.join(projectRoot, 'reports', 'bundle-size-report.json');
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  fs.writeFileSync(
    reportPath,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      totalSize: results.totalSize,
      totalSizeMB: totalSizeMB.toFixed(2),
      targetSizeMB: TARGET_SIZE_MB,
      status: totalSizeMB <= TARGET_SIZE_MB ? 'pass' : 'fail',
      warnings: results.warnings,
      errors: results.errors,
      topFiles: topFiles.map(f => ({
        path: f.path,
        size: f.size,
        sizeFormatted: f.sizeFormatted,
      })),
    }, null, 2)
  );

  console.log(`${colors.green}✅ Report saved to: ${path.relative(projectRoot, reportPath)}${colors.reset}\n`);

  // Return exit code
  return totalSizeMB <= TARGET_SIZE_MB ? 0 : 1;
}

/**
 * Get all files in directory recursively
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      // Skip node_modules and other ignored directories
      if (!file.startsWith('.') && file !== 'node_modules') {
        getAllFiles(filePath, arrayOfFiles);
      }
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

/**
 * Get directory size recursively
 */
function getDirectorySize(dirPath) {
  let totalSize = 0;
  try {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        totalSize += getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    });
  } catch (error) {
    // Ignore errors
  }
  return totalSize;
}

/**
 * Get production dependencies from package.json
 */
function getProductionDependencies(projectRoot) {
  try {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const deps = packageJson.dependencies || {};
    return Object.keys(deps).map(name => ({ name, version: deps[name] }));
  } catch (error) {
    return [];
  }
}

// Run analysis
if (require.main === module) {
  const exitCode = analyzeBundleSize();
  process.exit(exitCode);
}

module.exports = { analyzeBundleSize };




