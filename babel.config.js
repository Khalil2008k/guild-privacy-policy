module.exports = function (api) {
  // COMMENT: FINAL STABILIZATION - Fix Babel cache configuration issue
  // Disable caching in development to avoid conflicts, enable in production
  const isProduction = api.env('production') || process.env.NODE_ENV === 'production';
  api.cache(!isProduction ? false : true); // No cache in dev, cache in production
  
  return {
    presets: ["babel-preset-expo"],
    // COMMENT: PRODUCTION HARDENING - Task 5.6 - Tree-shaking optimizations
    // NOTE: Console removal is handled by Metro minifier config, not Babel
    plugins: [],
    // COMMENT: PRODUCTION HARDENING - Task 5.6 - Enable tree-shaking via loose mode
    // This allows better tree-shaking by converting ES6 classes to functions
    env: {
      production: {
        presets: [
          [
            'babel-preset-expo',
            {
              // Enable tree-shaking optimizations
              native: {
                unstable_transformProfile: 'hermes-stable', // Use Hermes stable transform
              },
            },
          ],
        ],
      },
    },
  };
};