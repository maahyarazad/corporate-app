import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Animated, StyleSheet, TextInput, View } from "react-native";
import { Label } from "./typography/label.component";
import usePosts from "../screens/posts/post_card/usePosts";

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
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const [showText, setShowText] = useState(false);
    const [textAreaHeight, setTextAreaHeight] = useState(areaHeight);
    const { resetReply } = usePosts();

    const inputRef = useRef(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current.focus();
      },
    }));
    const animatedValue = useRef(new Animated.Value(0)).current;

    const scaleInterpolation = animatedValue.interpolate({
      inputRange: [0, 100],
      outputRange: [1, 0.8],
    });
    const transXInterpolation = animatedValue.interpolate({
      inputRange: [0, 100],
      outputRange: [0, label.length * -1],
    });
    const transYInterpolation = animatedValue.interpolate({
      inputRange: [0, 100],
      outputRange: [0, -22],
    });

    useLayoutEffect(() => {
      let isMounted = true;

      if (value != undefined && value.trim() != "") {
        if (isMounted) {
          floatUp();
          // animatedValue.setValue(100);
        }
      }

      return () => {
        isMounted = false;
      };
    }, [value]);

    const floatUp = () => {
      Animated.timing(animatedValue, {
        toValue: 100,
        useNativeDriver: false,
        duration: 200,
      }).start(setFocused(true));
    };

    const floatDown = () => {
      if (isEmpty()) {
        Animated.timing(animatedValue, {
          toValue: 0,
          useNativeDriver: false,
          duration: 200,
        }).start(setFocused(false));
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
        <View
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            zIndex: 2,
            alignItems: "center",
            flexDirection: "row",
          }}
        >
          <TextInput
            ref={inputRef}
            returnKeyType={returnKeyType}
            maxLength={maxLength}
            keyboardType={keyboardType}
            // autoComplete={false}
            autoCorrect={false}
            textContentType={textContentType}
            secureTextEntry={!showText && secureTextEntry}
            style={[
              styles.input,
              { color: disable ? "#999" : "black" },
              inputStyle,
            ]}
            multiline={multiline}
            numberOfLines={numberOfLines}
            onChangeText={onChangeText}
            value={value}
            editable={!disable}
            placeholder={placeholder}
            onFocus={floatUp}
            onBlur={onBlur ?? floatDown}
            selectionColor="black"
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
            <View
              style={{
                paddingHorizontal: 24,
                zIndex: 3,
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
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
              transform: [
                { scale: scaleInterpolation },
                { translateX: transXInterpolation },
                { translateY: transYInterpolation },
              ],
            },
            multiline && { top: 18 },
          ]}
        >
          {label}
        </Animated.Text>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    height: 55,
    width: "100%",
    borderRadius: 4,
    backgroundColor: "white",
    justifyContent: "center",
    position: "relative",
    // overflow: "hidden",
  },
  input: {
    fontSize: 15,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    height: "100%",
  },
  label: {
    position: "absolute",
    paddingHorizontal: 14,
    color: "#999",
    fontSize: 16,
    zIndex: 1,
  },
  eyeContainer: {
    paddingHorizontal: 9,
    zIndex: 3,
  },
});
