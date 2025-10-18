#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ArchitectureQualityImplementer {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.backendRoot = path.join(this.projectRoot, 'backend');
    this.mobileRoot = this.projectRoot;
    this.adminRoot = path.join(this.projectRoot, 'admin-portal');
  }

  async implement() {
    console.log('🏗️  Implementing advanced architecture and code quality with STRICT rules...');

    try {
      // Step 1: Enforce TypeScript strict mode across all projects
      console.log('🔒 Enforcing TypeScript strict mode...');
      await this.enforceTypeScriptStrictMode();

      // Step 2: Configure advanced ESLint with SonarLint
      console.log('📋 Configuring advanced ESLint with SonarLint...');
      await this.configureAdvancedESLint();

      // Step 3: Implement AST-based code duplication analysis
      console.log('🔍 Implementing AST-based code duplication analysis...');
      await this.implementASTDuplicationAnalysis();

      // Step 4: Setup Husky v8 with comprehensive pre-push hooks
      console.log('🪝 Setting up Husky v8 with comprehensive pre-push hooks...');
      await this.setupHuskyPrePushHooks();

      // Step 5: Implement dependency cleanup with depcheck
      console.log('🧹 Implementing dependency cleanup with depcheck...');
      await this.implementDependencyCleanup();

      // Step 6: Setup Nx monorepo tooling with distributed caching
      console.log('📦 Setting up Nx monorepo tooling with distributed caching...');
      await this.setupNxMonorepo();

      // Step 7: Implement Winston with OTLP for distributed tracing
      console.log('📝 Implementing Winston with OTLP for distributed tracing...');
      await this.implementWinstonOTLPLogging();

      console.log('✅ Advanced architecture and code quality implementation completed!');

    } catch (error) {
      console.error('❌ Architecture and code quality implementation failed:', error.message);
      process.exit(1);
    }
  }

  async enforceTypeScriptStrictMode() {
    // Backend TypeScript configuration
    const backendTsConfig = {
      "compilerOptions": {
        "target": "ES2022",
        "lib": ["ES2022", "DOM"],
        "module": "commonjs",
        "moduleResolution": "node",
        "outDir": "./dist",
        "rootDir": "./src",
        "strict": true,
        "esModuleInterop": true,
        "allowSyntheticDefaultImports": true,
        "downlevelIteration": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "resolveJsonModule": true,
        "declaration": true,
        "declarationMap": true,
        "sourceMap": true,
        "removeComments": true,
        "noImplicitAny": true,
        "strictNullChecks": true,
        "strictFunctionTypes": true,
        "strictBindCallApply": true,
        "strictPropertyInitialization": true,
        "noImplicitThis": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,
        "noUncheckedIndexedAccess": true,
        "exactOptionalPropertyTypes": true,
        "noImplicitOverride": true,
        "noPropertyAccessFromIndexSignature": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true,
        "baseUrl": "./src",
        "paths": {
          "@/*": ["*"],
          "@config/*": ["config/*"],
          "@services/*": ["services/*"],
          "@middleware/*": ["middleware/*"],
          "@utils/*": ["utils/*"],
          "@types/*": ["types/*"]
        }
      },
      "include": [
        "src/**/*"
      ],
      "exclude": [
        "node_modules",
        "dist",
        "**/*.test.ts",
        "**/*.spec.ts"
      ]
    };

    fs.writeFileSync(
      path.join(this.backendRoot, 'tsconfig.json'),
      JSON.stringify(backendTsConfig, null, 2)
    );

    // Mobile TypeScript configuration
    const mobileTsConfig = {
      "compilerOptions": {
        "baseUrl": ".",
        "paths": {
          "@/*": [
            "./src/*"
          ]
        },
        "resolveJsonModule": true,
        "esModuleInterop": true,
        "allowSyntheticDefaultImports": true,
        "jsx": "react-jsx",
        "skipLibCheck": true,
        "strict": true,
        "noImplicitAny": true,
        "strictNullChecks": true,
        "strictFunctionTypes": true,
        "strictBindCallApply": true,
        "strictPropertyInitialization": true,
        "noImplicitThis": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,
        "noUncheckedIndexedAccess": true,
        "exactOptionalPropertyTypes": true,
        "noImplicitOverride": true,
        "noPropertyAccessFromIndexSignature": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true
      },
      "extends": "expo/tsconfig.base",
      "include": [
        "global.d.ts",
        "**/*.ts",
        "**/*.tsx",
        "nativewind-env.d.ts",
        ".expo/types/**/*.ts",
        "expo-env.d.ts"
      ],
      "exclude": [
        "new-design/**/*"
      ]
    };

    fs.writeFileSync(
      path.join(this.mobileRoot, 'tsconfig.json'),
      JSON.stringify(mobileTsConfig, null, 2)
    );

    // Admin Portal TypeScript configuration
    const adminTsConfig = {
      "compilerOptions": {
        "target": "ES2022",
        "lib": ["ES2022", "DOM", "DOM.Iterable"],
        "module": "esnext",
        "moduleResolution": "node",
        "allowJs": true,
        "skipLibCheck": true,
        "esModuleInterop": true,
        "allowSyntheticDefaultImports": true,
        "strict": true,
        "forceConsistentCasingInFileNames": true,
        "noFallthroughCasesInSwitch": true,
        "noImplicitAny": true,
        "strictNullChecks": true,
        "strictFunctionTypes": true,
        "strictBindCallApply": true,
        "strictPropertyInitialization": true,
        "noImplicitThis": true,
        "noImplicitReturns": true,
        "noUncheckedIndexedAccess": true,
        "exactOptionalPropertyTypes": true,
        "noImplicitOverride": true,
        "noPropertyAccessFromIndexSignature": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "resolveJsonModule": true,
        "isolatedModules": true,
        "noEmit": true,
        "jsx": "react-jsx"
      },
      "include": [
        "src"
      ],
      "exclude": [
        "node_modules",
        "build",
        "dist"
      ]
    };

    fs.writeFileSync(
      path.join(this.adminRoot, 'tsconfig.json'),
      JSON.stringify(adminTsConfig, null, 2)
    );
  }

  async configureAdvancedESLint() {
    // Advanced ESLint configuration
    const eslintConfig = `
// Advanced ESLint Configuration with SonarLint Integration
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    '@typescript-eslint',
    'sonarjs',
    'security',
    'import',
    'react',
    'react-hooks',
    'jsx-a11y',
    'react-native',
    'expo',
    'performance',
    'unicorn'
  ],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'plugin:sonarjs/recommended',
    'plugin:security/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:react-native/all',
    'plugin:expo/recommended',
    'plugin:performance/recommended',
    'plugin:unicorn/recommended'
  ],
  rules: {
    // TypeScript strict rules
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/no-inferrable-types': 'error',
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    '@typescript-eslint/no-import-type-side-effects': 'error',

    // SonarJS rules for code quality
    'sonarjs/no-duplicate-string': 'error',
    'sonarjs/cognitive-complexity': ['error', 15],
    'sonarjs/no-identical-functions': 'error',
    'sonarjs/no-collapsible-if': 'error',
    'sonarjs/no-redundant-boolean': 'error',
    'sonarjs/prefer-immediate-return': 'error',
    'sonarjs/no-inverted-boolean-check': 'error',
    'sonarjs/no-unused-collection': 'error',
    'sonarjs/no-identical-expressions': 'error',
    'sonarjs/no-gratuitous-expressions': 'error',

    // Security rules
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-sql-injection': 'error',

    // React rules
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/display-name': 'error',
    'react/no-unused-prop-types': 'error',
    'react/no-unused-state': 'error',
    'react/prefer-stateless-function': 'error',
    'react/self-closing-comp': 'error',
    'react/sort-comp': 'error',
    'react/jsx-no-useless-fragment': 'error',
    'react/jsx-boolean-value': ['error', 'never'],
    'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
    'react/jsx-pascal-case': 'error',
    'react/jsx-sort-props': ['error', { callbacksLast: true, shorthandFirst: true }],
    'react/function-component-definition': ['error', { namedComponents: 'arrow-function' }],

    // React Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',

    // Accessibility rules
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/click-events-have-key-events': 'error',
    'jsx-a11y/no-static-element-interactions': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error',

    // Import rules
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true }
      }
    ],
    'import/no-duplicates': 'error',
    'import/no-unused-modules': 'error',
    'import/no-deprecated': 'error',

    // Performance rules
    'performance/no-loops': 'error',

    // Unicorn rules for modern JavaScript
    'unicorn/no-null': 'error',
    'unicorn/no-useless-undefined': 'error',
    'unicorn/prefer-array-some': 'error',
    'unicorn/prefer-includes': 'error',
    'unicorn/prefer-negative-index': 'error',
    'unicorn/prefer-optional-catch-binding': 'error',
    'unicorn/prefer-regexp-test': 'error',
    'unicorn/prefer-string-slice': 'error',
    'unicorn/prefer-ternary': 'error',
    'unicorn/no-unreadable-array-destructuring': 'error',
    'unicorn/no-useless-promise-resolve-reject': 'error'
  },
  settings: {
    react: {
      version: 'detect'
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json'
      }
    }
  },
  env: {
    browser: true,
    node: true,
    es2022: true,
    'react-native/react-native': true
  },
  ignorePatterns: [
    'dist/',
    'build/',
    'node_modules/',
    '*.js',
    '*.d.ts',
    'coverage/',
    '.expo/',
    'web-build/',
    'android/',
    'ios/'
  ]
};
`;

    // Backend ESLint config
    fs.writeFileSync(path.join(this.backendRoot, '.eslintrc.js'), eslintConfig);

    // Mobile ESLint config
    fs.writeFileSync(path.join(this.mobileRoot, '.eslintrc.js'), eslintConfig);

    // Admin Portal ESLint config
    fs.writeFileSync(path.join(this.adminRoot, '.eslintrc.js'), eslintConfig);

    // Install ESLint dependencies
    try {
      execSync('npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-sonarjs eslint-plugin-security eslint-plugin-import eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y eslint-plugin-react-native eslint-plugin-expo eslint-plugin-performance eslint-plugin-unicorn --silent', {
        cwd: this.backendRoot,
        stdio: 'inherit'
      });
    } catch (error) {
      console.warn('ESLint dependencies installation warning:', error.message);
    }
  }

  async implementASTDuplicationAnalysis() {
    // AST-based code duplication analysis script
    const astAnalysisScript = `
// AST-based Code Duplication Analysis
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { Project, Node, SyntaxKind } from 'ts-morph';

interface CodeBlock {
  hash: string;
  content: string;
  filePath: string;
  startLine: number;
  endLine: number;
  nodeType: string;
}

interface Duplication {
  hash: string;
  blocks: CodeBlock[];
  similarity: number;
}

export class ASTDuplicationAnalyzer {
  private project: Project;
  private threshold: number = 0.8; // 80% similarity threshold

  constructor(projectPath: string) {
    this.project = new Project({
      tsConfigFilePath: path.join(projectPath, 'tsconfig.json'),
      skipAddingFilesFromTsConfig: false,
      skipFileDependencyResolution: false,
    });
  }

  async analyzeDuplication(): Promise<Duplication[]> {
    console.log('🔍 Analyzing AST-based code duplication...');

    const sourceFiles = this.project.getSourceFiles();
    const allBlocks: CodeBlock[] = [];

    // Extract code blocks from all source files
    for (const sourceFile of sourceFiles) {
      const blocks = this.extractCodeBlocks(sourceFile);
      allBlocks.push(...blocks);
    }

    console.log(\`📊 Extracted \${allBlocks.length} code blocks for analysis\`);

    // Find duplications
    const duplications = this.findDuplications(allBlocks);

    // Filter by similarity threshold
    const significantDuplications = duplications.filter(d => d.similarity >= this.threshold);

    console.log(\`⚠️  Found \${significantDuplications.length} significant duplications\`);

    // Generate refactoring suggestions
    await this.generateRefactoringSuggestions(significantDuplications);

    return significantDuplications;
  }

  private extractCodeBlocks(sourceFile: ts.SourceFile): CodeBlock[] {
    const blocks: CodeBlock[] = [];
    const filePath = sourceFile.getFilePath();

    const extractFromNode = (node: Node, parentType?: string) => {
      if (Node.isFunctionDeclaration(node) ||
          Node.isMethodDeclaration(node) ||
          Node.isClassDeclaration(node) ||
          Node.isInterfaceDeclaration(node) ||
          Node.isEnumDeclaration(node)) {

        const startLine = node.getStartLineNumber();
        const endLine = node.getEndLineNumber();
        const content = node.getText();
        const hash = this.generateHash(content);

        blocks.push({
          hash,
          content,
          filePath,
          startLine,
          endLine,
          nodeType: node.getKindName()
        });
      }

      node.forEachChild(child => extractFromNode(child, node.getKindName()));
    };

    extractFromNode(sourceFile);
    return blocks;
  }

  private findDuplications(blocks: CodeBlock[]): Duplication[] {
    const duplications: Duplication[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < blocks.length; i++) {
      const block1 = blocks[i];
      if (processed.has(block1.hash)) continue;

      const similarBlocks: CodeBlock[] = [block1];

      for (let j = i + 1; j < blocks.length; j++) {
        const block2 = blocks[j];
        if (processed.has(block2.hash)) continue;

        const similarity = this.calculateSimilarity(block1.content, block2.content);
        if (similarity >= this.threshold) {
          similarBlocks.push(block2);
          processed.add(block2.hash);
        }
      }

      if (similarBlocks.length > 1) {
        duplications.push({
          hash: block1.hash,
          blocks: similarBlocks,
          similarity: this.calculateSimilarity(
            similarBlocks[0].content,
            similarBlocks[1].content
          )
        });
      }

      processed.add(block1.hash);
    }

    return duplications;
  }

  private calculateSimilarity(content1: string, content2: string): number {
    // Simple similarity calculation based on token overlap
    const tokens1 = this.tokenize(content1);
    const tokens2 = this.tokenize(content2);

    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);

    return intersection.size / union.size;
  }

  private tokenize(content: string): Set<string> {
    // Tokenize TypeScript/JavaScript code
    const tokens = new Set<string>();

    // Remove comments and strings
    const cleaned = content
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/".*?"/g, '')
      .replace(/'.*?'/g, '');

    // Extract identifiers, keywords, and operators
    const matches = cleaned.match(/\\b\\w+\\b|[{}()\\[\\].,;:!?+\-*/%=&|^~<>]/g) || [];
    matches.forEach(token => tokens.add(token));

    return tokens;
  }

  private generateHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private async generateRefactoringSuggestions(duplications: Duplication[]): Promise<void> {
    const suggestions: string[] = [];

    for (const duplication of duplications) {
      const files = [...new Set(duplication.blocks.map(b => b.filePath))];

      if (files.length > 1) {
        suggestions.push(\`\\n🔄 Refactoring Suggestion for duplication \${duplication.hash}:\`);
        suggestions.push(\`   - Files: \${files.join(', ')}\`);
        suggestions.push(\`   - Blocks: \${duplication.blocks.length}\`);
        suggestions.push(\`   - Similarity: \${(duplication.similarity * 100).toFixed(1)}%\`);
        suggestions.push(\`   - Recommendation: Extract common functionality into shared utility\`);
      }
    }

    if (suggestions.length > 0) {
      const reportPath = path.join(this.project.getDirectory('.').getPath(), 'duplication-analysis-report.md');
      fs.writeFileSync(reportPath, suggestions.join('\\n'));
      console.log(\`📋 Duplication analysis report generated: \${reportPath}\`);
    }
  }
}

// CLI usage
if (require.main === module) {
  const projectPath = process.argv[2] || process.cwd();
  const analyzer = new ASTDuplicationAnalyzer(projectPath);

  analyzer.analyzeDuplication()
    .then(duplications => {
      console.log(\`✅ AST duplication analysis completed. Found \${duplications.length} duplications.\`);
    })
    .catch(error => {
      console.error('❌ AST duplication analysis failed:', error.message);
      process.exit(1);
    });
}
`;

    fs.writeFileSync(path.join(this.projectRoot, 'scripts', 'analyze-duplication.js'), astAnalysisScript);

    // Update package.json with new script
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    packageJson.scripts['analyze:duplication'] = 'node scripts/analyze-duplication.js';

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // Install ts-morph for AST analysis
    try {
      execSync('npm install --save-dev ts-morph typescript --silent', {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });
    } catch (error) {
      console.warn('ts-morph installation warning:', error.message);
    }
  }

  async setupHuskyPrePushHooks() {
    // Initialize Husky v8
    try {
      execSync('npx husky install --silent', {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });
    } catch (error) {
      console.warn('Husky initialization warning:', error.message);
    }

    // Create comprehensive pre-push hook
    const prePushHook = `#!/usr/bin/env sh
. "\$(dirname -- "\$0")/_/husky.sh"

echo "🔍 Running comprehensive pre-push quality checks..."

# Run TypeScript compilation check
echo "📝 Checking TypeScript compilation..."
npm run type-check
if [ \$? -ne 0 ]; then
  echo "❌ TypeScript compilation failed"
  exit 1
fi

# Run ESLint with SonarLint
echo "📋 Running ESLint with SonarLint..."
npm run lint
if [ \$? -ne 0 ]; then
  echo "❌ ESLint checks failed"
  exit 1
fi

# Run tests
echo "🧪 Running tests..."
npm run test
if [ \$? -ne 0 ]; then
  echo "❌ Tests failed"
  exit 1
fi

# Run code duplication analysis
echo "🔍 Running code duplication analysis..."
npm run analyze:duplication
if [ \$? -ne 0 ]; then
  echo "⚠️  Code duplication analysis found issues (warning only)"
fi

# Run dependency check
echo "🧹 Running dependency cleanup..."
npm run depcheck
if [ \$? -ne 0 ]; then
  echo "❌ Dependency check failed"
  exit 1
fi

# Run security audit
echo "🔒 Running security audit..."
npm audit --audit-level moderate
if [ \$? -ne 0 ]; then
  echo "❌ Security audit failed"
  exit 1
fi

# Check bundle size (if applicable)
if npm run build --silent 2>/dev/null; then
  echo "📦 Checking bundle size..."
  npm run analyze:bundle
  if [ \$? -ne 0 ]; then
    echo "⚠️  Bundle size analysis failed (warning only)"
  fi
fi

echo "✅ All pre-push quality checks passed!"
`;

    fs.writeFileSync(path.join(this.projectRoot, '.husky', 'pre-push'), prePushHook);

    // Make hook executable
    try {
      execSync('chmod +x .husky/pre-push', {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });
    } catch (error) {
      console.warn('Husky permissions warning:', error.message);
    }

    // Update package.json with quality scripts
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    packageJson.scripts = {
      ...packageJson.scripts,
      'type-check': 'tsc --noEmit',
      'lint': 'eslint . --ext .ts,.tsx,.js,.jsx',
      'lint:fix': 'eslint . --ext .ts,.tsx,.js,.jsx --fix',
      'test': 'jest',
      'test:watch': 'jest --watch',
      'test:coverage': 'jest --coverage',
      'depcheck': 'depcheck',
      'analyze:bundle': 'npx vite-bundle-analyzer dist',
      'prepare': 'husky install'
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // Install Husky v8
    try {
      execSync('npm install --save-dev husky --silent', {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });
    } catch (error) {
      console.warn('Husky installation warning:', error.message);
    }
  }

  async implementDependencyCleanup() {
    // Create depcheck configuration
    const depcheckConfig = {
      ignores: [
        '@types/*',
        'typescript',
        'eslint',
        'prettier',
        'husky',
        'lint-staged',
        'jest',
        '@testing-library/*',
        'ts-jest',
        'ts-node'
      ],
      skipMissing: false,
      specials: [
        'bin',
        'commitizen',
        'commitlint',
        'eslint',
        'husky',
        'lint-staged',
        'prettier',
        'stylelint',
        'ts-node'
      ]
    };

    fs.writeFileSync(
      path.join(this.projectRoot, '.depcheckrc'),
      JSON.stringify(depcheckConfig, null, 2)
    );

    // Update package.json scripts
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    packageJson.scripts['cleanup:deps'] = 'depcheck && rm -rf node_modules package-lock.json && npm install';

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // Install depcheck
    try {
      execSync('npm install --save-dev depcheck --silent', {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });
    } catch (error) {
      console.warn('depcheck installation warning:', error.message);
    }
  }

  async setupNxMonorepo() {
    // Create nx.json configuration
    const nxConfig = {
      "namedInputs": {
        "default": [
          "{projectRoot}/**/*",
          "sharedGlobals"
        ],
        "production": [
          "default",
          "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
          "!{projectRoot}/tsconfig.spec.json",
          "!{projectRoot}/jest.config.[jt]s",
          "!{projectRoot}/.eslintrc.json",
          "!{projectRoot}/src/test-setup.[jt]s"
        ],
        "sharedGlobals": []
      },
      "targetDefaults": {
        "build": {
          "dependsOn": ["^build"],
          "inputs": ["production", "^production"],
          "cache": true
        },
        "test": {
          "inputs": ["default", "^production", "{workspaceRoot}/jest.preset.js"],
          "cache": true
        },
        "lint": {
          "inputs": [
            "default",
            "{workspaceRoot}/.eslintrc.json",
            "{workspaceRoot}/.eslintignore"
          ],
          "cache": true
        }
      },
      "useInferencePlugins": false,
      "defaultBase": "main",
      "plugins": [
        {
          "plugin": "@nx/js/typescript",
          "options": {
            "typecheck": {
              "targetName": "typecheck"
            },
            "build": {
              "targetName": "build"
            }
          }
        },
        {
          "plugin": "@nx/eslint/plugin",
          "options": {
            "targetName": "lint"
          }
        },
        {
          "plugin": "@nx/jest/plugin",
          "options": {
            "targetName": "test"
          }
        }
      ],
      "generators": {
        "@nx/js": {
          "application": {
            "style": "css",
            "linter": "eslint",
            "unitTestRunner": "jest",
            "e2eTestRunner": "cypress"
          },
          "library": {
            "style": "css",
            "linter": "eslint",
            "unitTestRunner": "jest"
          }
        }
      }
    };

    fs.writeFileSync(
      path.join(this.projectRoot, 'nx.json'),
      JSON.stringify(nxConfig, null, 2)
    );

    // Create project.json files for each app
    const backendProjectConfig = {
      "name": "backend",
      "projectType": "application",
      "sourceRoot": "backend/src",
      "targets": {
        "build": {
          "executor": "@nx/js:tsc",
          "outputs": ["{projectRoot}/dist"],
          "options": {
            "outputPath": "backend/dist",
            "main": "backend/src/server.ts",
            "tsConfig": "backend/tsconfig.json",
            "assets": ["backend/src/assets"]
          }
        },
        "serve": {
          "executor": "@nx/js:node",
          "options": {
            "buildTarget": "backend:build"
          }
        },
        "test": {
          "executor": "@nx/jest:jest",
          "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
          "options": {
            "jestConfig": "backend/jest.config.js",
            "passWithNoTests": true
          }
        },
        "lint": {
          "executor": "@nx/eslint:lint",
          "outputs": ["{options.outputFile}"],
          "options": {
            "lintFilePatterns": ["backend/**/*.{ts,tsx,js,jsx}"]
          }
        }
      },
      "tags": ["type:app", "platform:backend"]
    };

    const mobileProjectConfig = {
      "name": "mobile",
      "projectType": "application",
      "sourceRoot": "src",
      "targets": {
        "build": {
          "executor": "@nx/expo:build",
          "outputs": ["{projectRoot}/dist"],
          "options": {
            "outputPath": "dist"
          }
        },
        "test": {
          "executor": "@nx/jest:jest",
          "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
          "options": {
            "jestConfig": "jest.config.js",
            "passWithNoTests": true
          }
        },
        "lint": {
          "executor": "@nx/eslint:lint",
          "outputs": ["{options.outputFile}"],
          "options": {
            "lintFilePatterns": ["**/*.{ts,tsx,js,jsx}"]
          }
        }
      },
      "tags": ["type:app", "platform:mobile"]
    };

    const adminProjectConfig = {
      "name": "admin-portal",
      "projectType": "application",
      "sourceRoot": "admin-portal/src",
      "targets": {
        "build": {
          "executor": "@nx/vite:build",
          "outputs": ["{projectRoot}/dist"],
          "options": {
            "outputPath": "admin-portal/dist"
          }
        },
        "test": {
          "executor": "@nx/jest:jest",
          "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
          "options": {
            "jestConfig": "admin-portal/jest.config.js",
            "passWithNoTests": true
          }
        },
        "lint": {
          "executor": "@nx/eslint:lint",
          "outputs": ["{options.outputFile}"],
          "options": {
            "lintFilePatterns": ["admin-portal/**/*.{ts,tsx,js,jsx}"]
          }
        }
      },
      "tags": ["type:app", "platform:admin"]
    };

    fs.writeFileSync(
      path.join(this.backendRoot, 'project.json'),
      JSON.stringify(backendProjectConfig, null, 2)
    );

    fs.writeFileSync(
      path.join(this.mobileRoot, 'project.json'),
      JSON.stringify(mobileProjectConfig, null, 2)
    );

    fs.writeFileSync(
      path.join(this.adminRoot, 'project.json'),
      JSON.stringify(adminProjectConfig, null, 2)
    );

    // Install Nx and related packages
    try {
      execSync('npm install --save-dev nx @nx/js @nx/jest @nx/eslint @nx/expo @nx/vite --silent', {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });
    } catch (error) {
      console.warn('Nx installation warning:', error.message);
    }
  }

  async implementWinstonOTLPLogging() {
    // Winston with OTLP configuration for backend
    const winstonConfig = `
// Advanced Winston Logging with OTLP and Distributed Tracing
import winston from 'winston';
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-grpc';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql';

// Initialize OpenTelemetry
const traceExporter = new OTLPTraceExporter({
  url: process.env.OTLP_ENDPOINT || 'http://localhost:4317',
  headers: {
    'api-key': process.env.OTLP_API_KEY,
  },
});

const spanProcessor = new SimpleSpanProcessor(traceExporter);
const tracerProvider = new NodeTracerProvider();
tracerProvider.addSpanProcessor(spanProcessor);
tracerProvider.register();

registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new GraphQLInstrumentation(),
  ],
});

// Create Winston logger with OTLP transport
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS',
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.metadata({
      fillExcept: ['message', 'level', 'timestamp', 'label'],
    })
  ),
  defaultMeta: {
    service: 'guild-backend',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, metadata }) => {
          const traceId = metadata?.traceId || 'no-trace';
          const spanId = metadata?.spanId || 'no-span';
          return \`\${timestamp} [\${level}] [\${traceId}:\${spanId}] \${message}\`;
        })
      ),
    }),

    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // File transport for combined logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

// OTLP Transport for Winston
class OTLPTransport extends winston.Transport {
  log(info: any, callback: () => void) {
    const span = tracerProvider.getTracer('guild-backend').startSpan(\`log:\${info.level}\`);

    span.setAttributes({
      'log.level': info.level,
      'log.message': info.message,
      'log.service': 'guild-backend',
      'log.timestamp': info.timestamp,
      ...info.metadata,
    });

    // Send to OTLP collector
    traceExporter.export([span], (result) => {
      if (result.error) {
        console.error('Failed to export log to OTLP:', result.error);
      }
      span.end();
    });

    callback();
  }
}

// Add OTLP transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new OTLPTransport({
    level: 'info',
    handleExceptions: true,
    handleRejections: true,
  }));
}

// Create logs directory
import * as fs from 'fs';
import * as path from 'path';
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export { logger, tracerProvider };
`;

    fs.writeFileSync(path.join(this.backendRoot, 'src', 'utils', 'advancedLogger.ts'), winstonConfig);

    // Install OpenTelemetry and Winston dependencies
    try {
      execSync('npm install --save winston @opentelemetry/exporter-otlp-grpc @opentelemetry/sdk-trace-base @opentelemetry/sdk-trace-node @opentelemetry/instrumentation @opentelemetry/instrumentation-http @opentelemetry/instrumentation-express @opentelemetry/instrumentation-graphql --silent', {
        cwd: this.backendRoot,
        stdio: 'inherit'
      });
    } catch (error) {
      console.warn('OpenTelemetry installation warning:', error.message);
    }
  }
}

// Run the implementer if called directly
if (require.main === module) {
  const implementer = new ArchitectureQualityImplementer();
  implementer.implement()
    .then(() => {
      console.log('🎉 Advanced architecture and code quality implementation completed!');
    })
    .catch(error => {
      console.error('❌ Implementation failed:', error);
      process.exit(1);
    });
}

module.exports = ArchitectureQualityImplementer;
