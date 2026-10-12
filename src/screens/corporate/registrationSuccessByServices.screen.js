import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Button } from "react-native-paper";
import Background from "../../components/background/background.component";
import useAuth from "../../../hooks/useAuth";
import { Label } from "../../components/typography/label.component";
import { theme } from "../../infrastructure/theme";
import { navigate } from "../../navigation/navigate";


export const RegistrationSuccessByServices = () => {
  const bounceValue = useSharedValue(0);
  const fadeInValue = useSharedValue(0);
  const fadeInButton = useSharedValue(0);

  const { signin, loading, verifyOTP, submittedCard, authorize } = useAuth();

  useEffect(() => {
    // withSpring/withTiming take no delay option - withDelay supplies it.
    bounceValue.value = withDelay(500, withSpring(1, { mass: 1 }));

    fadeInValue.value = withDelay(
      500,
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
    );

    fadeInButton.value = withDelay(
      500,
      withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })
    );
  }, []);

  const bounceAnimationStyle = useAnimatedStyle(() => ({
    opacity: bounceValue.value,
    transform: [
      { translateY: interpolate(bounceValue.value, [0, 1], [-100, 0]) },
    ],
  }));

  const fadeInAnimationStyle = useAnimatedStyle(() => ({
    opacity: fadeInValue.value,
  }));

  const fadeInButtonAnimationStyle = useAnimatedStyle(() => ({
    opacity: fadeInButton.value,
    transform: [
      { scale: interpolate(fadeInButton.value, [0, 1], [0.9, 1]) },
    ],
  }));

  return (
    <Background>
      <View style={styles.container}>
        <View style={styles.flexBox}>
          <Animated.View style={bounceAnimationStyle}>
            <Label size="h4" weight="bold" style={styles.label}>
              BOOM!
            </Label>

            <Label size="h4" weight="bold" style={styles.label}>
              You are in
            </Label>

            <MaterialCommunityIcons
              name="account-check"
              color={theme.colors.icons.active}
              size={200}
            />
          </Animated.View>
        </View>
        <View style={styles.flexBox2}>
          <Animated.View style={fadeInAnimationStyle}>
            <Label size="h4" weight="bold" style={styles.label}>
              Your account has been verified!
            </Label>

         
          </Animated.View>
          <Animated.View style={fadeInButtonAnimationStyle}>
            <Button
              mode="contained"
              buttonColor={theme.colors.icons.active}
              labelStyle={styles.buttonLabel}
              style={styles.button}
              onPress={() => {
                navigate("Login");
              }}
            >
              <Label size="title" weight="bold" style={styles.label2}>
                Continue
              </Label>
            </Button>
          </Animated.View>
        </View>
      </View>
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  marginFix: {
    marginTop: 8,
  },
  flexBox: {
    flex: 2,
    justifyContent: "flex-end",
  },
  label: {
    color: "white",
    textAlign: "center",
  },
  flexBox2: {
    paddingHorizontal: 32,
    flex: 3,
    justifyContent: "space-between",
  },
  buttonLabel: {
    paddingVertical: 14,
  },
  button: {
    marginBottom: 100,
    borderRadius: 10,
  },
  label2: {
    color: "black",
    textAlign: "center",
  },
});
