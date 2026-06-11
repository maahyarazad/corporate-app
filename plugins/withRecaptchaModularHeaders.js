const { withPodfile } = require("@expo/config-plugins");

/**
 * Opts the reCAPTCHA Enterprise CocoaPods into modular headers.
 *
 * `@google-cloud/recaptcha-enterprise-react-native` pulls in the Swift pod
 * `RecaptchaEnterprise`, which depends on `RecaptchaInterop`. When pods are
 * integrated as static libraries (the Expo default, no `use_frameworks!`),
 * `RecaptchaInterop` does not define a module map, so the Swift pod cannot
 * `import` it and `pod install` fails with:
 *
 *   The Swift pod `RecaptchaEnterprise` depends upon `RecaptchaInterop`,
 *   which does not define modules.
 *
 * Setting `:modular_headers => true` on these pods generates the module maps.
 *
 * This lives in a config plugin because `expo prebuild` regenerates the
 * `ios/Podfile` and would otherwise drop a manual edit, breaking the build.
 */
const MARKER = "# reCAPTCHA Enterprise modular headers (withRecaptchaModularHeaders)";

const modularHeadersBlock = `  ${MARKER}
  pod 'RecaptchaInterop', :modular_headers => true
  pod 'RecaptchaEnterprise', :modular_headers => true
`;

const withRecaptchaModularHeaders = (config) => {
  return withPodfile(config, (cfg) => {
    let contents = cfg.modResults.contents;

    if (!contents.includes(MARKER)) {
      // Insert the pod declarations inside the main target, right after the
      // `use_expo_modules!` line that every Expo-generated Podfile contains.
      contents = contents.replace(
        /^(\s*use_expo_modules!.*\n)/m,
        `$1${modularHeadersBlock}`
      );
    }

    cfg.modResults.contents = contents;
    return cfg;
  });
};

module.exports = withRecaptchaModularHeaders;
