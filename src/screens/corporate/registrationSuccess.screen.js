import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
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
import { Spacer } from "../../components/spacer/spacer.component";
import { Label } from "../../components/typography/label.component";
import { theme } from "../../infrastructure/theme";
import { navigate } from "../../navigation/navigate";

export const RegistrationSuccessfulScreen = () => {
  const bounceValue = useSharedValue(0);
  const fadeInValue = useSharedValue(0);
  const fadeInButton = useSharedValue(0);

  useEffect(() => {
    // withSpring/withTiming take no delay option - withDelay supplies it.
    bounceValue.value = withDelay(1000, withSpring(1, { mass: 1 }));

    fadeInValue.value = withDelay(
      1000,
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
    );

    fadeInButton.value = withDelay(
      1500,
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
        <View style={{ flex: 2, justifyContent: "flex-end" }}>
          <Animated.View style={bounceAnimationStyle}>
            <MaterialCommunityIcons
              name="account-check"
              color={theme.colors.icons.active}
              size={200}
            />
          </Animated.View>
        </View>
        <View
          style={{
            paddingHorizontal: 32,
            flex: 3,
            justifyContent: "space-between",
          }}
        >
          <Animated.View style={fadeInAnimationStyle}>
            <Label
              size="h4"
              weight="bold"
              style={{ color: "white", textAlign: "center" }}
            >
              Your account has been created!
            </Label>
            
            <Label
              size="title"
              weight="medium"
              style={{ color: "white", textAlign: "center" , ...styles.marginFix}}
            >
              Before you can login, please activate your account by clicking the
              verification link we have sent to your email.
            </Label>
          </Animated.View>
          <Animated.View style={fadeInButtonAnimationStyle}>
            <Button
              mode="contained"
              buttonColor={theme.colors.icons.active}
              labelStyle={{ paddingVertical: 14 }}
              style={{ marginBottom: 100, borderRadius: 10 }}
              onPress={() => {
                navigate("Login");
              }}
            >
              <Label
                size="title"
                weight="bold"
                style={{ color: "black", textAlign: "center" }}
              >
                Back to Login
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
  marginFix:{
    marginTop: 8
  }
});
