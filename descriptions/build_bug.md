# Build Bug - Google Recaptcha Update breaks the build

## Description 
DO NOT CHANGE ANY GRADLE FILE THIS SHOULD BE HANDLE WITH EXPO 
Please check the build errors and fix the problem 

```txt
 Task :app:checkDebugAarMetadata FAILED

[Incubating] Problems report is available at: file:///Users/germanworldclub/Documents/GEC-Corporate/android/build/reports/problems/problems-report.html

FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':app:checkDebugAarMetadata'.
> A failure occurred while executing com.android.build.gradle.internal.tasks.CheckAarMetadataWorkAction
   > 2 issues were found when checking AAR metadata:
     
       1.  Dependency ':google-cloud_recaptcha-enterprise-react-native' requires core library desugaring to be enabled
           for :app.
     
           See https://developer.android.com/studio/write/java8-support.html for more
           details.
     
       2.  Dependency 'com.google.android.recaptcha:recaptcha:18.9.0-beta01' requires core library desugaring to be enabled
           for :app.
     
           See https://developer.android.com/studio/write/java8-support.html for more
           details.

* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.
> Run with --scan to get full insights.
> Get more help at https://help.gradle.org.

Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.

For more on this, please refer to https://docs.gradle.org/8.14.3/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.

BUILD FAILED in 1m 3s
297 actionable tasks: 190 executed, 107 from cache
Error: /Users/germanworldclub/Documents/GEC-Corporate/android/gradlew app:assembleDebug -x lint -x test --configure-on-demand --build-cache -PreactNativeDevServerPort=8081 -PreactNativeArchitectures=arm64-v8a,armeabi-v7a exited with non-zero code: 1
Error: /Users/germanworldclub/Documents/GEC-Corporate/android/gradlew app:assembleDebug -x lint -x test --configure-on-demand --build-cache -PreactNativeDevServerPort=8081 -PreactNativeArchitectures=arm64-v8a,armeabi-v7a exited with non-zero code: 1
    at ChildProcess.completionListener (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/@expo/spawn-async/src/spawnAsync.ts:167:13)
    at Object.onceWrapper (node:events:639:26)
    at ChildProcess.emit (node:events:524:28)
    at Process.ChildProcess._handle.onexit (node:internal/child_process:293:12)
    ...
    at spawnAsync (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/@expo/spawn-async/src/spawnAsync.ts:39:21)
    at spawnGradleAsync (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/expo/node_modules/@expo/cli/src/start/platforms/android/gradle.ts:134:28)
    at assembleAsync (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/expo/node_modules/@expo/cli/src/start/platforms/android/gradle.ts:83:16)
    at runAndroidAsync (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/expo/node_modules/@expo/cli/src/run/android/runAndroidAsync.ts:62:24)
germanworldclub@Mac-mini GEC-Corporate % 
```

# Runtime Bug - 3 - Google Recaptcha Update breaks the runtime

## Description 

follow the logs for the error

```txt
Android Bundling failed 5ms node_modules/expo/AppEntry.js (1 module)
 ERROR  Error: Cannot find module 'babel-preset-expo'
Require stack:
- /Users/germanworldclub/Documents/GEC-Corporate/node_modules/@babel/core/lib/config/files/plugins.js
- /Users/germanworldclub/Documents/GEC-Corporate/node_modules/@babel/core/lib/config/files/index.js
- /Users/germanworldclub/Documents/GEC-Corporate/node_modules/@babel/core/lib/index.js
- /Users/germanworldclub/Documents/GEC-Corporate/node_modules/expo/node_modules/@expo/metro-config/build/transform-worker/metro-transform-worker.js
- /Users/germanworldclub/Documents/GEC-Corporate/node_modules/expo/node_modules/@expo/metro-config/build/transform-worker/transform-worker.js
- /Users/germanworldclub/Documents/GEC-Corporate/node_modules/@expo/metro/node_modules/metro/src/DeltaBundler/Worker.flow.js
- /Users/germanworldclub/Documents/GEC-Corporate/node_modules/@expo/metro/node_modules/metro/src/DeltaBundler/Worker.js
- /Users/germanworldclub/Documents/GEC-Corporate/node_modules/jest-worker/build/workers/processChild.js

Make sure that all the Babel plugins and presets you are using
are defined as dependencies or devDependencies in your package.json
file. It's possible that the missing plugin is loaded by a preset
you are using that forgot to add the plugin to its dependencies: you
can workaround this problem by explicitly adding the missing package
to your top-level package.json.

    at Module._resolveFilename (node:internal/modules/cjs/loader:1207:15)
    at resolve (node:internal/modules/helpers:193:19)
    at tryRequireResolve (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/@babel/core/lib/config/files/plugins.js:128:11)
    at resolveStandardizedNameForRequire (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/@babel/core/lib/config/files/plugins.js:162:19)
    at resolveStandardizedName (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/@babel/core/lib/config/files/plugins.js:183:12)
    at loadPreset (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/@babel/core/lib/config/files/plugins.js:68:7)
    at loadPreset.next (<anonymous>)
    at createDescriptor (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/@babel/core/lib/config/config-descriptors.js:140:16)
    at createDescriptor.next (<anonymous>)
    at evaluateSync (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/gensync/index.js:251:28)
    at /Users/germanworldclub/Documents/GEC-Corporate/node_modules/gensync/index.js:31:34
    at Array.map (<anonymous>)
    at Function.sync (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/gensync/index.js:31:22)
    at Function.all (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/gensync/index.js:210:24)
    at Generator.next (<anonymous>)
    at createDescriptors (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/@babel/core/lib/config/config-descriptors.js:102:41)
    at createDescriptors.next (<anonymous>)
    at createPresetDescriptors (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/@babel/core/lib/config/config-descriptors.js:96:17)
    at createPresetDescriptors.next (<anonymous>)
    at /Users/germanworldclub/Documents/GEC-Corporate/node_modules/@babel/core/lib/gensync-utils/functional.js:22:27
    at Generator.next (<anonymous>)
    at mergeChainOpts (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/@babel/core/lib/config/config-chain.js:350:34)
    at mergeChainOpts.next (<anonymous>)
    at chainWalker (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/@babel/core/lib/config/config-chain.js:316:14)
    at chainWalker.next (<anonymous>)
    at loadFileChain (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/@babel/core/lib/config/config-chain.js:191:24)
    at loadFileChain.next (<anonymous>)
    at mergeExtendsChain (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/@babel/core/lib/config/config-chain.js:328:28)
    at mergeExtendsChain.next (<anonymous>)
    at chainWalker (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/@babel/core/lib/config/config-chain.js:312:20)
    at chainWalker.next (<anonymous>)
    at buildRootChain (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/@babel/core/lib/config/config-chain.js:56:36)
    at buildRootChain.next (<anonymous>)
    at loadPrivatePartialConfig (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/@babel/core/lib/config/partial.js:72:62)
    at loadPrivatePartialConfig.next (<anonymous>)
    at loadFullConfig (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/@babel/core/lib/config/full.js:36:46)
    at loadFullConfig.next (<anonymous>)
    at transform (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/@babel/core/lib/transform.js:20:44)
    at transform.next (<anonymous>)
    at evaluateSync (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/gensync/index.js:251:28)
    at sync (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/gensync/index.js:89:14)
    at stopHiding - secret - don't use this - v1 (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/@babel/core/lib/errors/rewrite-stack-trace.js:47:12)
    at Object.transformSync (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/@babel/core/lib/transform.js:40:76)
    at parseWithBabel (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/expo/node_modules/@expo/metro-config/build/transformSync.js:75:18)
    at transformSync (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/expo/node_modules/@expo/metro-config/build/transformSync.js:64:12)
    at Object.transform (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/expo/node_modules/@expo/metro-config/build/babel-transformer.js:127:58)
    at transformJSWithBabel (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/expo/node_modules/@expo/metro-config/build/transform-worker/metro-transform-worker.js:468:47)
    at Object.transform (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/expo/node_modules/@expo/metro-config/build/transform-worker/metro-transform-worker.js:583:12)
    at Object.transform (/Users/germanworldclub/Documents/GEC-Corporate/node_modules/expo/node_modules/@expo/metro-config/build/transform-worker/transform-worker.js:178:19)

```

# Build Bug - Google Recaptcha Update breaks the ios build

## Description 
follow the build error

```txt
germanworldclub@Mac-mini GEC-Corporate % npx expo run:ios             
env: load .env
env: export EXPO_PUBLIC_BASE_URL EXPO_PUBLIC_SERVER_HOST EXPO_PUBLIC_SERVICES_BASE_URL EXPO_PUBLIC_SERVICES_HOST EXPO_PUBLIC_DEV EXPO_PUBLIC_RECAPTCHA_SITE_KEY
✔ Created native directory
✔ Updated package.json | no changes
✔ Finished prebuild
⚠️  Something went wrong running `pod install` in the `ios` directory.
Command `pod install` failed.
└─ Cause: The following Swift pods cannot yet be integrated as static libraries:

The Swift pod `RecaptchaEnterprise` depends upon `RecaptchaInterop`, which does not define modules. To opt into those targets generating module maps (which is necessary to import them from Swift when building as static libraries), you may set `use_modular_headers!` globally in your Podfile, or specify `:modular_headers => true` for particular dependencies.

pod install --repo-update --ansi exited with non-zero code: 1
› Skipping dev server
✔ Development team for signing the app › Buena Publica FZE (YQFY6269ZL) - Apple Development: Seyedmahyar Azadhosseini (3V9G552H76)
› Signing and building iOS app with: Apple Development: Seyedmahyar Azadhosseini (3V9G552H76)
› Planning build
› Executing GECMobile » [CP] Check Pods Manifest.lock

❌  error: The sandbox is not in sync with the Podfile.lock. Run 'pod install' or update your CocoaPods installation.
```


# Runtime Bug - Google Recaptcha Update Runtime Error

## Description 
I did create a new enterprize for andriod and ios and put it in the EXPO and build the application again but still I get this error

```txt
 LOG  [validateInfo] field lengths: {"cpassword": 8, "email": 17, "mobile": 9, "password": 8, "passwordsEqual": false, "username": 11}
 LOG  [validateInfo] field lengths: {"cpassword": 8, "email": 17, "mobile": 9, "password": 8, "passwordsEqual": true, "username": 11}
 LOG  [axios →] POST http://192.168.1.200:3299/v1/api/user/validate-details
 LOG  [axios ←] 200 user/validate-details {"success":true,"services":{}}
 LOG  [Register] sendCaptcha pressed
 LOG  [Register] miscellaneous: undefined
 LOG  [Register] requesting reCAPTCHA token...
 LOG  [Recaptcha] execute() action: register
 LOG  [Register] sendCaptcha error: Key type invalid [com.google.android.recaptcha.RecaptchaException: Key type invalid]
 LOG  [Register] sendCaptcha finished, clearing loading
```



The actual fix is in the Google Cloud console — code alone won't resolve it

The Key type invalid error will persist until you create a proper Android-type Enterprise key. Steps:

1. Google Cloud Console → Security → reCAPTCHA Enterprise → Create key.
2. Choose platform Android (a separate one for iOS). The key you have now (6Le07Rgt…) is a Website/iOS key — that's exactly why Android rejects it.
3. For the Android key, set Package name = com.buenapublica.GECRewards.
4. Add the SHA-256 fingerprint of the cert that signs the build. This is the part that usually trips up EAS users: when EAS manages your keystore, the SHA-256 is not your local debug cert. Get it with:
eas credentials   # Android → select profile → view the SHA-256 fingerprint
4. Paste that SHA-256 into the Android key config. (Wrong/missing fingerprint = invalid-key errors.)
5. Put the resulting key IDs into .env:
EXPO_PUBLIC_RECAPTCHA_SITE_KEY_ANDROID=<android key id>
EXPO_PUBLIC_RECAPTCHA_SITE_KEY_IOS=<ios key id>
6. Since EXPO_PUBLIC_* vars are inlined at build time, you must rebuild (eas build) — changing .env without rebuilding has no effect. That's likely why your earlier rebuild "still" failed: you rebuilt the binary but the key itself was still the wrong type.

Want me to check eas.json to confirm how env vars are wired into your build profiles, or help pull the SHA-256 via eas credentials?

 Opening exp+gec-rewards://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081 on SM_S918B

› Logs for your project will appear below. Press Ctrl+C to exit.
› Stopped server
germanworldclub@Mac-mini GEC-Corporate % eas credentials
★ eas-cli@20.1.0 is now available.
To upgrade, run:
npm install -g eas-cli
Proceeding with outdated version.

✔ Select platform › Android
✔ Which build profile do you want to configure? › development
✔ Using build profile: development
Android Credentials     
Project                 GEC-Rewards
Application Identifier  com.buenapublica.GECRewards

Push Notifications (FCM Legacy)  
Key      AAAA...WNiU
Updated  2 years ago

Push Notifications (FCM V1): Google Service Account Key For FCM V1  
Project ID      gec-rewards-26313
Client Email    
Client ID       
Private Key ID  
Updated         3 months ago

Submissions: Google Service Account Key for Play Store Submissions  
Project ID      
Client Email    
Client ID       
Private Key ID  
Updated         3 years ago

Configuration: Build Credentials KASffJ70wa (Default)  
Keystore  
Type                JKS
Key Alias           
MD5 Fingerprint     
SHA1 Fingerprint    
SHA256 Fingerprint  
Updated             3 years ago

? What do you want to do? › - Use arrow-keys. Return to submit.
❯   Keystore: Manage everything needed to build your project
    Google Service Account
    Push Notifications (Legacy): Manage your FCM (Legacy) API Key
    credentials.json: Upload/Download credentials between EAS servers and your local json 
    Go back
    Exit


# Feature - Automatically Retrieve OTP from SMS

## Description

In `otpVerification.js`, add support for automatically detecting and retrieving the OTP from incoming SMS messages.

When an OTP message is received, the application should automatically populate the OTP input field and submit the code to the server for verification without requiring manual user input.

## Expected Behavior

- Detect incoming SMS messages containing the OTP.
- Automatically extract the OTP code from the message.
- Populate the OTP input field with the extracted code.
- Automatically send the OTP to the server for verification.
- If verification is successful, continue to the next step of the authentication flow.

## Notes

- The implementation should follow platform-specific best practices for OTP autofill on both iOS and Android.
- Users should still be able to manually enter the OTP if automatic detection is unavailable or fails.