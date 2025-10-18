#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const jscodeshift = require('jscodeshift');

class ReactHooksOptimizer {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.optimizations = [];
    this.issues = [];
  }

  async optimize() {
    console.log('⚡ Starting React hooks optimization...');
    
    try {
      // Step 1: Analyze current hook usage
      console.log('🔍 Analyzing current hook usage...');
      await this.analyzeHookUsage();
      
      // Step 2: Identify optimization opportunities
      console.log('🎯 Identifying optimization opportunities...');
      await this.identifyOptimizations();
      
      // Step 3: Apply optimizations
      console.log('🔧 Applying optimizations...');
      await this.applyOptimizations();
      
      // Step 4: Generate report
      console.log('📊 Generating optimization report...');
      await this.generateReport();
      
      console.log('✅ React hooks optimization completed!');
      
    } catch (error) {
      console.error('❌ Optimization failed:', error.message);
      process.exit(1);
    }
  }

  async analyzeHookUsage() {
    const srcFiles = this.getSourceFiles();
    
    for (const file of srcFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const ast = jscodeshift(content);
        
        // Find React hooks usage
        const hooks = this.extractHooks(ast, file);
        this.analyzeHookPatterns(hooks, file);
        
      } catch (error) {
        console.warn(`⚠️  Could not analyze ${file}: ${error.message}`);
      }
    }
  }

  getSourceFiles() {
    const files = [];
    const srcDir = path.join(this.projectRoot, 'src');
    
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
    return files;
  }

  extractHooks(ast, file) {
    const hooks = [];
    
    // Find useState calls
    ast.find(jscodeshift.CallExpression, {
      callee: { name: 'useState' }
    }).forEach(path => {
      hooks.push({
        type: 'useState',
        node: path.value,
        file,
        line: path.value.loc?.start?.line || 0
      });
    });
    
    // Find useEffect calls
    ast.find(jscodeshift.CallExpression, {
      callee: { name: 'useEffect' }
    }).forEach(path => {
      hooks.push({
        type: 'useEffect',
        node: path.value,
        file,
        line: path.value.loc?.start?.line || 0
      });
    });
    
    // Find useCallback calls
    ast.find(jscodeshift.CallExpression, {
      callee: { name: 'useCallback' }
    }).forEach(path => {
      hooks.push({
        type: 'useCallback',
        node: path.value,
        file,
        line: path.value.loc?.start?.line || 0
      });
    });
    
    // Find useMemo calls
    ast.find(jscodeshift.CallExpression, {
      callee: { name: 'useMemo' }
    }).forEach(path => {
      hooks.push({
        type: 'useMemo',
        node: path.value,
        file,
        line: path.value.loc?.start?.line || 0
      });
    });
    
    return hooks;
  }

  analyzeHookPatterns(hooks, file) {
    // Analyze useState patterns
    const useStateHooks = hooks.filter(h => h.type === 'useState');
    this.analyzeUseStatePatterns(useStateHooks, file);
    
    // Analyze useEffect patterns
    const useEffectHooks = hooks.filter(h => h.type === 'useEffect');
    this.analyzeUseEffectPatterns(useEffectHooks, file);
    
    // Analyze useCallback patterns
    const useCallbackHooks = hooks.filter(h => h.type === 'useCallback');
    this.analyzeUseCallbackPatterns(useCallbackHooks, file);
    
    // Analyze useMemo patterns
    const useMemoHooks = hooks.filter(h => h.type === 'useMemo');
    this.analyzeUseMemoPatterns(useMemoHooks, file);
  }

  analyzeUseStatePatterns(hooks, file) {
    hooks.forEach(hook => {
      const args = hook.node.arguments;
      
      // Check for unnecessary re-renders
      if (args.length > 0) {
        const initialValue = args[0];
        
        // Check if initial value is a function that should be lazy
        if (jscodeshift.ArrowFunctionExpression.check(initialValue) || 
            jscodeshift.FunctionExpression.check(initialValue)) {
          this.issues.push({
            type: 'useState-lazy-initial',
            file,
            line: hook.line,
            message: 'Consider using lazy initial state for expensive computations',
            suggestion: 'Use useState(() => expensiveComputation())'
          });
        }
      }
    });
  }

  analyzeUseEffectPatterns(hooks, file) {
    hooks.forEach(hook => {
      const args = hook.node.arguments;
      
      // Check for missing dependencies
      if (args.length === 1) {
        this.issues.push({
          type: 'useEffect-missing-deps',
          file,
          line: hook.line,
          message: 'useEffect missing dependency array',
          suggestion: 'Add dependency array: useEffect(() => {}, [])'
        });
      }
      
      // Check for exhaustive dependencies
      if (args.length === 2) {
        const deps = args[1];
        if (jscodeshift.ArrayExpression.check(deps)) {
          // Check if dependencies are properly declared
          const depsArray = deps.elements;
          if (depsArray.length === 0) {
            this.issues.push({
              type: 'useEffect-empty-deps',
              file,
              line: hook.line,
              message: 'Empty dependency array may cause issues',
              suggestion: 'Review if all dependencies are included'
            });
          }
        }
      }
    });
  }

  analyzeUseCallbackPatterns(hooks, file) {
    hooks.forEach(hook => {
      const args = hook.node.arguments;
      
      // Check for missing dependencies
      if (args.length === 1) {
        this.issues.push({
          type: 'useCallback-missing-deps',
          file,
          line: hook.line,
          message: 'useCallback missing dependency array',
          suggestion: 'Add dependency array: useCallback(() => {}, [])'
        });
      }
      
      // Check for unnecessary useCallback
      if (args.length === 2) {
        const deps = args[1];
        if (jscodeshift.ArrayExpression.check(deps) && deps.elements.length === 0) {
          this.issues.push({
            type: 'useCallback-unnecessary',
            file,
            line: hook.line,
            message: 'useCallback with empty dependencies may be unnecessary',
            suggestion: 'Consider if useCallback is needed here'
          });
        }
      }
    });
  }

  analyzeUseMemoPatterns(hooks, file) {
    hooks.forEach(hook => {
      const args = hook.node.arguments;
      
      // Check for missing dependencies
      if (args.length === 1) {
        this.issues.push({
          type: 'useMemo-missing-deps',
          file,
          line: hook.line,
          message: 'useMemo missing dependency array',
          suggestion: 'Add dependency array: useMemo(() => {}, [])'
        });
      }
      
      // Check for unnecessary useMemo
      if (args.length === 2) {
        const deps = args[1];
        if (jscodeshift.ArrayExpression.check(deps) && deps.elements.length === 0) {
          this.issues.push({
            type: 'useMemo-unnecessary',
            file,
            line: hook.line,
            message: 'useMemo with empty dependencies may be unnecessary',
            suggestion: 'Consider if useMemo is needed here'
          });
        }
      }
    });
  }

  async identifyOptimizations() {
    // Group issues by type
    const groupedIssues = this.groupIssuesByType();
    
    // Generate optimization suggestions
    for (const [type, issues] of Object.entries(groupedIssues)) {
      this.generateOptimizationSuggestions(type, issues);
    }
  }

  groupIssuesByType() {
    const grouped = {};
    
    this.issues.forEach(issue => {
      if (!grouped[issue.type]) {
        grouped[issue.type] = [];
      }
      grouped[issue.type].push(issue);
    });
    
    return grouped;
  }

  generateOptimizationSuggestions(type, issues) {
    switch (type) {
      case 'useState-lazy-initial':
        this.optimizations.push({
          type: 'useState-lazy-initial',
          count: issues.length,
          description: 'Convert expensive useState initializations to lazy initial state',
          files: issues.map(i => i.file),
          suggestion: 'Use useState(() => expensiveComputation()) instead of useState(expensiveComputation())'
        });
        break;
        
      case 'useEffect-missing-deps':
        this.optimizations.push({
          type: 'useEffect-missing-deps',
          count: issues.length,
          description: 'Add missing dependency arrays to useEffect hooks',
          files: issues.map(i => i.file),
          suggestion: 'Add dependency array to useEffect hooks'
        });
        break;
        
      case 'useCallback-missing-deps':
        this.optimizations.push({
          type: 'useCallback-missing-deps',
          count: issues.length,
          description: 'Add missing dependency arrays to useCallback hooks',
          files: issues.map(i => i.file),
          suggestion: 'Add dependency array to useCallback hooks'
        });
        break;
        
      case 'useMemo-missing-deps':
        this.optimizations.push({
          type: 'useMemo-missing-deps',
          count: issues.length,
          description: 'Add missing dependency arrays to useMemo hooks',
          files: issues.map(i => i.file),
          suggestion: 'Add dependency array to useMemo hooks'
        });
        break;
    }
  }

  async applyOptimizations() {
    // Create ESLint configuration for hooks
    this.createHooksESLintConfig();
    
    // Create custom hooks for common patterns
    this.createCustomHooks();
    
    // Create optimization utilities
    this.createOptimizationUtilities();
  }

  createHooksESLintConfig() {
    const eslintConfig = {
      extends: [
        'plugin:react-hooks/recommended'
      ],
      rules: {
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'error',
        'react-hooks/exhaustive-deps': ['error', {
          'additionalHooks': '(useMyCustomHook)'
        }]
      }
    };
    
    const configPath = path.join(this.projectRoot, '.eslintrc.hooks.js');
    fs.writeFileSync(configPath, `module.exports = ${JSON.stringify(eslintConfig, null, 2)};`);
  }

  createCustomHooks() {
    const customHooks = `
// Custom hooks for common patterns
import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Custom hook for debounced values
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for throttled values
 */
export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef<number>(Date.now());

  useEffect(() => {
    if (Date.now() >= lastExecuted.current + delay) {
      lastExecuted.current = Date.now();
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastExecuted.current = Date.now();
        setThrottledValue(value);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [value, delay]);

  return throttledValue;
}

/**
 * Custom hook for previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  });
  
  return ref.current;
}

/**
 * Custom hook for async operations
 */
export function useAsync<T, E = string>(
  asyncFunction: () => Promise<T>,
  immediate = true
) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);

  const execute = useCallback(() => {
    setStatus('pending');
    setData(null);
    setError(null);

    return asyncFunction()
      .then((response) => {
        setData(response);
        setStatus('success');
      })
      .catch((error) => {
        setError(error);
        setStatus('error');
      });
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, data, error };
}

/**
 * Custom hook for local storage
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(\`Error reading localStorage key "\${key}":\`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(\`Error setting localStorage key "\${key}":\`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

/**
 * Custom hook for intersection observer
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  { threshold = 0, root = null, rootMargin = '0%' }: IntersectionObserverInit = {}
) {
  const [entry, setEntry] = useState<IntersectionObserverEntry>();

  const updateEntry = useCallback(([entry]: IntersectionObserverEntry[]) => {
    setEntry(entry);
  }, []);

  useEffect(() => {
    const node = elementRef?.current;
    const hasIOSupport = !!window.IntersectionObserver;

    if (!hasIOSupport || !node) return;

    const observerParams = { threshold, root, rootMargin };
    const observer = new IntersectionObserver(updateEntry, observerParams);

    observer.observe(node);

    return () => observer.disconnect();
  }, [elementRef, threshold, root, rootMargin, updateEntry]);

  return entry;
}
`;
    
    const hooksPath = path.join(this.projectRoot, 'src/hooks/optimized.ts');
    fs.writeFileSync(hooksPath, customHooks);
  }

  createOptimizationUtilities() {
    const utilities = `
// React hooks optimization utilities
import { useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * Utility for creating stable callbacks
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  });
  
  return useCallback((...args: any[]) => {
    return callbackRef.current(...args);
  }, []) as T;
}

/**
 * Utility for creating stable values
 */
export function useStableValue<T>(value: T): T {
  const valueRef = useRef(value);
  
  useEffect(() => {
    valueRef.current = value;
  });
  
  return useMemo(() => valueRef.current, [value]);
}

/**
 * Utility for creating stable objects
 */
export function useStableObject<T extends Record<string, any>>(obj: T): T {
  return useMemo(() => obj, Object.values(obj));
}

/**
 * Utility for creating stable arrays
 */
export function useStableArray<T>(arr: T[]): T[] {
  return useMemo(() => arr, arr);
}

/**
 * Utility for creating stable functions
 */
export function useStableFunction<T extends (...args: any[]) => any>(
  fn: T
): T {
  const fnRef = useRef(fn);
  
  useEffect(() => {
    fnRef.current = fn;
  });
  
  return useCallback((...args: any[]) => {
    return fnRef.current(...args);
  }, []) as T;
}
`;
    
    const utilsPath = path.join(this.projectRoot, 'src/utils/hooks-optimization.ts');
    fs.writeFileSync(utilsPath, utilities);
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalIssues: this.issues.length,
      totalOptimizations: this.optimizations.length,
      issues: this.issues,
      optimizations: this.optimizations,
      summary: {
        performance: this.optimizations.filter(o => o.type.includes('performance')).length,
        memory: this.optimizations.filter(o => o.type.includes('memory')).length,
        reusability: this.optimizations.filter(o => o.type.includes('reusability')).length
      }
    };
    
    const reportPath = path.join(this.projectRoot, 'react-hooks-optimization-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 REACT HOOKS OPTIMIZATION REPORT');
    console.log('===================================');
    console.log(`Total issues found: ${this.issues.length}`);
    console.log(`Total optimizations: ${this.optimizations.length}`);
    console.log(`Performance optimizations: ${report.summary.performance}`);
    console.log(`Memory optimizations: ${report.summary.memory}`);
    console.log(`Reusability optimizations: ${report.summary.reusability}`);
    console.log(`Report saved to: ${reportPath}`);
  }
}

// Run the optimization
if (require.main === module) {
  const optimizer = new ReactHooksOptimizer();
  optimizer.optimize()
    .then(() => {
      console.log('🎉 React hooks optimization completed!');
    })
    .catch(error => {
      console.error('❌ Optimization failed:', error);
      process.exit(1);
    });
}

module.exports = ReactHooksOptimizer;







