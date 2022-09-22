import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  StyleSheet,
  Vibration,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Button } from "react-native-paper";
import Background from "../../components/background/background.component";
import { CustomTextInput } from "../../components/customTextInput";
import { SafeArea } from "../../components/safearea.component";
import { Spacer } from "../../components/spacer/spacer.component";
import { Label } from "../../components/typography/label.component";
import { theme } from "../../infrastructure/theme";
import { navigate } from "../../navigation/navigate";
import { UserService } from "../../services/user/user.service";

export const ChangePasswordScreen = ({ route }) => {
  const { user_id } = route.params;
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [password, setPassword] = useState("");
  const [cpassword, setCpassword] = useState("");
  const isMounted = useRef(true);
  const navigation = useNavigation();

  const animatedShake = useRef(new Animated.Value(0)).current;

  const shakeInterpolate = animatedShake.interpolate({
    inputRange: [0, 0.5, 1, 1.5, 2],
    outputRange: [0, -10, 0, 10, 0],
  });

  const shake = () => {
    Vibration.vibrate();
    Animated.loop(
      Animated.timing(animatedShake, {
        toValue: 2,
        useNativeDriver: true,
        easing: Easing.linear,
        duration: 120,
      }),
      {
        iterations: 2,
      }
    ).start(animatedShake.setValue(0));
  };

  const shakeAnimatedStyle = {
    transform: [
      {
        translateX: shakeInterpolate,
      },
    ],
  };

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = true;
    };
  }, []);

  const handleSubmit = async () => {
    setIsSubmitted(true);

    if (password.trim() === "" || cpassword.trim() === "") {
      shake();
      Alert.alert("Invalid", "Some fields are empty.");
      return;
    }

    if (!(password.length >= 8) || !(cpassword.length >= 8)) {
      shake();
      Alert.alert(
        "Password too short",
        "Password must be at least 8 characters"
      );
      return;
    }

    if (password !== cpassword) {
      shake();
      Alert.alert("Invalid Password", "Password doesn't match");
      return;
    }

    console.log(route.params);

    const data = {
      password,
      user_id,
    };

    const response = await UserService.changePassword(data);

    if (isMounted.current) {
      console.log(response);
      if (response.success) {
        Alert.alert(response.title, response.message);
        navigation.reset({ routes: [{ name: "Login" }] });
      } else {
        Alert.alert(response.title, response.message);
      }
    }
  };

  return (
    <Background>
      <SafeArea>
        <KeyboardAwareScrollView
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          keyboardShouldPersistTaps="always"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Animated.View style={[styles.container, shakeAnimatedStyle]}>
            <Label style={{ color: "white" }} size="title" weight="bold">
              Enter your new password
            </Label>
            <Spacer position={"top"} size="medium" />
            <CustomTextInput
              label="New Password *"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              showEye={true}
              error={
                (password.trim() === "" && isSubmitted) ||
                (password !== cpassword && isSubmitted)
              }
            />
            <Spacer position={"top"} size="medium" />
            <CustomTextInput
              label="Confirm New Password *"
              value={cpassword}
              onChangeText={setCpassword}
              secureTextEntry={true}
              showEye={true}
              error={
                (password.trim() === "" && isSubmitted) ||
                (password !== cpassword && isSubmitted)
              }
            />
            <Spacer position={"top"} size="medium" />
            <Button
              mode="contained"
              onPress={handleSubmit}
              contentStyle={{
                width: "100%",
                paddingVertical: 8,
                backgroundColor: theme.colors.ui.yellowGold,
              }}
              style={{ width: "100%" }}
              labelStyle={{ fontSize: 16 }}
            >
              Change Password
            </Button>
          </Animated.View>
        </KeyboardAwareScrollView>
      </SafeArea>
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 16,
  },
});
