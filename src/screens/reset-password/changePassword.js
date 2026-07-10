import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  StyleSheet,
  Vibration,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Button } from "react-native-paper";
import Background from "../../components/background/background.component";
import { CustomTextInput } from "../../components/customTextInput";
import { SafeArea } from "../../components/safearea.component";

import { Label } from "../../components/typography/label.component";
import { theme } from "../../infrastructure/theme";
import { showToast } from "../../Toast";
import { UserService } from "../../services/user/user.service";

export const ChangePasswordScreen = ({ route }) => {
  const { user_id } = route.params;
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [password, setPassword] = useState("");
  const [cpassword, setCpassword] = useState("");
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

  const handleSubmit = async () => {
    setIsSubmitted(true);

    if (password.trim() === "" || cpassword.trim() === "") {
      shake();
      showToast("error", "Empty Fields", "Some fields are empty.");
      return;
    }

    if (!(password.length >= 8) || !(cpassword.length >= 8)) {
      shake();
      showToast(
             "error",
             "Password too short",
             "Password must be at least 8 characters long!"
           );
      return;
    }

    if (password !== cpassword) {
      shake();
       showToast("error", "Invalid Password", "Password does not match!");
      return;
    }

    

    const data = {
      password,
      user_id,
    };

    const response = await UserService.changePassword(data);

    if (response.success) {
      showToast("success", response.title, response.message);

      navigation.reset({ routes: [{ name: "Login" }] });
    } else {
      showToast("error", response.title, response.message);
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
            <Label style={{ color: "white", marginBottom: 10 }} size="title" weight="bold">
              Enter your new password
            </Label>
            
            <CustomTextInput
            style={{marginBottom: 10}}
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
            
            <CustomTextInput
            style={{marginBottom: 10}}
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
