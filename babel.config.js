module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Fast Refresh is enabled by default with babel-preset-expo
    // No need to add additional plugins
  };
};