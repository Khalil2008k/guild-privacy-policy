
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
    'unused-imports',
    'deprecation',
    'expo'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  rules: {
    // TypeScript basic rules
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',


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
    'import/no-duplicates': 'warn',

    // Custom performance rules (removed external plugin)
    'no-loop-func': 'error',
    'prefer-template': 'error',
    
    // Disable problematic react-native rules
    'react-native/no-raw-text': 'off',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'off',
    
    // Security rules
    'security/detect-sql-injection': 'off', // Disable problematic rule
    
    // Unused imports
    'unused-imports/no-unused-imports': 'warn',
    'unused-imports/no-unused-vars': ['warn', { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' }],
    
    // TypeScript specific rules
    '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
    
    // Accessibility rules
    'jsx-a11y/label-has-associated-control': ['error', { required: { some: ['nesting', 'id'] } }],
    'jsx-a11y/no-noninteractive-element-interactions': 'warn',
    
    // React rules
    'react/no-unescaped-entities': 'warn'
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





