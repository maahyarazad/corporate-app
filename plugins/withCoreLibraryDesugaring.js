const { withAppBuildGradle } = require("@expo/config-plugins");

/**
 * Enables Android core library desugaring in android/app/build.gradle.
 * Required by `com.google.android.recaptcha` (reCAPTCHA Enterprise), which is
 * pulled in by @google-cloud/recaptcha-enterprise-react-native.
 *
 * Without this, `expo prebuild` would regenerate the project and drop the
 * manual Gradle edits, breaking the build again.
 */
const DESUGAR_VERSION = "2.1.4";

const compileOptionsBlock = `android {
    compileOptions {
        // Required by com.google.android.recaptcha (reCAPTCHA Enterprise).
        coreLibraryDesugaringEnabled true
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }`;

const withCoreLibraryDesugaring = (config) => {
  return withAppBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents;

    // 1) Enable desugaring inside the top-level `android { ... }` block.
    if (!contents.includes("coreLibraryDesugaringEnabled")) {
      contents = contents.replace(/^android \{/m, compileOptionsBlock);
    }

    // 2) Add the desugaring runtime to the top-level `dependencies { ... }`.
    if (!contents.includes("desugar_jdk_libs")) {
      contents = contents.replace(
        /^dependencies \{/m,
        `dependencies {
    // Core library desugaring runtime, required by reCAPTCHA Enterprise.
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:${DESUGAR_VERSION}")`
      );
    }

    cfg.modResults.contents = contents;
    return cfg;
  });
};

module.exports = withCoreLibraryDesugaring;
