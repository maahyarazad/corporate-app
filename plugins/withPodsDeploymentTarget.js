const { withPodfile } = require("@expo/config-plugins");

/**
 * Raises every pod target's IPHONEOS_DEPLOYMENT_TARGET to the app's own
 * deployment target (`ios.deploymentTarget` in Podfile.properties.json, set by
 * expo-build-properties; 17.0 today).
 *
 * Several pods declare an old minimum in their podspec (SDWebImage and
 * PromisesObjC 9.0, GoogleUtilities and ReachabilitySwift 12.0,
 * react-native-blob-util 11.0), and CocoaPods copies that onto their targets,
 * including the privacy-manifest resource-bundle targets. Xcode 27 only
 * supports 15.0 and up and fails the build with:
 *
 *   The iOS deployment target 'IPHONEOS_DEPLOYMENT_TARGET' is set to 9.0, but
 *   the range of supported deployment target versions is 15.0 to 27.0.x.
 *
 * Only raises a target, never lowers one. Runs after react_native_post_install
 * so nothing resets it afterwards.
 *
 * This lives in a config plugin because `expo prebuild` regenerates the
 * `ios/Podfile` and would otherwise drop a manual edit.
 */
const MARKER = "# Pod deployment target floor (withPodsDeploymentTarget)";

const block = `
    ${MARKER}
    pods_min_ios = podfile_properties['ios.deploymentTarget'] || '17.0'
    installer.generated_projects.each do |project|
      project.targets.each do |target|
        target.build_configurations.each do |bc|
          current = bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
          if current.nil? || Gem::Version.new(current) < Gem::Version.new(pods_min_ios)
            bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = pods_min_ios
          end
        end
      end
    end
`;

const withPodsDeploymentTarget = (config) => {
  return withPodfile(config, (cfg) => {
    let contents = cfg.modResults.contents;

    if (!contents.includes(MARKER)) {
      // Append inside post_install, right after the multi-line
      // `react_native_post_install(...)` call every Expo Podfile contains.
      const next = contents.replace(
        /(react_native_post_install\([\s\S]*?\n\s*\)\n)/,
        `$1${block}`
      );
      if (next === contents) {
        throw new Error(
          "withPodsDeploymentTarget: react_native_post_install(...) not found in ios/Podfile"
        );
      }
      contents = next;
    }

    cfg.modResults.contents = contents;
    return cfg;
  });
};

module.exports = withPodsDeploymentTarget;
