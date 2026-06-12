import React, { useEffect, useRef, useState } from "react";
import {
  TouchableOpacity,
  View,
  Image,
  StyleSheet,
  Animated,
  Easing,
  Vibration,
  Keyboard,
  Pressable,
  TouchableWithoutFeedback,
  Platform,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import { companyLogo, honorificList } from "../../utils/constants";
import { useTheme } from "styled-components/native";
import { Button, TextInput } from "react-native-paper";
import { SafeArea } from "../../components/safearea.component";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Label } from "../../components/typography/label.component";
import { showToast } from "../../Toast";

import Background from "../../components/background/background.component";
import { goback, navigate } from "../../navigation/navigate";
import { UserService } from "../../services/user/user.service";
import { Ionicons } from "@expo/vector-icons";
import { CustomTextInput } from "../../components/customTextInput";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import moment from "moment";
import { CustomModal } from "../../components/modal/customModal.component";
import { getRecaptchaToken } from "../../services/recaptcha/recaptcha.service";
import { resetRegistrationState } from "./registration.screen";

import { DropDown } from "../../components/DropDown";
import { BirthdatePicker } from "../../components/BirthdatePicker";
import { NationalityInput } from "../../components/NationalityInput";
import { getDeviceInfo } from "../../services/auth/auth.service";
const genderItems = [
  { label: "Select Gender", value: "" },
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
];

// Button label shown while the registration request is in flight. The text stays
// static while only the trailing dots animate (0→3). The dots live in a
// fixed-width slot so the text never shifts position as they change. It only
// renders while loading, so the interval starts and stops with the loading state.
const SubmittingLabel = () => {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Label style={{ color: "white", paddingHorizontal: 2 }} size="body" weight="bold">
        Creating Your Account
      </Label>
      <Label
        style={{ color: "white", width: 22, textAlign: "left" }}
        size="body"
        weight="bold"
      >
        {dots}
      </Label>
    </View>
  );
};

export const RegistrationDetailsScreen = ({ route }) => {
    

  const theme = useTheme();
  const navigation = useNavigation();
  const [showCountries, setShowCountries] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dateLimit = new Date();
  dateLimit.setFullYear(dateLimit.getFullYear() - 18);
  const [showBdayModal, setShowBdayModal] = useState(false);
  const [tempBday, setTempBday] = useState(dateLimit);

  const [state, setState] = useState({
    honorifics: "",
    firstname: "",
    middlename: "",
    lastname: "",
    nationality: "United Arab Emirates",
    birthdate: null,
    gender: "",
  });

  // Lock the user on this screen while a submission is in flight. Blocks every
  // way to leave: the iOS swipe-back gesture, the Android hardware back button,
  // and any programmatic/header navigation away from the screen.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !isLoading });

    const backSub = BackHandler.addEventListener(
      "hardwareBackPress",
      // Returning true swallows the back press while loading.
      () => isLoading
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

  const firstname = useRef(null);
  const lastname = useRef(null);
  const middlename = useRef(null);
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

  const sendCaptcha = async () => {
    console.log("[Register] sendCaptcha pressed");
    setIsSubmitted(true);

    // Prevent multiple submissions while a request is already in flight.
    if (isLoading) {
      console.log("[Register] ignored: already loading");
      return;
    }
    if (!validateInfo()) {
      console.log("[Register] aborted: validation failed");
      return;
    }

    const misc = route.params.login.miscellaneous;
    console.log("[Register] miscellaneous:", misc);
    if (misc !== undefined) {
      console.log("[Register] aborted: misc is defined, not requesting captcha");
      return;
    }

    try {
      setIsLoading(true);
      console.log("[Register] requesting reCAPTCHA token...");
      // reCAPTCHA Enterprise runs natively (no WebView) and returns a token.
      const token = await getRecaptchaToken("register");
      console.log(
        "[Register] token received:",
        token ? `${token.substring(0, 12)}... (len ${token.length})` : token
      );
      if (!token) {
        throw new Error("Could not verify reCAPTCHA. Please try again.");
      }
      await submit(token);
    } catch (err) {
      console.log("[Register] sendCaptcha error:", err?.message, err);
      showToast("error", "Error", err?.message || "Something went wrong.");
    } finally {
      console.log("[Register] sendCaptcha finished, clearing loading");
      setIsLoading(false);
    }
  };

  // The required fields for registration. Safe against undefined/empty values.
  const hasRequiredFields =
    (state.firstname || "").trim() !== "" &&
    (state.lastname || "").trim() !== "" &&
    state.birthdate != null &&
    state.birthdate !== "";

  // A red border that stays visible even while the field is focused (the shared
  // CustomTextInput only shows its own red border when blurred). Same idea as
  // the mobile field in registration.screen.js.
  const requiredBorderStyle = (isEmpty) =>
    isSubmitted && isEmpty
      ? { borderWidth: 2, borderRadius: 4, borderColor: "red" }
      : undefined;

  const validateInfo = () => {
    if (!hasRequiredFields) {
      shake();
      showToast("error", "Empty Fields", "Please fill in all required fields.");
      return false;
    }

    return true;
  };

 const submit = async (token) => {
  console.log("[Register] submit() called with token:", token ? "present" : "MISSING");
  try {
    const register1 = route.params.login;
    const platform = Platform.OS;
    console.log("[Register] fetching device info...");
    const deviceInfo = await getDeviceInfo();
    console.log("[Register] device info:", deviceInfo);

    const user = {
      ...register1,
      ...state,
      birthdate: state.birthdate.toDateString(),
      gender: state.gender.charAt(0),
      token,
      device_info: deviceInfo,
      platform,
    };

    console.log("[Register] POST user/register payload:", JSON.stringify(user));
    const result = await UserService.createUser(user);
    console.log("[Register] createUser response:", JSON.stringify(result));

    if (result) {
      // Registration completed — clear the preserved first-step form so a
      // future registration starts blank (and no password lingers in memory).
      resetRegistrationState();
      if (result?.redCard) {
        console.log("[Register] navigating to RegisterSuccessByServices");
        navigate("RegisterSuccessByServices");
      } else {
        console.log("[Register] navigating to RegisterSuccess");
        navigate("RegisterSuccess");
      }
    } else {
      console.log("[Register] result was falsy, no navigation:", result);
    }
  } catch (err) {
    console.log("[Register] submit error:", err?.message, err?.response?.data, err);
    showToast("error", "Error", err.message);
  } finally {
    setIsLoading(false);
  }
};

  const handleFirstNameChange = (value) => {
    setState({ ...state, firstname: value });
  };

  const handleMiddleNameChange = (value) => {
    setState({ ...state, middlename: value });
  };

  const handleLastNameChange = (value) => {
    setState({ ...state, lastname: value });
  };


useEffect(() => {
  const services_data = route.params?.services_data?.services;
  // Only prefill when we actually have data; an empty {} must not overwrite
  // the fields with undefined (which crashed validateInfo on `.trim()`).
  if (services_data && Object.keys(services_data).length > 0) {
    setState((prev) => ({
      ...prev,
      firstname: services_data.firstname ?? prev.firstname,
      lastname: services_data.lastname ?? prev.lastname,
      birthdate: services_data.birthday
        ? new Date(services_data.birthday)
        : prev.birthdate,
    }));
  }
}, []);
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
              <View style={{ flex: 1, justifyContent: "center" }}>
                <View
                  style={{
                    flexDirection: "row",
                    marginBottom: 16,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      Keyboard.dismiss;
                      goback();
                    }}
                    disabled={isLoading}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      opacity: isLoading ? 0.5 : 1,
                    }}
                    activeOpacity={0.5}
                  >
                    <Ionicons name="arrow-back" size={35} color="#eee" />
                    <Label
                      size="body"
                      weight="bold"
                      style={{ color: "#dfdfdf", justifyContent: "center" }}
                    >
                      Go Back to Registration Data
                    </Label>
                  </TouchableOpacity>
                </View>

                <View style={styles.formControl}>
                  <DropDown
                    items={honorificList.map((item) => ({
                      label: item,
                      value: item,
                    }))}
                    onChange={(e) =>
                      setState((prev) => ({ ...prev, honorifics: e }))
                    }
                    openBelow={true}
                    placeholder="Salutation"
                    //   error={!state.honorifics && isSubmitted}
                  />

                  <View
                    style={{ zIndex: 2, position: "relative", width: "100%" }}
                  ></View>
                </View>

                <View
                  style={{
                    ...styles.formControl,
                    marginTop: 2,
                  }}
                >
                  <CustomTextInput
                    ref={firstname}
                    value={state.firstname}
                    onChangeText={handleFirstNameChange}
                    label="First Name *"
                    error={isSubmitted && (state.firstname || "").trim() === ""}
                    style={requiredBorderStyle(
                      (state.firstname || "").trim() === ""
                    )}
                    onSubmitEditing={() => middlename.current?.focus()}
                  />
                </View>

                <View style={styles.formControl}>
                  <CustomTextInput
                    ref={middlename}
                    value={state.middlename}
                    onChangeText={handleMiddleNameChange}
                    label="Middle Name"
                    onSubmitEditing={() => lastname.current?.focus()}
                  />
                </View>

                <View style={styles.formControl}>
                  <CustomTextInput
                    ref={lastname}
                    value={state.lastname}
                    onChangeText={handleLastNameChange}
                    onSubmitEditing={Keyboard.dismiss}
                    label="Last Name *"
                    error={isSubmitted && (state.lastname || "").trim() === ""}
                    style={requiredBorderStyle(
                      (state.lastname || "").trim() === ""
                    )}
                  />
                </View>

                <View style={styles.formControl}>
                  <NationalityInput
                    value={state.nationality}
                    onChange={(value) =>
                      setState((prev) => ({ ...prev, nationality: value }))
                    }
                  />
                </View>

                <View
                  style={{
                    ...styles.formControl,
                    marginTop: 2,
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <BirthdatePicker
                      value={state.birthdate}
                      onChange={(date) =>
                        setState((prev) => ({ ...prev, birthdate: date }))
                      }
                      error={!state.birthdate && isSubmitted}
                    />
                  </View>

                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <DropDown
                      items={genderItems}
                      onChange={(e) =>
                        setState((prev) => ({ ...prev, gender: e }))
                      }
                      placeholder="Gender"
                      // error={!state.gender && isSubmitted}
                    />
                  </View>
                </View>

                {/* reCAPTCHA Enterprise is a native module (no UI element). */}

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={sendCaptcha}
                  disabled={isLoading || !hasRequiredFields}
                  style={{
                    height: 60,
                    backgroundColor: theme.colors.ui.button,
                    borderRadius: 5,
                    justifyContent: "center",
                    alignItems: "center",
                    marginVertical: 2,
                    opacity: isLoading || !hasRequiredFields ? 0.5 : 1,
                  }}
                >
                  {isLoading ? (
                    <SubmittingLabel />
                  ) : (
                    <Label
                      style={{ color: "white" }}
                      size="body"
                      weight="bold"
                    >
                      Next
                    </Label>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAwareScrollView>
          </Animated.View>
        </SafeArea>
      </Background>

      {/* Full-screen blur overlay shown from submit until the server responds.
          Blocks further taps so the form can't be submitted twice. */}
      {isLoading && (
        <BlurView
          intensity={70}
          tint="dark"
          style={styles.loadingOverlay}
          pointerEvents="auto"
        >
          <ActivityIndicator size="large" color="white" />
        </BlurView>
      )}
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
  },
  formControl: {
    height: 58,
    justifyContent: "center",
    position: "relative",
    marginBottom: 6,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
});
