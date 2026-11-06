import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useContext, useId } from "react";
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { TranslationContext } from "../services/translation/translation.context";

// iOS-only floating "close keyboard" button above the keyboard. Number-pad,
// phone-pad and multiline keyboards have no return key, so without it the
// member can't close the keyboard.
//
// Usage, for any TextInput (or a wrapper that forwards props to one):
//
//   const accessoryId = useKeyboardDismissId();
//   <TextInput inputAccessoryViewID={accessoryId} ... />
//   {accessoryId && <KeyboardDismissAccessory nativeID={accessoryId} />}
//
// Render the accessory whenever the input is mounted, not only while focused:
// iOS looks it up by ID at the moment the input focuses. It is not laid out
// inline; iOS places it above the keyboard. Keyboard.dismiss blurs the input,
// so its onBlur runs as usual.

// One ID per input. If several inputs on a screen shared one, they'd share a
// bar. Returns undefined on Android (InputAccessoryView only logs a warning
// there) or when disabled, so the result can be passed straight to
// `inputAccessoryViewID` and used as the render condition.
export const useKeyboardDismissId = (enabled = true) => {
  const id = `kda-${useId()}`;
  return Platform.OS === "ios" && enabled ? id : undefined;
};

export const KeyboardDismissAccessory = ({ nativeID }) => {
  const { i18n } = useContext(TranslationContext);

  if (Platform.OS !== "ios" || !nativeID) return null;

  return (
    <InputAccessoryView nativeID={nativeID}>
      <View style={styles.strip}>
        <Pressable
          onPress={Keyboard.dismiss}
          hitSlop={10}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={i18n.t("keyboard-dismiss")}
        >
          <MaterialCommunityIcons
            name="keyboard-close"
            size={24}
            color="#007AFF"
          />
        </Pressable>
      </View>
    </InputAccessoryView>
  );
};

const styles = StyleSheet.create({
  // No background: the accessory view itself is clear, so only the button
  // shows, floating at the keyboard's top-right corner.
  strip: {
    height: 48,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  // A small white disc keeps the icon readable over any screen content.
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  pressed: {
    opacity: 0.6,
  },
});
