module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      '@babel/plugin-proposal-optional-chaining',
      'react-native-worklets/plugin'
    ],
    // Strip all console.* statements from production bundles. They remain in
    // development builds for debugging but are removed entirely from production
    // output, so they neither run nor ship to end users.
    env: {
      production: {
        plugins: ['transform-remove-console'],
      },
    },
  };
};
