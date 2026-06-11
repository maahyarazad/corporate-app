const { getDefaultConfig } = require("expo/metro-config");

const defaultConfig = getDefaultConfig(__dirname);

// Add extra node modules for Metro to resolve
defaultConfig.resolver.extraNodeModules = {
  ...defaultConfig.resolver.extraNodeModules,

  // shim 'path' module for web
  path: require.resolve("path-browserify"),

  // explicitly resolve react-async-hook
  "react-async-hook": require.resolve("react-async-hook"),
};

// Optional: if you want to include node modules for web builds
// defaultConfig.resolver.resolverMainFields = ['browser', 'main'];

module.exports = defaultConfig;