import React, { useEffect, useState } from "react";
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { useShakeAnimation } from "../../hooks/useShakeAnimation";
import { showToast } from "../../Toast";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Button } from "react-native-paper";

import Background from "../../components/background/background.component";
import { CustomTextInput } from "../../components/customTextInput";
import { SafeArea } from "../../components/safearea.component";

import { Label } from "../../components/typography/label.component";
import { useTheme } from "styled-components/native";
import { Ionicons } from "@expo/vector-icons";
import { navigate, goback } from "../../navigation/navigate";
import { UserService } from "../../services/user/user.service";
import { LoadingOverlay } from "../../components/loading/loading.component";
import { config } from "../../utils/constants";
import { PhoneInput } from "../../components/PhoneInput";
// Draft of the forgot-password inputs, kept at module scope so the fields
// survive leaving and re-entering the screen (e.g. an accidental trip back to
// Login). Cleared on a successful submit. Module scope is deliberate: it
// outlives the component without a provider, and this form has a single
// instance in the navigator.
const DRAFT_DEFAULTS = { login: "", mobile: "", mobileCode: "971", mobileCountry: "AE" };
let draft = { ...DRAFT_DEFAULTS };

export const ForgotPasswordScreen = () => {
  const [mobile, setMobile] = useState(draft.mobile);
  const [mobileCode, setMobileCode] = useState(draft.mobileCode);
  const [mobileCountry, setMobileCountry] = useState(draft.mobileCountry);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [login, setLogin] = useState(draft.login);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const { shakeStyle, shake } = useShakeAnimation();

  // Keep the module-level draft in step with the inputs so it is current if the
  // screen unmounts (back to Login) and remounts.
  useEffect(() => {
    draft = { login, mobile, mobileCode, mobileCountry };
  }, [login, mobile, mobileCode, mobileCountry]);

  // Pop back to the already-mounted Login (preserving its username/password and
  // playing the reverse slide) instead of pushing a fresh Login instance.
  const handleBack = () => {
    goback();
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitted(true);

      if (login.trim() === "" || mobile.trim() === "") {
        showToast("error", "Invalid", "Some fields are empty.");
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

      if (result.success) {
        setLoading(false);

        // Submitted to the server: clear the preserved draft so a later visit
        // starts empty.
        draft = { ...DRAFT_DEFAULTS };

        navigate("ForgotPasswordOTP", {
          mobileCode,
          mobile,
          login,
          user_id: result.data.user_id,
        });
      } else {
        setLoading(false);
        showToast("error", result.title, result.message);
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
          contentContainerStyle={styles.keyboardAwareScrollViewContentContainer}
        >
          <LoadingOverlay display={loading} />
          <Animated.View style={[styles.container, shakeStyle]}>
            <View style={styles.row}>
              <View style={styles.fill}>
                <TouchableOpacity
                  onPress={handleBack}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",...styles.marginFix
                  }}
                  activeOpacity={0.5}
                >
                  <Ionicons name="arrow-back" size={35} color="#eee" />
                  <Label size="title" weight="bold" style={styles.label}>
                    Login
                  </Label>
                </TouchableOpacity>
                

                <Label
                  size="title"
                  weight="bold"
                  style={{ color: "white" ,...styles.marginFix}}
                >
                  Forgot Password
                </Label>
                
                <Label
                  size="body"
                  weight="medium"
                  style={{ color: "white",...styles.marginFix }}
                >
                  Please provide the following information
                </Label>
              </View>
            </View>

            <CustomTextInput
              value={login}
              onChangeText={setLogin}
              style={{ width: "100%", height: 65,...styles.marginFix }}
              label="Username or Email *"
              error={login.trim() === "" && isSubmitted}
            ></CustomTextInput>
            
              <PhoneInput
                            defaultCode={mobileCountry}
                            value={mobile}
                            placeholder="541234567"
                            onChangeText={(prev) => {
                setMobile(prev.replace(/[^0-9]/g, ``));
              }}
                            onChangeCountry={(country)=>{
                                 setMobileCountry(country.cca2);
                                setMobileCode(country.callingCode);
                            }}
                            onChangeFormattedText={(e164) => console.log("E164:", e164)}
                            error={
                              isSubmitted && mobile.trim() === ""
                                ? "Mobile is required"
                                : null
                            }
                            containerStyle={{
                              borderRadius: 5,
                              width: "100%",
                              height: 60,
                              borderWidth: 2,
                              borderColor:
                                isSubmitted && mobile.trim() === ""
                                  ? "red"
                                  : "#00000099",
                              ...styles.marginFix
                            }}
                            textContainerStyle={styles.phoneInputTextContainer}
                            textInputStyle={styles.phoneInputTextInput}
                            textInputProps={{
                              selectionColor: "#a6cdfb",
                            }}
                          />
{/* 
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
            /> */}
            
            <Button
              mode="contained"
              onPress={handleSubmit}
              contentStyle={[
                styles.buttonContent,
                {
                  backgroundColor: theme.colors.ui.yellowGold,
                },
              ]}
              style={styles.button}
              labelStyle={styles.buttonLabel}
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

  marginFix:{
    marginBottom:8
  },
  keyboardAwareScrollViewContentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "flex-start",
    width: "100%",
    paddingVertical: 16,
  },
  fill: {
    flex: 1,
  },
  label: {
    color: "#dfdfdf",
    justifyContent: "center",
  },
  phoneInputTextContainer: {
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    backgroundColor: "white",
    paddingVertical: 0,
  },
  phoneInputTextInput: {
    color: "black",
    fontSize: 16,
  },
  button: {
    width: "100%",
  },
  buttonLabel: {
    fontSize: 16,
  },
  buttonContent: {
    width: "100%",
    paddingVertical: 8,
  },
});
