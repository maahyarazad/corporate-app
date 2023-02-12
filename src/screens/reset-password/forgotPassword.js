import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Button } from "react-native-paper";
import PhoneInput from "react-native-phone-number-input";
import Background from "../../components/background/background.component";
import { CustomTextInput } from "../../components/customTextInput";
import { SafeArea } from "../../components/safearea.component";
import { Spacer } from "../../components/spacer/spacer.component";
import { Label } from "../../components/typography/label.component";
import { useTheme } from "styled-components";
import { Ionicons } from "@expo/vector-icons";
import { navigate } from "../../navigation/navigate";
import { UserService } from "../../services/user/user.service";
import { LoadingOverlay } from "../../components/loading/loading.component";
import { config } from "../../utils/constants";

export const ForgotPasswordScreen = () => {
  const [mobile, setMobile] = useState("");
  const [mobileCode, setMobileCode] = useState("971");
  const [mobileCountry, setMobileCountry] = useState("AE");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [login, setLogin] = useState("");
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);
  const theme = useTheme();

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
      isMounted.current = false;
    };
  }, []);

  const goback = () => {
    navigate("Login");
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitted(true);

      if (login.trim() === "" || mobile.trim() === "") {
        Alert.alert("Invalid", "Some fields are empty.");
        shake();
        return;
      }

      const data = {
        login,
        mobileCode,
        mobile,
        app_id: config.APP_ID,
      };

      setLoading(true);
      const result = await UserService.requestForgetPass(data);
      if (isMounted.current) {
        console.log(result);
        if (result.success) {
          setLoading(false);

          navigate("ForgotPasswordOTP", {
            mobileCode,
            mobile,
            login,
            user_id: result.data.user_id,
          });
        } else {
          setLoading(false);
          Alert.alert(result.title, result.message);
        }
      }
    } catch (error) {
      console.log(error);
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
          <LoadingOverlay display={loading} />
          <Animated.View style={[styles.container, shakeAnimatedStyle]}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-start",
                width: "100%",
                paddingVertical: 16,
              }}
            >
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  onPress={goback}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  activeOpacity={0.5}
                >
                  <Ionicons name="arrow-back" size={35} color={"#eee"} />
                  <Label
                    size={"title"}
                    weight="bold"
                    style={{ color: "#dfdfdf", justifyContent: "center" }}
                  >
                    Login
                  </Label>
                </TouchableOpacity>
                <Spacer position={"top"} size={"medium"} />

                <Label
                  size={"title"}
                  weight={"bold"}
                  style={{ color: "white" }}
                >
                  Forgot Password
                </Label>
                <Spacer position={"top"} size={"small"} />
                <Label
                  size={"body"}
                  weight={"medium"}
                  style={{ color: "white" }}
                >
                  Please provide the following information
                </Label>
              </View>
            </View>
            <CustomTextInput
              value={login}
              onChangeText={setLogin}
              style={{ width: "100%", height: 65 }}
              label="Username or Email *"
              error={login.trim() === "" && isSubmitted}
            ></CustomTextInput>
            <Spacer position={"top"} size={"medium"} />
            <PhoneInput
              defaultCode="AE"
              layout="first"
              placeholder="543248901 *"
              onChangeText={(prev) => {
                setMobile(prev.replace(/[^0-9]/g, ``));
              }}
              onChangeCountry={(country) => {
                setMobileCountry(country.cca2);
                setMobileCode(country.callingCode);
              }}
              containerStyle={{
                borderRadius: 5,
                width: "100%",
                borderWidth: isSubmitted && mobile.trim() === "" ? 2 : 0,
                borderColor:
                  isSubmitted && mobile.trim() === "" ? "red" : "#00000099",
                marginTop: 0,
              }}
              textContainerStyle={{
                borderTopRightRadius: 5,
                borderBottomRightRadius: 5,
              }}
            />
            <Spacer position={"top"} size={"medium"} />
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
              Submit
            </Button>
          </Animated.View>
        </KeyboardAwareScrollView>
      </SafeArea>
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
});
