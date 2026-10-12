module.exports = {
  preset: "jest-expo",
  passWithNoTests: true,
  // The cache layer (cacheDb, apiCache, cachePolicy) lives in `utils/` at the
  // repository root, not under `src/`, so the original src-only pattern would
  // silently collect none of its tests. Both roots are matched now.
  testMatch: [
    "**/src/**/__tests__/**/*.test.js",
    "**/utils/__tests__/**/*.test.js",
  ],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)",
  ],
};
