import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  TouchableOpacity,
  View,
  Image,
  StyleSheet,
  Animated,
  Easing,
  Vibration,
} from "react-native";
import { useTheme } from "styled-components/native";
import { SafeArea } from "../../components/safearea.component";
import { Spacer } from "../../components/spacer/spacer.component";
import { Label } from "../../components/typography/label.component";
import Background from "../../components/background/background.component";
import { goback, navigate } from "../../navigation/navigate";
import { Ionicons } from "@expo/vector-icons";
import { CustomTextInput } from "../../components/customTextInput";

import { UserService } from "../../services/user/user.service";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  validateCardExpiryDate,
  isFutureExpiry,
} from "../../utils/validateCardExpiryDate";
import { isValidEmail } from "../../utils/isEmailValid";
import { PartnerPicker } from "../../components/partnerPicker";
import { PartnerService } from "../../services/location/location.service";
import { companyLogo, config } from "../../utils/constants";
import { DropDown } from "../../components/DropDown";
import { PhoneInput } from "../../components/PhoneInput";
import { showToast } from "../../Toast";

export const RegistrationScreen = () => {


  const theme = useTheme();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [disable, setDisable] = useState(false);
  const [state, setState] = useState({
    username: "",
    password: "",
    cpassword: "",
    email: "",
    mobile: "",
    mobileCode: "971",
    mobileCountry: "AE",
    partner_id: null,
    app_id: config.APP_ID,
    card_valid_date: "",
    miscellaneous: undefined,
  });

  const dateLimit = new Date();
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const emailRef = useRef(null);
  const expiryRef = useRef(null);
  const phoneRef = useRef(null);
  dateLimit.setFullYear(dateLimit.getFullYear() - 18);
  const [_isFutureExpiry, setIsFutureExpiry] = useState(false);
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

  const validateInfo = () => {
    const username = state.username.trim();
    // Passwords are NOT trimmed: spaces can be valid characters, and trimming
    // here previously made length/match checks disagree with what was typed.
    const password = state.password;
    const cpassword = state.cpassword;
    const email = state.email.trim();
    const mobile = state.mobile.trim();

    console.log("[validateInfo] field lengths:", {
      username: username.length,
      password: password.length,
      cpassword: cpassword.length,
      email: email.length,
      mobile: mobile.length,
      passwordsEqual: password === cpassword,
    });

    if (
      username === "" ||
      password === "" ||
      cpassword === "" ||
      email === "" ||
      mobile === ""
    ) {
      shake();
      showToast("error", "Empty Fields", "Some fields are empty.");
      return false;
    }

    if (username.length < 8) {
      shake();
      showToast(
        "error",
        "Username too short",
        "Username must be at least 8 characters long"
      );
      return false;
    }

    // Check each password field on its own so the message points at the
    // correct field (the old combined check blamed "Password" for a short
    // Confirm Password).
    if (password.length < 8) {
      shake();
      showToast(
        "error",
        "Password too short",
        "Password must be at least 8 characters long!"
      );
      return false;
    }

    if (cpassword.length < 8) {
      shake();
      showToast(
        "error",
        "Confirm Password too short",
        "Confirm Password must be at least 8 characters long!"
      );
      return false;
    }

    if (password !== cpassword) {
      shake();
      showToast(
        "error",
        "Passwords do not match",
        "Password and Confirm Password must be the same."
      );
      return false;
    }

    if (!isValidEmail(email.toLowerCase())) {
      shake();
      showToast(
        "error",
        "Invalid Email",
        "The email you have entered is invalid"
      );
      return false;
    }

    if (!mobile) {
      shake();
      showToast("error", "Mobile is required");
      return false;
    }

    return true;
  };

  const handlePartnerChange = (partnerId) => {
    setState({ ...state, partner_id: partnerId });
  };

  const handleUsernameChange = (prev) => {
    setState({ ...state, username: prev.replace(/[\s+]/g, ``) });
  };

  const handlePasswordChange = (prev) => {
    setState({ ...state, password: prev });
  };

  const handlCPasswordChange = (prev) => {
    setState({ ...state, cpassword: prev });
  };

  const handleEmailChange = (prev) => {
    setState({ ...state, email: prev });
  };

  const handleMobileCountryChange = (country) => {
    setState({
      ...state,
      mobileCountry: country.cca2,
      mobileCode: country.callingCode,
    });
  };
  const handleMisc = (prev) => {
    setState({ ...state, miscellaneous: prev });
  };

  const handleValidityChange = (prev) => {
    const value = validateCardExpiryDate(state.card_valid_date, prev);
    const expiryValue = isFutureExpiry(value);
    setIsFutureExpiry(expiryValue);

    setState({
      ...state,
      card_valid_date: value,
    });
  };

  const handleMobileChange = (prev) => {
    setState({ ...state, mobile: prev.replace(/[^0-9]/g, ``) });
  };

  const nextPage = async () => {
    setIsSubmitted(true);

    if (validateInfo()) {
      try {
        const data = {
          ...state,
        };
        const response = await UserService.validateDetails(data);
        
        if (response.success) {
          navigate("RegisterDetails", { login: data, services_data: response});
        } else {
          shake();
          showToast("error", "Validation Error", response.message);
        }
      } catch (error) {
        console.log("Validation Error:", error);
        shake();
        showToast("error", "Server Error", error);
      }
    }
  };

  const [partnerList, setPartnerList] = useState([]);

//   const getPartners = useCallback(async () => {
//     try {
        
        
//       const response = await PartnerService.getPartners();

//       if (response.success) {
//         setPartnerList(response.data);
//       }
//     } catch (error) {
//       console.log(error);
//       showToast("error", "Server Error");
//     }
//   }, []);

//   useEffect(() => {
//     getPartners();
//   }, [getPartners]);

  return (
    <>
      <Background>
        <SafeArea style={styles.safeArea}>
          <Image style={styles.companyLogo} source={companyLogo} />

          <Animated.View style={[styles.safeArea, shakeAnimatedStyle]}>
            <KeyboardAwareScrollView
              enableOnAndroid
              extraScrollHeight={20}
              extraHeight={120}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                flexGrow: 1,
                paddingHorizontal: 16,
                paddingBottom: 40,
              }}
              style={{ flex: 1 }}
            >
                <View style={{flex: 1, justifyContent:'center'}}>

              <View
                style={{
                  flexDirection: "row",
                  
                  marginBottom: 16,
                  marginTop: 10,
                }}
              >
                <TouchableOpacity
                  onPress={goback}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  activeOpacity={0.5}
                >
                  <Ionicons name="arrow-back" size={35} color="#eee" />
                  <Label
                    size="body"
                    weight="bold"
                    style={{ color: "#dfdfdf", justifyContent: "center" }}
                  >
                    Login
                  </Label>
                </TouchableOpacity>
              </View>

              <CustomTextInput
                ref={usernameRef}
                value={state.username}
                style={{ marginTop: 8 }}
                onChangeText={handleUsernameChange}
                label="Username *"
                error={isSubmitted && state.username.trim() === ""}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              <CustomTextInput
                ref={passwordRef}
                value={state.password}
                style={{ marginTop: 8 }}
                onChangeText={handlePasswordChange}
                label="Password *"
                error={
                  isSubmitted &&
                  (state.password.trim() === "" ||
                    state.password !== state.cpassword)
                }
                secureTextEntry={true}
                showEye={true}
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              />

              <CustomTextInput
                ref={confirmPasswordRef}
                value={state.cpassword}
                style={{ marginTop: 8 }}
                onChangeText={handlCPasswordChange}
                label="Confirm Password *"
                error={
                  isSubmitted &&
                  (state.cpassword.trim() === "" ||
                    state.cpassword !== state.password)
                }
                secureTextEntry={true}
                showEye={true}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />

              <CustomTextInput
                label="E-mail *"
                style={{ marginTop: 8 }}
                value={state.email}
                ref={emailRef}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                error={isSubmitted && state.email.trim() === ""}
                returnKeyType="next"
              />

              <PhoneInput
                defaultCode="AE"
                placeholder="541234567"
                onChangeText={handleMobileChange}
                onChangeCountry={handleMobileCountryChange}
                onChangeFormattedText={(e164) => console.log("E164:", e164)}
                error={
                  isSubmitted && state.mobile.trim() === ""
                    ? "Mobile is required"
                    : null
                }
                containerStyle={{
                  borderRadius: 5,
                  width: "100%",
                  height: 60,
                  borderWidth: 2,
                  borderColor:
                    isSubmitted && state.mobile.trim() === ""
                      ? "red"
                      : "#00000099",
                  marginTop: 8,
                }}
                textContainerStyle={{
                  borderTopRightRadius: 5,
                  borderBottomRightRadius: 5,
                  backgroundColor: "white",
                  paddingVertical: 0,
                }}
                textInputStyle={{
                  color: "black",
                  fontSize: 16,
                }}
                textInputProps={{
                  selectionColor: "#a6cdfb",
                }}
              />

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={nextPage}
                style={{
                  height: 55,
                  backgroundColor: theme.colors.ui.button,
                  borderRadius: 5,
                  justifyContent: "center",
                  alignItems: "center",
                  marginVertical: 8,
                }}
              >
                <Label style={{ color: "white" }} size="body" weight="bold">
                  Next
                </Label>
              </TouchableOpacity>
                </View>
            </KeyboardAwareScrollView>
          </Animated.View>
        </SafeArea>
      </Background>
    </>
  );
};

const styles = StyleSheet.create({
  companyLogo: {
    width: 100,
    height: 50,
    resizeMode: "contain",
    marginLeft: 16,
    position: "relative",
    top: 0,
  },
  safeArea: {
    flex: 1,
    justifyContent: "flex-start",
  },
});
