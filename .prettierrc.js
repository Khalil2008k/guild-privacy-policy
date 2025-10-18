module.exports = {
  // Basic formatting
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'es5',
  tabWidth: 2,
  useTabs: false,
  printWidth: 80,
  
  // Line breaks
  endOfLine: 'lf',
  insertPragma: false,
  requirePragma: false,
  
  // Bracket spacing
  bracketSpacing: true,
  bracketSameLine: false,
  
  // Arrow functions
  arrowParens: 'avoid',
  
  // HTML/JSX
  htmlWhitespaceSensitivity: 'css',
  jsxSingleQuote: true,
  
  // Prose
  proseWrap: 'preserve',
  
  // Override for specific file types
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 200
      }
    },
    {
      files: '*.md',
      options: {
        printWidth: 100,
        proseWrap: 'always'
      }
    },
    {
      files: '*.yml',
      options: {
        tabWidth: 2
      }
    },
    {
      files: '*.yaml',
      options: {
        tabWidth: 2
      }
    }
  ]
};







