import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useContext, useEffect, useState } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { ActivityIndicator } from "react-native-paper";
import { sub } from "react-native-reanimated";
import { useTheme } from "styled-components/native";
import Background from "../../components/background/background.component";
import { CodeInputField } from "../../components/codeInputField";
import { SafeArea } from "../../components/safearea.component";
import { Spacer } from "../../components/spacer/spacer.component";
import {
  BottomHalf,
  height,
  IconBg,
  TopHalf,
  VerifyButton,
  width,
} from "../../components/styles";
import { Label } from "../../components/typography/label.component";
import { AuthContext } from "../../services/auth/auth.context";
import { TranslationContext } from "../../services/translation/translation.context";
import { config } from "../../utils/constants";
import useRequest from "../../../hooks/useRequest";
import useAuth from "../../../hooks/useAuth";
import useUser from "../../../hooks/useUser";
import { useOtpAutoRead } from "../../../hooks/useOtpAutoRead";
import { navigate } from "../../navigation/navigate";
import { showToast } from "../../Toast";
import { fontSizes } from "../../infrastructure/theme/fonts";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    justifyContent: "flex-start",
  },

  fixMargin: {
    marginTop: 8,
    marginBottom: 20,
  },
});

export const OtpVerification = ({ route, navigation }) => {
  const MAX_CODE_LENGTH = 4;
  const OTP_COOLDOWN = 120;
  const { resendOTP } = useContext(AuthContext);
  const { i18n } = useContext(TranslationContext);
  const [otpCooldown, setOtpCooldown] = useState(OTP_COOLDOWN);
  const hiddenNum2 = route.params.hiddenNumber;
  const [code, setCode] = useState("");
  const [pinReady, setPinReady] = useState(false);
  const { colors } = useTheme();
  const [resendStatus, setResendStatus] = useState(true);
  const [resendMsg, setResendMsg] = useState(i18n.t("auth.code-sent"));
  const request = useRequest();
  const { verifyOTP } = useAuth();
  const { userData, getUserInfo } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [hiddenNum, setHiddenNum] = useState(false);
  const ICON_SIZE = Math.min(width * 0.4, 120);
  const scaleFont = (size) => (width / 375) * size;
  const INPUT_MAX_WIDTH = 400;

  useEffect(() => {
    if (userData && userData.area_code && userData.phone_number) {
      const mobileNum = `${userData.area_code}${userData.phone_number}`;
      const _hiddenNum = mobileNum.replace(/\d(?=(?:\D*\d){4})/g, "*");

      setHiddenNum(_hiddenNum);
    } else {
      setHiddenNum(hiddenNum2);
    }

    return () => {};
  }, [userData?.phone_number, userData?.area_code]);

  const handleVerify = async (value) => {
    try {
      setIsLoading(true);
      const otp_details = { otp: value, app_id: config.APP_ID };

      const response = await request(
        "/v2/auth/verify",
        "post",
        otp_details
      ).catch(() => {
        console.log("OTP Failed", response);
      });

      if (response.success) {
        await getUserInfo();
        await verifyOTP();
      }
      if (!response) {
        handleCodeChange("");
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  // Android: auto-read the incoming OTP SMS (User Consent prompt) and submit it.
  // Paused while a verify request is in flight. No-ops on iOS, where the
  // CodeInputField's `oneTimeCode` keyboard autofill handles suggestions.
  useOtpAutoRead({
    length: MAX_CODE_LENGTH,
    enabled: !isLoading,
    onCode: (otp) => {
      setCode(otp); // populate the visible input boxes
      handleVerify(otp); // auto-submit to the server
    },
  });

  useEffect(() => {
    let isMounted = true;
    let subInterval = setInterval(() => {
      cooldownTimer(subInterval);
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(subInterval);
    };
  }, [resendStatus]);

  const cooldownTimer = (interval) => {
    if (resendStatus) {
      setOtpCooldown((prev) => {
        if (prev > 0) {
          return prev - 1;
        } else {
          setResendStatus(false);
          clearInterval(interval);
          return;
        }
      });
    } else {
      setOtpCooldown(OTP_COOLDOWN);
      clearInterval(interval);
    }
  };

  const handleResend = () => {
    resendOTP(userData.user_id).then((response) => {
      setCode("");
      setResendMsg(i18n.t("auth.code-sent2"));
      setResendStatus(true);
    });
  };

  const handleCodeChange = (value) => {
    setCode(value);
  };

  const handleMobileChange = () => {
    navigate("MobileChange");
  };

  return (
    <Background>
      <SafeArea style={{ alignItems: "center" }}>
        <KeyboardAwareScrollView
          behavior="position"
          style={{ flexGrow: 1, overflow: "hidden" }}
          contentContainerStyle={{
            paddingBottom: 32,
          }}
        >
          <View
            style={{
              height: "100%",
              alignItems: "center",
            }}
          >
            <IconBg>
              <StatusBar style="light" />
              <MaterialCommunityIcons
                color={colors.ui.secondary}
                size={ICON_SIZE}
                name="lock-open"
              />
            </IconBg>
            <BottomHalf>
              <View style={{ alignItems: "center" }}>
                <Label
                  style={{
                    color: "white",
                    fontSize: width * 0.08,
                    ...styles.fixMargin,
                  }}
                  weight="bold"
                >
                  {i18n.t("auth.account-verification")}
                </Label>

                <Label
                  style={{
                    color: "white",
                    fontSize: width * 0.04,
                    textAlign: "center",
                    ...styles.fixMargin,
                  }}
                  weight="regular"
                >
                  {i18n.t("auth.message", {
                    codeLength: MAX_CODE_LENGTH,
                    mobileNumber: `+${hiddenNum}`,
                  })}
                </Label>
                {/* <Label
                  style={{ color: "white", fontSize: width * 0.04 }}
                  weight="bold"
                >
                  +{mobileNum}
                </Label> */}
              </View>

              <TouchableOpacity onPress={handleMobileChange}>
                <Label
                  style={{
                    color: "white",
                    textDecorationLine: "underline",
                    ...styles.fixMargin,
                  }}
                  size="title"
                >
                  {i18n.t("update-mobile-number.header")}
                </Label>
              </TouchableOpacity>

              <View
                style={{ backgroundColor: "rgba(0,0,0,0)", marginBottom: 20 }}
              >
                <CodeInputField
                  codeInputBoxStyle={{ width: 60, height: 60 }}
                  codeInputTextStyle={{ fontSize: 30 }}
                  setPinReady={setPinReady}
                  setCode={handleCodeChange}
                  code={code}
                  pinReady={pinReady}
                  maxLength={MAX_CODE_LENGTH}
                  containerStyle={{
                    width: Math.min(width - 64, INPUT_MAX_WIDTH),
                  }}
                  inputBoxStyle={{ borderWidth: 4, borderRadius: 50 }}
                  onFulfill={(value) => {
                    handleVerify(value);
                  }}
                />
              </View>

              {isLoading ? (
                <ActivityIndicator animating={true} color="white" />
              ) : (
                <Label
                  style={{ color: pinReady ? "white" : colors.ui.lightGray }}
                  size="heading"
                  weight="medium"
                >
                  {i18n.t("auth.verify-code")}
                </Label>
              )}
              {/* <VerifyButton
                disabled={!(pinReady && !isLoading)}
                style={{
                  backgroundColor: pinReady
                    ? colors.ui.green
                    : colors.ui.lightGreen,
                }}
                onPress={handleVerify}
                activeOpacity={0.6}
              >
               
              </VerifyButton> */}

              {resendStatus ? (
                <Label
                  style={{ color: "#aaa", ...styles.fixMargin }}
                  size="title"
                >
                  {`${resendMsg} (${otpCooldown}s)`}
                </Label>
              ) : (
                <TouchableOpacity onPress={handleResend}>
                  <Label style={{ color: "white" }} size="title">
                    {i18n.t("auth.resend-code")}
                  </Label>
                </TouchableOpacity>
              )}
            </BottomHalf>
          </View>
        </KeyboardAwareScrollView>
      </SafeArea>
    </Background>
  );
};
