import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Touchable, View } from "react-native";
import { Animated, StyleSheet } from "react-native";
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
  const buttonScale = new Animated.Value(1);

  const buttonInterpolation = buttonScale.interpolate({
    inputRange: [scaleTo, 1],
    outputRange: [0, 1],
  });
  const onPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: scaleTo,
      speed: speed,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      speed: speed,
      useNativeDriver: true,
    }).start();
  };

  const buttonAnimatedScaleStyle = {
    transform: [
      {
        scale: buttonScale,
      },
    ],
  };

  const buttonAnimatedColorStyle = {
    opacity: buttonInterpolation,
  };

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
