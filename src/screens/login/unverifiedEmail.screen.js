import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useContext, useRef, useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Button } from "react-native-paper";
import Background from "../../components/background/background.component";
import { SafeArea } from "../../components/safearea.component";
import { Spacer } from "../../components/spacer/spacer.component";
import { Label } from "../../components/typography/label.component";
import { theme } from "../../infrastructure/theme";
import { goback, navigate } from "../../navigation/navigate";
import { TranslationContext } from "../../services/translation/translation.context";
import { UserService } from "../../services/user/user.service";
import { width } from "../../components/styles";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export const UnverifiedEmailScreen = ({ route }) => {
  const { userId } = route.params;
  const [useVerification, setUseVerification] = useState(false);
  const [resendStatus, setResendStatus] = useState(false);
  const { i18n } = useContext(TranslationContext);

  const handleResend = async () => {
    console.log(userId);
    setResendStatus(true);
    const response = await UserService.resendEmailVerification(userId);
    // console.log(response);
  };

  const handleEmailChange = async () => {
    console.log("Change email");
    navigate("EmailChange", { userId });
  };

  const handleUseVerification = () => {
    setUseVerification(true);
  };

  const InputVerificationCode = () => {
    const [code, setCode] = useState("");
    const inputRef = useRef(null);
    const MAX_DIGIT = 6;

    const InputDigit = ({ value }) => {
      return (
        <TouchableWithoutFeedback onPress={onPress}>
          <View
            style={{
              backgroundColor: "white",
              width: Math.min(width * 0.1),
              aspectRatio: 0.9,
              borderRadius: 6,
              justifyContent: "center",
              alignItems: "center",
              borderColor: value ? theme.colors.icons.active : "#ccc",
              borderWidth: 2,
            }}
          >
            <Label weight={"bold"} size={20}>
              {value}
            </Label>
          </View>
        </TouchableWithoutFeedback>
      );
    };

    const onPress = () => {
      inputRef.current.focus();
    };

    const onChangeCode = (text) => {
      setCode(text);
    };

    return (
      <View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {Array(MAX_DIGIT)
            .fill(null)
            .map((_, index) => {
              return <InputDigit key={index} value={code[index]} />;
            })}
        </View>

        <TextInput
          ref={inputRef}
          style={{
            backgroundColor: "red",
            width: 1,
            height: 1,
            position: "absolute",
            zIndex: -1,
            left: 5,
            top: 5,
          }}
          onChangeText={onChangeCode}
          maxLength={MAX_DIGIT}
          keyboardType="number-pad"
        />
      </View>
    );
  };

  return (
    <Background>
      <SafeArea>
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps={"always"}
          contentContainerStyle={styles.container}
        >
          <View
            style={{ padding: 24, backgroundColor: "white", borderRadius: 100 }}
          >
            <MaterialCommunityIcons
              name="email-remove"
              size={100}
              color="red"
            />
          </View>
          <Spacer position={"top"} size="large" />
          <View style={{ width: "100%", paddingHorizontal: 32 }}>
            <Label
              style={{ color: "white", textAlign: "center" }}
              size={"title"}
              weight={"medium"}
            >
              {i18n.t("email-verification.text")}
            </Label>
          </View>
          <Spacer position={"top"} size="large" />
          <TouchableOpacity onPress={handleEmailChange}>
            <Label
              style={{ color: "white", textDecorationLine: "underline" }}
              size={"title"}
            >
              {i18n.t("update-email.header")}
            </Label>
          </TouchableOpacity>
          <Spacer position={"top"} size="large" />
          {useVerification && (
            <>
              <InputVerificationCode />
              <Spacer position={"top"} size="large" />
            </>
          )}
          <Button
            onPress={goback}
            style={{ borderRadius: 10 }}
            buttonColor={theme.colors.icons.active}
            contentStyle={{ paddingVertical: 8, paddingHorizontal: 16 }}
            mode="contained"
          >
            <Label size={"body"} weight={"bold"} color={"white"}>
              {i18n.t("email-verification.button")}
            </Label>
          </Button>
          <Spacer position={"top"} size="large" />
          {!resendStatus ? (
            <TouchableOpacity onPress={handleResend}>
              <Label
                style={{ color: "white", textDecorationLine: "underline" }}
                size={"subtitle"}
                weight={"regular"}
              >
                {i18n.t("email-verification.link")}
              </Label>
            </TouchableOpacity>
          ) : (
            <Label
              style={{ color: "#aaa" }}
              size={"subtitle"}
              weight={"regular"}
            >
              {i18n.t("email-verification.link-pressed")}
            </Label>
          )}
          {false && !useVerification && (
            <>
              <Spacer position={"top"} size="medium" />

              <TouchableOpacity onPress={handleUseVerification}>
                <Label
                  style={{ color: "white", textDecorationLine: "underline" }}
                  size={"subtitle"}
                  weight={"regular"}
                >
                  Use Verification Code
                </Label>
              </TouchableOpacity>
            </>
          )}
        </KeyboardAwareScrollView>
      </SafeArea>
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
