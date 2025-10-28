const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

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
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
  minifierConfig: {
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
config.resolver = {
  ...config.resolver,
  sourceExts: [...(config.resolver.sourceExts || []), 'tsx', 'ts', 'jsx', 'js', 'json'],
  resolverMainFields: ['react-native', 'browser', 'main'],
};

module.exports = config;