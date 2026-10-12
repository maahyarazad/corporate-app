import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export const Skeleton = ({
  variant,
  width = 100,
  height = 100,
  borderRadius,
  color = "#333",
  opacityMin = 0.3,
  opacityMax = 1,
  // Defaults to true so existing callers are unaffected. Pass false whenever the
  // skeleton is on screen but not visible - a wrapper hiding itself with
  // `display: "none"` never unmounts, so cleanup never runs and the loop would
  // otherwise keep evaluating a worklet every frame forever.
  animating = true,
  style,
}) => {
  const opacity = useSharedValue(opacityMin);

  useEffect(() => {
    if (!animating) {
      cancelAnimation(opacity);
      opacity.value = opacityMin;

      return;
    }

    // reverse:false - the sequence already returns to opacityMin on its own.
    opacity.value = withRepeat(
      withSequence(
        withDelay(
          200,
          withTiming(opacityMax, { duration: 300, easing: Easing.linear })
        ),
        withTiming(opacityMin, { duration: 700, easing: Easing.linear })
      ),
      -1,
      false
    );

    // withRepeat returns no stoppable handle, unlike the RN loop it replaces.
    // Without this the loop outlives the component, and Skeleton renders
    // inside lists.
    return () => {
      cancelAnimation(opacity);
    };
  }, [animating, opacityMin, opacityMax]);

  const skeletonPulseStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

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
