import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, {
  forwardRef,
  useContext,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import usePosts from "../screens/posts/post_card/usePosts";
import { TranslationContext } from "../services/translation/translation.context";

export const CustomTextInput = forwardRef(
  (
    {
      label = "",
      value,
      onChangeText,
      error,
      secureTextEntry,
      showEye,
      keyboardType,
      maxLength,
      right,
      style,
      returnKeyType,
      autoFillPassword = false,
      textContentType,
      disable = false,
      placeholder,
      inputStyle,
      multiline,
      numberOfLines,
      areaHeight = 137,
      onBlur,
      // Was called by the TextInput's onFocus handler but never destructured,
      // so a parent's onFocus was silently ignored.
      onFocus,
      labelLeftOffset = 5,
      onSubmitEditing,
      showKeyboardDismiss = true,
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const [showText, setShowText] = useState(false);
    const [textAreaHeight, setTextAreaHeight] = useState(areaHeight);
    const { resetReply } = usePosts();
    const { i18n } = useContext(TranslationContext);

    // iOS-only bar above the keyboard with a dismiss button. Number-pad,
    // phone-pad and multiline keyboards have no return key, so without it the
    // member can't close the keyboard. Each instance needs its own nativeID or
    // several fields on one screen would share a bar. Android's
    // InputAccessoryView only logs a warning, so it is never rendered there.
    const accessoryId = `cti-${useId()}`;
    const showAccessory = Platform.OS === "ios" && showKeyboardDismiss;
    const styles = StyleSheet.create({
      container: {
        height: 55,
        width: "100%",
        borderRadius: 4,
        backgroundColor: "white",
        justifyContent: "center",
        position: "relative",
      },
      input: {
        fontSize: 15,
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 6,
        height: "100%",
        marginBottom: 2,
        marginTop: 2,
      },
      label: {
        position: "absolute",
        paddingHorizontal: 14,
        left: labelLeftOffset,
        color: "#999",
        fontSize: 16,
        zIndex: 1,
      },
      eyeContainer: {
        paddingHorizontal: 9,
        zIndex: 3,
      },
    });

    const inputRef = useRef(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
      blur: () => {
        inputRef.current?.blur();
      },
      clear: () => {
        inputRef.current?.clear();
      },
      // expose the TextInput itself
      getNativeInput: () => inputRef.current,
    }));
    const animatedValue = useSharedValue(0);

    // Reads `label` from the closure, so the style re-derives when the prop
    // changes - translateX depends on label.length.
    const labelAnimatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: interpolate(animatedValue.value, [0, 100], [1, 0.8]) },
        {
          translateX: interpolate(
            animatedValue.value,
            [0, 100],
            [0, label.length * -1]
          ),
        },
        { translateY: interpolate(animatedValue.value, [0, 100], [0, -22]) },
      ],
    }));

    useLayoutEffect(() => {
      if (value != undefined && value.trim() != "") {
        floatUp();
        // animatedValue.setValue(100);
      }
    }, [value]);

    // Defect D3, behaviour preserved deliberately: the original wrote
    // `.start(setFocused(true))`, which invokes the setter immediately and
    // passes its undefined return as the completion callback. So the state
    // change happened at animation START, not end. Kept as-is rather than
    // silently changing UX inside a refactor - see T045 for the follow-up.
    const floatUp = () => {
      setFocused(true);
      animatedValue.value = withTiming(100, {
        duration: 200,
        easing: Easing.inOut(Easing.ease),
      });
    };

    const floatDown = () => {
      if (isEmpty()) {
        setFocused(false);
        animatedValue.value = withTiming(0, {
          duration: 200,
          easing: Easing.inOut(Easing.ease),
        });
      }
    };

    const isEmpty = () => {
      return value == undefined || value.trim() == "";
    };

    const toggleShowText = () => {
      setShowText(!showText);
    };

    return (
      <View
        style={[
          styles.container,
          style,
          error &&
            !focused && {
              borderWidth: 2,
              borderRadius: 4,
              borderColor: "red",
            },
          multiline && {
            height: textAreaHeight,
            maxHeight: 100,
          },
        ]}
      >
        <View style={staticStyles.rowCenter}>
          <TextInput
            ref={inputRef}
            inputAccessoryViewID={showAccessory ? accessoryId : undefined}
            returnKeyType={returnKeyType}
            maxLength={maxLength}
            keyboardType={keyboardType}
            // autoComplete={false}
            onSubmitEditing={onSubmitEditing}
            autoCorrect={false}
            textContentType={textContentType}
            secureTextEntry={!showText && secureTextEntry}
            style={[
              styles.input,
              { color: disable ? "#999" : "black" },
              inputStyle,
            ]}
            onFocus={(e) => {
              floatUp(); // keep the floating label animation
              if (typeof onFocus === "function") {
                onFocus(e); // call parent-provided onFocus
              }
            }}
            multiline={multiline}
            numberOfLines={numberOfLines}
            onChangeText={onChangeText}
            value={value}
            editable={!disable}
            placeholder={placeholder}
            onBlur={onBlur ?? floatDown}
            selectionColor={disable ? "#ccc" : "#a6cdfb"} // visible highlight
            onContentSizeChange={({
              nativeEvent: {
                contentSize: { width, height },
              },
            }) => {
              const _height = height + 40 - areaHeight;
              if (_height > areaHeight && _height < 100) {
                setTextAreaHeight(_height);
              } else if (_height > 100) {
                setTextAreaHeight(100);
              }
            }}
          />
          {showEye && (
            <View style={styles.eyeContainer}>
              <MaterialCommunityIcons
                suppressHighlighting={true}
                onPress={toggleShowText}
                name={showText ? "eye-off" : "eye"}
                size={25}
              />
            </View>
          )}
          {right && (
            <View style={staticStyles.centerBox}>
              {right}
            </View>
          )}
        </View>
        <Animated.Text
          style={[
            styles.label,
            {
              color: disable
                ? "#999"
                : focused
                  ? "#333"
                  : error
                    ? "red"
                    : isEmpty()
                      ? "#999"
                      : "#333",
            },
            labelAnimatedStyle,
            multiline && { top: 18 },
          ]}
        >
          {label}
        </Animated.Text>
        {/* Mounted whenever the field is, not only while focused: iOS looks
            the accessory up by ID at the moment the field focuses. It is not
            laid out inline; iOS places it above the keyboard. Keyboard.dismiss
            blurs the field, so `onBlur ?? floatDown` runs as usual. */}
        {showAccessory && (
          <InputAccessoryView nativeID={accessoryId}>
            <View style={staticStyles.accessoryBar}>
              <Pressable
                onPress={Keyboard.dismiss}
                hitSlop={10}
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
        )}
      </View>
    );
  }
);

const staticStyles = StyleSheet.create({
  rowCenter: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 2,
    alignItems: "center",
    flexDirection: "row",
  },
  centerBox: {
    paddingHorizontal: 24,
    zIndex: 3,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  accessoryBar: {
    height: 44,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 14,
    backgroundColor: "#F1F1F3",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#C7C7CC",
  },
});
