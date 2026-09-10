import "react-native-gesture-handler";
import { useEffect } from "react";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { StyleSheet, Text, TextInput } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  initialWindowMetrics,
  SafeAreaProvider
} from "react-native-safe-area-context";
import { ThemeProvider } from "styled-components/native";
import { theme } from "./src/infrastructure/theme";
import { SectionContextProvider } from "./src/services/section/section.context";
import { AuthContextProvider } from "./src/services/auth/auth.context";
import { LocationContextProvider } from "./src/services/location/location.context";
import { AppNavigation } from "./navigation";
import { UploadContextProvider } from "./src/services/upload/upload.context";
import { TranslationContextProvider } from "./src/services/translation/translation.context";
import { AppContextProvider } from "./src/services/app/app.context";
import AuthProvider from "./src/services/auth_v2/auth.context";
import UserProvider from "./src/services/user_v2/user.context";
import PostProvider from "./src/services/post/post.context";
import { Provider } from "react-redux";
import configureStore from "./redux/store/postStore";
import AlertContextProvider from "./src/services/alert/alert.context";
import { toastConfig } from "./src/Toast";
import Toast from "react-native-toast-message";
import { ConfirmDialogHost } from "./src/components/confirmDialog.component";
import { initRecaptcha } from "./src/services/recaptcha/recaptcha.service";
import { sweepApiCache } from "./utils/cacheDb";
import { LONGEST_TTL_MS } from "./utils/cachePolicy";
import { enableFreeze } from "react-native-screens";

// Restrict console output to development only. In production builds __DEV__ is
// false, so every console method becomes a no-op — debugging statements never
// run or leak information to end users. This is a runtime safety net that works
// regardless of bundler config; babel.config.js additionally strips the calls
// from the production bundle entirely (transform-remove-console).
if (!__DEV__) {
  const noop = () => {};
  console.log = noop;
  console.info = noop;
  console.debug = noop;
  console.warn = noop;
  console.error = noop;
  console.trace = noop;
}

// Bound the response cache once per launch. `readCache` only drops a stale row
// when something asks for it, so an entry written once and never read again
// would otherwise live forever. Fire-and-forget: `sweepApiCache` never throws
// and nothing on the render path waits for it.
sweepApiCache(LONGEST_TTL_MS);

// Stop blurred screens re-rendering. A screen covered by another one stays
// mounted, so today every context write above it - LocationContext alone writes
// on userLocation, currentMerchant, eventList and getEventsList - re-renders
// screens nobody is looking at.
//
// This is global because there is no narrower form of it. react-native-screens
// reads the flag once, in Screen.js (`freezeOnBlur = freezeEnabled()`), and
// @react-navigation/native-stack at this version forwards no per-screen
// `freezeOnBlur` option at all.
//
// It suspends RENDERING only: the subtree stays mounted, effects are not
// cleaned up and native views stay alive. So it does not replace the focus gate
// in map.screen.js, which is what actually releases the native map surface.
//
// Deleting this line reverts the behaviour completely - see
// specs/012-dispose-profile-and NFR-002.
enableFreeze();

const store = configureStore();

export default function App() {
  Text.defaultProps = Text.defaultProps || {};
  Text.defaultProps.allowFontScaling = false;
  TextInput.defaultProps = TextInput.defaultProps || {};
  TextInput.defaultProps.allowFontScaling = false;

  // Initialize the reCAPTCHA Enterprise client once for the app lifetime.
  useEffect(() => {
    initRecaptcha().catch(() => {
      // Already logged inside the service; warming up is best-effort.
    });
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      {/* 009: the app's single SafeAreaProvider. Inside GestureHandlerRootView,
          which 008 requires stay outermost; above ThemeProvider so the Toast and
          ConfirmDialogHost siblings below can read insets too. initialWindowMetrics
          seeds frame 1 so it is not rendered with zero insets. */}
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ThemeProvider theme={theme}>
          <Provider store={store}>
            <AlertContextProvider>
              <TranslationContextProvider>
                <AppContextProvider>
                  <AuthContextProvider>
                    {/* ^ to be removed*/}
                    <AuthProvider>
                      <UserProvider>
                        <PostProvider>
                          {/* <UserContextProvider> */}
                          {/* ^ to be removed*/}
                          <UploadContextProvider>
                            <LocationContextProvider>
                              <SectionContextProvider>
                                <AppNavigation />
                              </SectionContextProvider>
                            </LocationContextProvider>
                          </UploadContextProvider>
                          {/* </UserContextProvider> */}
                        </PostProvider>
                      </UserProvider>
                    </AuthProvider>
                  </AuthContextProvider>
                </AppContextProvider>
              </TranslationContextProvider>
            </AlertContextProvider>
          </Provider>
        </ThemeProvider>
        <Toast config={toastConfig} />
        <ConfirmDialogHost />

        <ExpoStatusBar style="dark" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  // GestureHandlerRootView must fill the screen. Without flex: 1 it collapses to
  // zero height and the app renders blank.
  root: { flex: 1 },
});
