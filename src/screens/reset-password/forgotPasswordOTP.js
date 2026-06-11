import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,Platform
} from "react-native";
import { showToast } from "../../Toast";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Background from "../../components/background/background.component";
import { CodeInputField } from "../../components/codeInputField";
import { SafeArea } from "../../components/safearea.component";

import { BottomHalf, VerifyButton } from "../../components/styles";
import { Label } from "../../components/typography/label.component";
import { colors } from "../../infrastructure/theme/colors";
import { navigate } from "../../navigation/navigate";
import { UserService } from "../../services/user/user.service";
import { config } from "../../utils/constants";

export const ForgotPasswordOTPScreen = ({ route }) => {
  const MAX_CODE_LENGTH = 6;
  const { mobileCode, mobile, user_id, login } = route.params;
  const { width } = Dimensions.get("window");
  const [pinReady, setPinReady] = useState(false);
  //   const [mobileNum, setMobileNum] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleResend = async () => {
    const data = {
      login,
      mobile,
      mobileCode,
      app_id: config.APP_ID,
    };

    const result = await UserService.requestForgetPass(data);
    if (!result.success) {
      showToast("error", result.title, result.message);
    }
  };

  const handleVerify = async () => {
    const data = {
      otp: code,
      mobileNum: `${mobileCode}${mobile}`,
      user_id,
    };

    console.log("USER ID:", user_id);

    setIsLoading(true);
    const response = await UserService.verifyForgetPass(data);
    if (isMounted.current) {
      if (response) {
        navigate("ChangePassword", { user_id });
        setIsLoading(false);
      } else {
        const { title = "Alert", message = "Something went wrong" } = response;
        setIsLoading(false);
        showToast("error", title, message);
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
          <BottomHalf
            style={{
              height: "100%",
              justifyContent: "center",
            }}
          >
            <View style={{ alignItems: "center" }}>
              <Label
                style={{ color: "white", marginBottom:10}}
                size="heading"
                weight="bold"
              >
                Verification Code Sent
              </Label>
              
              <Label
                style={{
                  color: "white",
                  fontSize: Math.min(width * 0.04),
                  textAlign: "center", lineHeight: Math.min(width * 0.04) * 1.4, marginBottom: 10
                }}
                weight="regular"
              >
                {`Please enter the ${MAX_CODE_LENGTH}-digit code sent to `}
                <Label
                  style={{ color: "white", fontSize: Math.min(width * 0.04) ,marginBottom:8}}
                  weight="bold"
                >
                  +
                  {`${mobileCode}${mobile}`.replace(/\d(?=(?:\D*\d){3})/g, "*")}
                </Label>" "
                to proceed
              </Label>
            </View>
            

            <CodeInputField
              setPinReady={setPinReady}
              setCode={setCode}
              code={code}
              pinReady={pinReady}
              maxLength={MAX_CODE_LENGTH}
              inputBoxStyle={{
                borderRadius: 6,
                width: 50,
                height: 50,
                borderColor: "#aaa",
              }}
              containerStyle={{
                marginTop: 4,
                justifyContent: "center",
                alignItems: "center",
              }}
            />
            {/* <TouchableOpacity activeOpacity={} */}
            <VerifyButton
              disabled={!pinReady}
              style={{
                backgroundColor: pinReady
                  ? colors.ui.green
                  : colors.ui.lightGreen,
                  marginBottom:8
              }}
              onPress={handleVerify}
              activeOpacity={0.6}
            >
              {isLoading ? (
                <ActivityIndicator animating={true} color="white" />
              ) : (
                <Label
                  style={{ color: pinReady ? "white" : colors.ui.gray - 500 }}
                  size="heading"
                  weight="medium"
                >
                  Verify Code
                </Label>
              )}
            </VerifyButton>
            
            <TouchableOpacity onPress={handleResend}>
              <Label style={{ color: "white" }} size="title">
                Resend Code
              </Label>
            </TouchableOpacity>
          </BottomHalf>
        </KeyboardAwareScrollView>
      </SafeArea>
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {},
});
