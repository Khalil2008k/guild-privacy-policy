const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// COMMENT: PRODUCTION HARDENING - Task 5.6 - Detect production mode for minification
const isProduction = process.env.NODE_ENV === 'production' || process.env.EXPO_PUBLIC_ENVIRONMENT === 'production';

const config = getDefaultConfig(__dirname);

// CRITICAL: Exclude backend directory from Metro bundler
// Backend is Node.js server code and should NOT be bundled in the mobile app
// Set projectRoot to src to prevent Metro from scanning backend
config.projectRoot = path.resolve(__dirname, 'src');

// Configure resolver with aggressive backend exclusion
config.resolver = config.resolver || {};
// Use blacklistRE (works better than blockList in some Metro versions)
// Exclude backend, test files, and spec files (match both / and \ for Windows compatibility)
config.resolver.blacklistRE = /(backend[\\/].*|__tests__[\\/].*|\.test\.(ts|tsx|js|jsx)$|\.spec\.(ts|tsx|js|jsx)$)/;
config.resolver.blockList = [
  // Block all backend files (absolute and relative paths)
  /.*[\\/]backend[\\/].*/,
  /backend[\\/].*/,
  // Block backend in node_modules
  /node_modules\/.*\/backend\/.*/,
  // Block server.ts files
  /.*[\\/]server\.ts$/,
  // Block test files (should not be bundled in production)
  /.*[\\/]__tests__[\\/].*/,
  /.*\.test\.(ts|tsx|js|jsx)$/,
  /.*\.spec\.(ts|tsx|js|jsx)$/,
];

// Configure path aliases
config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
};

// Advanced source map configuration to prevent InternalBytecode.js errors
config.symbolicator = {
  customizeFrame: (frame) => {
    // Filter out internal React Native frames that cause symbolication errors
    if (frame.file && frame.file.includes('InternalBytecode.js')) {
      return null;
    }
    return frame;
  },
};

// Enhanced transformer configuration for better error handling
// COMMENT: PRODUCTION HARDENING - Task 5.6 - Minification and tree-shaking enabled
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true, // Enable inline requires for better tree-shaking
    },
  }),
  // COMMENT: PRODUCTION HARDENING - Task 5.6 - Aggressive minification for production builds
  // In development, keep class names for debugging
  // In production, enable full minification
  minifierConfig: isProduction
    ? {
        // Production: Aggressive minification
        compress: {
          drop_console: true, // Remove console.log in production
          drop_debugger: true, // Remove debugger statements
          pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
          passes: 3, // Multiple passes for better compression
        },
        mangle: {
          toplevel: true, // Mangle top-level names
          properties: false, // Keep property names for React Native compatibility
        },
        output: {
          comments: false, // Remove comments
          beautify: false, // Don't beautify output
        },
      }
    : {
        // Development: Keep names for debugging
        keep_classnames: true,
        keep_fnames: true,
        mangle: {
          keep_classnames: true,
          keep_fnames: true,
        },
      },
};

// Enable Fast Refresh for development
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Enable Fast Refresh headers
      res.setHeader('X-React-Refresh', 'true');
      return middleware(req, res, next);
    };
  },
};

// Enable Fast Refresh for better development experience
config.resetCache = false;

// Resolver enhancements for better module resolution
// COMMENT: PRODUCTION HARDENING - Task 5.6 - Tree-shaking optimization
config.resolver = {
  ...config.resolver,
  sourceExts: [...(config.resolver.sourceExts || []), 'tsx', 'ts', 'jsx', 'js', 'json'],
  resolverMainFields: ['react-native', 'browser', 'main'],
  // COMMENT: PRODUCTION HARDENING - Task 5.6 - Optimize for tree-shaking
  // Prioritize ES modules for better tree-shaking
  ...(isProduction && {
    unstable_enablePackageExports: true, // Enable package.json exports field for tree-shaking
  }),
};

// CRITICAL: Only watch src directory to prevent Metro from scanning backend
config.watchFolders = [
  path.resolve(__dirname, 'src'),
  path.resolve(__dirname, 'node_modules'),
];

module.exports = config;
