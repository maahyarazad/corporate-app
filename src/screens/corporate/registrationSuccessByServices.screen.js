import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";
import Background from "../../components/background/background.component";
import useAuth from "../../../hooks/useAuth";
import { Label } from "../../components/typography/label.component";
import { theme } from "../../infrastructure/theme";
import { navigate } from "../../navigation/navigate";

import { retrieveToken } from "../../services/auth/auth.service";

export const RegistrationSuccessByServices = () => {
  const bounceValue = useRef(new Animated.Value(0)).current;
  const fadeInValue = useRef(new Animated.Value(0)).current;
  const fadeInButton = useRef(new Animated.Value(0)).current;

  const { signin, loading, verifyOTP, submittedCard, authorize } = useAuth();

  const fadeInterpolation = bounceValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  const fadeInterpolationButton = fadeInButton.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  useEffect(() => {
    Animated.spring(bounceValue, {
      toValue: 1,
      useNativeDriver: true,
      //   bounciness: 200,
      delay: 500,
      mass: 1,
    }).start();

    Animated.timing(fadeInValue, {
      toValue: 1,
      useNativeDriver: true,
      duration: 800,
      delay: 500,
    }).start();

    Animated.timing(fadeInButton, {
      toValue: 1,
      useNativeDriver: true,
      duration: 700,
      delay: 500,
    }).start();
  }, []);

  const bounceAnimationStyle = {
    opacity: bounceValue,
    transform: [
      {
        translateY: fadeInterpolation,
      },
    ],
  };

  const fadeInAnimationStyle = {
    opacity: fadeInValue,
  };

  const fadeInButtonAnimationStyle = {
    opacity: fadeInButton,
    transform: [
      {
        scale: fadeInterpolationButton,
      },
    ],
  };

  return (
    <Background>
      <View style={styles.container}>
        <View style={{ flex: 2, justifyContent: "flex-end" }}>

          <Animated.View style={bounceAnimationStyle}>
            <Label
              size="h4"
              weight="bold"
              style={{ color: "white", textAlign: "center" }}
            >
              BOOM!

            </Label>

<Label
              size="h4"
              weight="bold"
              style={{ color: "white", textAlign: "center" }}
            >
              You are in
              
            </Label>

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
              style={{
                color: "white",
                textAlign: "center",
                ...styles.marginFix,
              }}
            >
              Your account has already been verified with the provided email and
              mobile number previously.
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
                Continues
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
});
