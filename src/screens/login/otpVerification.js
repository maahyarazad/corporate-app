import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useContext, useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { ActivityIndicator } from "react-native-paper";
import { sub } from "react-native-reanimated";
import { useTheme } from "styled-components";
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

export const OtpVerification = ({ route, navigation }) => {
  const MAX_CODE_LENGTH = 4;
  const OTP_COOLDOWN = 120;
  const { isLoading, verify, resendOTP } = useContext(AuthContext);
  const { i18n } = useContext(TranslationContext);
  const [otpCooldown, setOtpCooldown] = useState(OTP_COOLDOWN);
  const mobileNum = route.params.hiddenNumber;
  const [code, setCode] = useState("");
  const [pinReady, setPinReady] = useState(false);
  const { colors } = useTheme();
  const [resendStatus, setResendStatus] = useState(true);
  const [resendMsg, setResendMsg] = useState(i18n.t("auth.code-sent"));
  const request = useRequest();
  const { verifyOTP } = useAuth();
  const { userData, getUserInfo } = useUser();

  const handleVerify = async () => {
    try {
      const otp_details = { otp: code, app_id: config.APP_ID };

      const response = await request(
        "/v2/auth/verify",
        "post",
        otp_details
      ).catch(() => {
        console.log("OTP Failed", response);
      });

      if (response.success) {
        await verifyOTP();
      }

      if (!response) {
        handleCodeChange("");
      }
    } catch (error) {}
  };

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
      setResendMsg(i18n.t("auth.code-sent2"));
      setResendStatus(true);
    });
  };

  const handleCodeChange = (value) => {
    setCode(value);
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
            <Spacer position={"top"} size={"large"} />
            <IconBg>
              <StatusBar style="dark" />
              <MaterialCommunityIcons
                color={colors.ui.secondary}
                size={width * 0.4}
                name="lock-open"
              />
            </IconBg>
            <BottomHalf>
              <View style={{ alignItems: "center" }}>
                <Label
                  style={{ color: "white", fontSize: width * 0.08 }}
                  weight={"bold"}
                >
                  {i18n.t("auth.account-verification")}
                </Label>
                <Spacer position={"top"} size={"medium"} />
                <Label
                  style={{
                    color: "white",
                    fontSize: width * 0.04,
                    textAlign: "center",
                  }}
                  weight={"regular"}
                >
                  {i18n.t("auth.message", {
                    codeLength: MAX_CODE_LENGTH,
                    mobileNumber: `+${mobileNum}`,
                  })}
                </Label>
                {/* <Label
                  style={{ color: "white", fontSize: width * 0.04 }}
                  weight={"bold"}
                >
                  +{mobileNum}
                </Label> */}
              </View>
              <Spacer position={"top"} size={"medium"} />

              <CodeInputField
                setPinReady={setPinReady}
                setCode={handleCodeChange}
                code={code}
                pinReady={pinReady}
                maxLength={MAX_CODE_LENGTH}
                containerStyle={{ width: width - 64 }}
                inputBoxStyle={{ borderWidth: 4 }}
              />
              {/* <TouchableOpacity activeOpacity={} */}
              <VerifyButton
                disabled={!(pinReady && !isLoading)}
                style={{
                  backgroundColor: pinReady
                    ? colors.ui.green
                    : colors.ui.lightGreen,
                }}
                onPress={handleVerify}
                activeOpacity={0.6}
              >
                {isLoading ? (
                  <ActivityIndicator animating={true} color="white" />
                ) : (
                  <Label
                    style={{ color: pinReady ? "white" : colors.ui.lightGray }}
                    size={"heading"}
                    weight={"medium"}
                  >
                    {i18n.t("auth.verify-code")}
                  </Label>
                )}
              </VerifyButton>
              <Spacer position={"top"} size={"medium"} />
              {resendStatus ? (
                <Label style={{ color: "#aaa" }} size={"title"}>
                  {`${resendMsg} (${otpCooldown}s)`}
                </Label>
              ) : (
                <TouchableOpacity onPress={handleResend}>
                  <Label style={{ color: "white" }} size={"title"}>
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
