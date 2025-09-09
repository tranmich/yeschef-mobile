module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // No reanimated/worklets plugins to avoid TurboModule issues
    ],
  };
};
