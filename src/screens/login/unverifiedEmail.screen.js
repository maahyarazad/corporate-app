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
            style={[
              styles.centerBox,
              {
                width: Math.min(width * 0.1),
                borderColor: value ? theme.colors.icons.active : "#ccc",
              },
            ]}
          >
            <Label weight="bold" size={20}>
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
        <View style={styles.row}>
          {Array(MAX_DIGIT)
            .fill(null)
            .map((_, index) => {
              return <InputDigit key={index} value={code[index]} />;
            })}
        </View>

        <TextInput
          ref={inputRef}
          style={styles.textInput}
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
          keyboardShouldPersistTaps="always"
          contentContainerStyle={styles.container}
        >
          <View style={styles.bordered}>
            <MaterialCommunityIcons
              name="email-remove"
              size={100}
              color="red"
            />
          </View>
          
          

          <View style={styles.viewStyle}>
            <Label style={styles.label} size="title" weight="medium">
              {i18n.t("email-verification.text")}
            </Label>
          </View>

          
          
          <TouchableOpacity onPress={handleEmailChange} style={styles.viewStyle}>
            <Label style={styles.label2} size="title">
              {i18n.t("update-email.header")}
            </Label>
          </TouchableOpacity>
          
          
          {useVerification && (
           <View style={styles.viewStyle}>
              <InputVerificationCode />
              <View style={styles.spacer}/>
            </View>
          )}
          <Button
            onPress={goback}
            style={styles.viewStyleButton}
            buttonColor={theme.colors.icons.active}
            contentStyle={styles.buttonContent}
            mode="contained"
          >
            <Label size="body" weight="bold" color="white">
              {i18n.t("email-verification.button")}
            </Label>
          </Button>
        
          {!resendStatus ? (
            <TouchableOpacity onPress={handleResend} style={styles.viewStyle}>
              <Label style={styles.label2} size="subtitle" weight="regular">
                {i18n.t("email-verification.link")}
              </Label>
            </TouchableOpacity>
          ) : (
            <Label style={styles.label3} size="subtitle" weight="regular">
              {i18n.t("email-verification.link-pressed")}
            </Label>
          )}
          {false && !useVerification && (
            <View style={styles.viewStyle}>
              <View style={styles.spacer2}/>

              <TouchableOpacity onPress={handleUseVerification}>
                <Label style={styles.label2} size="subtitle" weight="regular">
                  Use Verification Code
                </Label>
              </TouchableOpacity>
            </View>
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
  viewStyle:{ paddingHorizontal: 32, paddingBottom: 20, paddingTop: 20},
  viewStyleButton:{  borderRadius: 10, paddingHorizontal: 32, marginBottom: 20},
  row: {
    flexDirection: "row",
    gap: 8,
  },
  textInput: {
    backgroundColor: "red",
    width: 1,
    height: 1,
    position: "absolute",
    zIndex: -1,
    left: 5,
    top: 5,
  },
  bordered: {
    padding: 24,
    backgroundColor: "white",
    borderRadius: 100,
  },
  label: {
    color: "white",
    textAlign: "center",
  },
  label2: {
    color: "white",
    textDecorationLine: "underline",
  },
  spacer: {
    marginTop: 10,
  },
  buttonContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  label3: {
    color: "#aaa",
  },
  spacer2: {
    marginTop: 8,
  },
  centerBox: {
    backgroundColor: "white",
    aspectRatio: 0.9,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
});
