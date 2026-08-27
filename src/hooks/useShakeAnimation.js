import { Vibration } from "react-native";
import {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

// Peak horizontal displacement, in px, at the extremes of the shake.
const SHAKE_OFFSET = 10;
// Duration of one 0 -> 2 sweep. Two iterations produce four half-shakes.
const SHAKE_DURATION = 120;
const SHAKE_ITERATIONS = 2;

const INPUT_RANGE = [0, 0.5, 1, 1.5, 2];
const OUTPUT_RANGE = [0, -SHAKE_OFFSET, 0, SHAKE_OFFSET, 0];

/**
 * Shake-on-validation-failure animation, shared by every form screen.
 *
 * Replaces five byte-identical copies of the same Animated block. Spread
 * `shakeStyle` onto a react-native-reanimated `Animated.View` wrapping the form,
 * and call `shake()` when validation fails.
 *
 * @returns {{ shakeStyle: object, shake: () => void }}
 */
export const useShakeAnimation = () => {
  const progress = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, INPUT_RANGE, OUTPUT_RANGE) },
    ],
  }));

  const shake = () => {
    Vibration.vibrate();
    // Reset explicitly. The Animated version relied on `.start(setValue(0))`
    // resetting the value only because JS evaluates the argument before the
    // call - correct by accident. Make it deliberate.
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(2, { duration: SHAKE_DURATION, easing: Easing.linear }),
      SHAKE_ITERATIONS,
      false
    );
  };

  return { shakeStyle, shake };
};
