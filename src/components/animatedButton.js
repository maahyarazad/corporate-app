import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Touchable, View } from "react-native";
import { StyleSheet } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Label } from "./typography/label.component";

export const AnimatedButton = ({
  onPress,
  textSize,
  textWeight,
  textColor,
  label,
  styles,
  buttonColorTo = "#666",
  buttonColorFrom = "#999",
  iconName,
  iconSize,
  speed = 200,
  scaleTo = 0.9,
  ...props
}) => {
  // Was a bare legacy animated value with no ref, so every re-render threw
  // away the in-flight animation and snapped the scale back. A shared value
  // survives re-renders.
  const buttonScale = useSharedValue(1);

  // The legacy spring took `speed`; Reanimated only implements the physical
  // model, and there is no algebraic conversion from the speed/bounciness
  // parameterisation. Map it so the `speed` prop keeps meaning "higher is
  // faster" for existing callers.
  const springConfig = { damping: 15, stiffness: Math.max(1, speed * 0.75) };

  const onPressIn = () => {
    buttonScale.value = withSpring(scaleTo, springConfig);
  };

  const onPressOut = () => {
    buttonScale.value = withSpring(1, springConfig);
  };

  const buttonAnimatedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const buttonAnimatedColorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(buttonScale.value, [scaleTo, 1], [0, 1]),
  }));

  return (
    <>
      <Pressable
        disabled={props.disabled}
        checked={props.checked}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles}
      >
        <Animated.View
          style={[
            style.buttonStyle,
            buttonAnimatedScaleStyle,
            { backgroundColor: buttonColorTo },
          ]}
        >
          <Animated.View
            style={[
              style.animatedButtonStyle,
              buttonAnimatedColorStyle,
              { backgroundColor: buttonColorFrom },
            ]}
          ></Animated.View>
          <View
            style={{
              position: "absolute",
              flex: 1,
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "row",
            }}
          >
            <MaterialCommunityIcons
              color={textColor}
              name={iconName}
              size={iconSize}
            />
            <Label
              size={textSize}
              weight={textWeight}
              style={{
                color: textColor,
                marginLeft: 6,
              }}
            >
              {label}
            </Label>
          </View>
        </Animated.View>
      </Pressable>
    </>
  );
};

const style = StyleSheet.create({
  buttonStyle: {
    flex: 1,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  animatedButtonStyle: {
    flex: 1,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 32,
  },
});
