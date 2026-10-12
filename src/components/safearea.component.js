import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * The app's single safe-area boundary. See specs/009-safe-area-context/.
 *
 * Replaces React Native's `SafeAreaView`, which is deprecated upstream
 * ("will be removed in a future release") and which is a plain `View` on
 * Android — `Platform.select({ ios: RCTSafeAreaView, default: View })`. That
 * no-op is why this file previously hand-rolled
 * `paddingTop: StatusBar.currentHeight` for Android; the library handles both
 * platforms natively, so the platform branch is gone rather than relocated.
 *
 * `edges` has no default on purpose. The library's default is all four edges,
 * which matches what iOS already did natively, so iOS behaviour is unchanged.
 * Android gains the bottom and display-cutout insets it never had. Screens
 * whose layout already accounts for the gesture bar can opt out per-edge
 * rather than reintroducing platform arithmetic here.
 */
export const SafeArea = ({ style, children, pointerEvents, edges }) => {
  return (
    <SafeAreaView
      style={[styles.container, style]}
      pointerEvents={pointerEvents}
      edges={edges}
    >
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Every one of the 38 call sites assumes this fills its parent; without
  // flex: 1 the screen collapses to zero height. Caller `style` is merged
  // after, so it always wins.
  container: {
    flex: 1,
  },
});
