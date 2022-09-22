import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

export const Skeleton = ({
  variant,
  width = 100,
  height = 100,
  borderRadius,
  color = "#333",
  opacityMin = 0.3,
  opacityMax = 1,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(opacityMin)).current;

  useEffect(() => {
    let isMounted = true;

    if (isMounted)
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: opacityMax,
            useNativeDriver: true,
            duration: 300,
            delay: 200,
            easing: Easing.linear,
          }),
          Animated.timing(animatedValue, {
            toValue: opacityMin,
            useNativeDriver: true,
            duration: 700,
            easing: Easing.linear,
          }),
        ])
      ).start();
    return () => {
      isMounted = false;
      animatedValue.setValue(0);
    };
  }, []);

  const skeletonPulseStyle = {
    opacity: animatedValue,
  };

  const skeletonShape = (variant) => {
    switch (variant) {
      case "circle":
        return { borderRadius: 100 };
      case "square":
        return {};
    }
  };

  return (
    <>
      <Animated.View
        style={[
          skeletonPulseStyle,
          {
            width: width,
            height: height,
            borderRadius: borderRadius,
            backgroundColor: color,
          },
          skeletonShape(variant),
          style,
        ]}
      ></Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {},
});
