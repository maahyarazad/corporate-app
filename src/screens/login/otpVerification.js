import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useContext, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { ActivityIndicator } from "react-native-paper";
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

export const OtpVerification = ({ route, navigation }) => {
  const MAX_CODE_LENGTH = 4;
  const { isLoading, verify, resendOTP, user } = useContext(AuthContext);
  const { i18n } = useContext(TranslationContext);

  const [code, setCode] = useState("");
  const [pinReady, setPinReady] = useState(false);
  const { colors } = useTheme();
  const { user_id, device_id } = user;
  const mobileNum = route.params.hiddenNumber;
  const [resendStatus, setResendStatus] = useState(false);

  const handleVerify = async () => {
    const otp_details = { otp: code, user_id, app_id: config.APP_ID };
    await verify(otp_details);
  };

  const handleResend = () => {
    resendOTP(user_id).then((response) => {});
    setResendStatus(true);
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
              height: height,
              alignItems: "center",
            }}
          >
            <TopHalf>
              <IconBg>
                <StatusBar style="dark" />
                <MaterialCommunityIcons
                  color={colors.ui.secondary}
                  size={width * 0.4}
                  name="lock-open"
                />
              </IconBg>
            </TopHalf>
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
                setCode={setCode}
                code={code}
                pinReady={pinReady}
                maxLength={MAX_CODE_LENGTH}
                containerStyle={{ width: width - 64 }}
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
                  {i18n.t("auth.code-sent")}
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
