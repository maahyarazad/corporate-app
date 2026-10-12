import React, { useEffect, useRef, useState } from "react";
import {
  TouchableOpacity,
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import Animated from "react-native-reanimated";
import { useShakeAnimation } from "../../hooks/useShakeAnimation";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "styled-components/native";
import { SafeArea } from "../../components/safearea.component";
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
import { companyLogo, config } from "../../utils/constants";
import { PhoneInput } from "../../components/PhoneInput";
import { showToast } from "../../Toast";

const INITIAL_REGISTRATION_STATE = {
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
};

// Module-level cache so the entered form survives this screen unmounting.
// A stack pop (e.g. tapping "Login" to go back) unmounts RegistrationScreen,
// which would otherwise reset every field. Keeping the last state here lets the
// user return and continue where they left off. Reset via resetRegistrationState
// once registration actually completes.
let cachedRegistrationState = { ...INITIAL_REGISTRATION_STATE };

export const resetRegistrationState = () => {
  cachedRegistrationState = { ...INITIAL_REGISTRATION_STATE };
};

export const RegistrationScreen = () => {


  const theme = useTheme();
  const navigation = useNavigation();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [disable, setDisable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Seed from the module-level cache so returning to this screen restores the
  // previously entered data instead of starting blank.
  const [state, setState] = useState(cachedRegistrationState);

  // Keep the cache in sync with every edit so it's current when the screen
  // unmounts (navigating back) and is read again on the next mount.
  useEffect(() => {
    cachedRegistrationState = state;
  }, [state]);

  // Lock the user on this screen while the validate-details request is in
  // flight: disable the iOS swipe-back gesture, the Android hardware back
  // button, and any programmatic removal of the screen.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !isLoading });

    const backSub = BackHandler.addEventListener(
      "hardwareBackPress",
      () => isLoading // returning true swallows the back press while loading
    );

    const removeBeforeRemove = navigation.addListener("beforeRemove", (e) => {
      if (isLoading) {
        e.preventDefault();
      }
    });

    return () => {
      backSub.remove();
      removeBeforeRemove();
    };
  }, [navigation, isLoading]);

  const dateLimit = new Date();
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const emailRef = useRef(null);
  const expiryRef = useRef(null);
  const phoneRef = useRef(null);
  dateLimit.setFullYear(dateLimit.getFullYear() - 18);
  const [_isFutureExpiry, setIsFutureExpiry] = useState(false);
  const { shakeStyle, shake } = useShakeAnimation();

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

    // Guard against duplicate submissions while a request is already running.
    if (isLoading) return;
    if (!validateInfo()) return;

    try {
      setIsLoading(true);
      const data = {
        ...state,
      };
      const response = await UserService.validateDetails(data);

      if (response.success) {
        // Only advance after a successful server response.
        navigate("RegisterDetails", { login: data, services_data: response });
      } else {
        shake();
        showToast("error", "Validation Error", response.message);
      }
    } catch (error) {
      console.log("Validation Error:", error);
      shake();
      showToast("error", error?.title ?? "Server Error", error?.message);
    } finally {
      setIsLoading(false);
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

          <Animated.View style={[styles.safeArea, shakeStyle]}>
            <KeyboardAwareScrollView
              enableOnAndroid
              extraScrollHeight={20}
              extraHeight={120}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.keyboardAwareScrollViewContentContainer}
              style={styles.keyboardAwareScrollView}
            >
                <View style={styles.flexBox}>

              <View style={styles.row}>
                <TouchableOpacity
                  onPress={goback}
                  disabled={isLoading}
                  style={[styles.rowCenter, { opacity: isLoading ? 0.5 : 1 }]}
                  activeOpacity={0.5}
                >
                  <Ionicons name="arrow-back" size={35} color="#eee" />
                  <Label size="body" weight="bold" style={styles.label}>
                    Login
                  </Label>
                </TouchableOpacity>
              </View>

              <CustomTextInput
                ref={usernameRef}
                value={state.username}
                style={styles.customTextInput}
                onChangeText={handleUsernameChange}
                label="Username *"
                error={isSubmitted && state.username.trim() === ""}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              <CustomTextInput
                ref={passwordRef}
                value={state.password}
                style={styles.customTextInput}
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
                style={styles.customTextInput}
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
                style={styles.customTextInput}
                value={state.email}
                ref={emailRef}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                error={isSubmitted && state.email.trim() === ""}
                returnKeyType="next"
              />

              <PhoneInput
                defaultCode={state.mobileCountry || "AE"}
                value={state.mobile}
                placeholder="541234567"
                onChangeText={handleMobileChange}
                onChangeCountry={handleMobileCountryChange}
                onChangeFormattedText={(e164) => console.log("E164:", e164)}
                error={
                  isSubmitted && state.mobile.trim() === ""
                    ? "Mobile is required"
                    : null
                }
                containerStyle={[
                  styles.phoneInputContainer,
                  {
                    borderColor:
                      isSubmitted && state.mobile.trim() === ""
                        ? "red"
                        : "#00000099",
                  },
                ]}
                textContainerStyle={styles.phoneInputTextContainer}
                textInputStyle={styles.phoneInputTextInput}
                textInputProps={{
                  selectionColor: "#a6cdfb",
                }}
              />

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={nextPage}
                disabled={isLoading}
                style={[
                  styles.centerBox,
                  {
                    backgroundColor: theme.colors.ui.button,
                    opacity: isLoading ? 0.7 : 1,
                  },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Label style={styles.label2} size="body" weight="bold">
                    Next
                  </Label>
                )}
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
  keyboardAwareScrollViewContentContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  keyboardAwareScrollView: {
    flex: 1,
  },
  flexBox: {
    flex: 1,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    marginBottom: 16,
    marginTop: 10,
  },
  label: {
    color: "#dfdfdf",
    justifyContent: "center",
  },
  customTextInput: {
    marginTop: 8,
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
  label2: {
    color: "white",
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  phoneInputContainer: {
    borderRadius: 5,
    width: "100%",
    height: 60,
    borderWidth: 2,
    marginTop: 8,
  },
  centerBox: {
    height: 55,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 8,
  },
});
