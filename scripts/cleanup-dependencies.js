#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DependencyCleanupManager {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.unusedDeps = [];
    this.unusedDevDeps = [];
    this.missingDeps = [];
  }

  async cleanup() {
    console.log('🧹 Starting dependency cleanup...');
    
    try {
      // Step 1: Analyze unused dependencies
      console.log('🔍 Analyzing unused dependencies...');
      await this.analyzeUnusedDependencies();
      
      // Step 2: Check for missing dependencies
      console.log('🔍 Checking for missing dependencies...');
      await this.checkMissingDependencies();
      
      // Step 3: Remove unused dependencies
      console.log('🗑️  Removing unused dependencies...');
      await this.removeUnusedDependencies();
      
      // Step 4: Install missing dependencies
      console.log('📦 Installing missing dependencies...');
      await this.installMissingDependencies();
      
      // Step 5: Update package.json
      console.log('📝 Updating package.json...');
      await this.updatePackageJson();
      
      // Step 6: Generate report
      console.log('📊 Generating cleanup report...');
      await this.generateReport();
      
      console.log('✅ Dependency cleanup completed successfully!');
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      process.exit(1);
    }
  }

  async analyzeUnusedDependencies() {
    try {
      // Run depcheck to find unused dependencies
      const depcheckResult = execSync('npx depcheck --json', { 
        encoding: 'utf8',
        cwd: this.projectRoot 
      });
      
      const depcheckData = JSON.parse(depcheckResult);
      
      this.unusedDeps = depcheckData.dependencies || [];
      this.unusedDevDeps = depcheckData.devDependencies || [];
      
      console.log(`Found ${this.unusedDeps.length} unused dependencies`);
      console.log(`Found ${this.unusedDevDeps.length} unused dev dependencies`);
      
    } catch (error) {
      console.warn('⚠️  Could not run depcheck:', error.message);
    }
  }

  async checkMissingDependencies() {
    try {
      // Check for missing dependencies by analyzing imports
      const srcFiles = this.getSourceFiles();
      const imports = this.extractImports(srcFiles);
      const packageJson = this.getPackageJson();
      
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };
      
      for (const importPath of imports) {
        const packageName = this.getPackageName(importPath);
        if (packageName && !allDeps[packageName]) {
          this.missingDeps.push(packageName);
        }
      }
      
      console.log(`Found ${this.missingDeps.length} missing dependencies`);
      
    } catch (error) {
      console.warn('⚠️  Could not check missing dependencies:', error.message);
    }
  }

  getSourceFiles() {
    const files = [];
    const srcDir = path.join(this.projectRoot, 'src');
    const backendDir = path.join(this.projectRoot, 'backend/src');
    const adminDir = path.join(this.projectRoot, 'admin-portal/src');
    
    const walkDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
    };
    
    walkDir(srcDir);
    walkDir(backendDir);
    walkDir(adminDir);
    
    return files;
  }

  extractImports(files) {
    const imports = [];
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
        let match;
        
        while ((match = importRegex.exec(content)) !== null) {
          imports.push(match[1]);
        }
      } catch (error) {
        console.warn(`⚠️  Could not read ${file}: ${error.message}`);
      }
    }
    
    return imports;
  }

  getPackageName(importPath) {
    // Extract package name from import path
    if (importPath.startsWith('.')) return null; // Relative import
    
    const parts = importPath.split('/');
    let packageName = parts[0];
    
    // Handle scoped packages
    if (packageName.startsWith('@')) {
      packageName = `${packageName}/${parts[1]}`;
    }
    
    return packageName;
  }

  getPackageJson() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  }

  async removeUnusedDependencies() {
    if (this.unusedDeps.length === 0 && this.unusedDevDeps.length === 0) {
      console.log('✅ No unused dependencies to remove');
      return;
    }
    
    // Remove unused dependencies
    if (this.unusedDeps.length > 0) {
      console.log(`Removing unused dependencies: ${this.unusedDeps.join(', ')}`);
      execSync(`npm uninstall ${this.unusedDeps.join(' ')}`, { 
        stdio: 'inherit',
        cwd: this.projectRoot 
      });
    }
    
    // Remove unused dev dependencies
    if (this.unusedDevDeps.length > 0) {
      console.log(`Removing unused dev dependencies: ${this.unusedDevDeps.join(', ')}`);
      execSync(`npm uninstall --save-dev ${this.unusedDevDeps.join(' ')}`, { 
        stdio: 'inherit',
        cwd: this.projectRoot 
      });
    }
  }

  async installMissingDependencies() {
    if (this.missingDeps.length === 0) {
      console.log('✅ No missing dependencies to install');
      return;
    }
    
    console.log(`Installing missing dependencies: ${this.missingDeps.join(', ')}`);
    execSync(`npm install ${this.missingDeps.join(' ')}`, { 
      stdio: 'inherit',
      cwd: this.projectRoot 
    });
  }

  async updatePackageJson() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const packageJson = this.getPackageJson();
    
    // Remove unused dependencies from package.json
    this.unusedDeps.forEach(dep => {
      delete packageJson.dependencies[dep];
    });
    
    this.unusedDevDeps.forEach(dep => {
      delete packageJson.devDependencies[dep];
    });
    
    // Add missing dependencies
    this.missingDeps.forEach(dep => {
      if (!packageJson.dependencies[dep]) {
        packageJson.dependencies[dep] = 'latest';
      }
    });
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      unusedDependencies: this.unusedDeps,
      unusedDevDependencies: this.unusedDevDeps,
      missingDependencies: this.missingDeps,
      summary: {
        totalUnused: this.unusedDeps.length + this.unusedDevDeps.length,
        totalMissing: this.missingDeps.length,
        status: this.unusedDeps.length === 0 && this.missingDeps.length === 0 ? 'CLEAN' : 'NEEDS_ATTENTION'
      }
    };
    
    const reportPath = path.join(this.projectRoot, 'dependency-cleanup-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 DEPENDENCY CLEANUP REPORT');
    console.log('============================');
    console.log(`Unused dependencies: ${this.unusedDeps.length}`);
    console.log(`Unused dev dependencies: ${this.unusedDevDeps.length}`);
    console.log(`Missing dependencies: ${this.missingDeps.length}`);
    console.log(`Status: ${report.summary.status}`);
    console.log(`Report saved to: ${reportPath}`);
  }
}

// Run the cleanup
if (require.main === module) {
  const cleanup = new DependencyCleanupManager();
  cleanup.cleanup()
    .then(() => {
      console.log('🎉 Dependency cleanup completed successfully!');
    })
    .catch(error => {
      console.error('❌ Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = DependencyCleanupManager;







