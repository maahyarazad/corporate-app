const { getDefaultConfig } = require("expo/metro-config");

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.extraNodeModules = {
  ...defaultConfig.resolver.extraNodeModules,
  path: require.resolve("path-browserify"), // shim 'path' with browser-friendly module
};

module.exports = defaultConfig;
