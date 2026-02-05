import React, { useEffect, useRef, useState } from "react";
import {
  TouchableOpacity,
  View,
  Image,
  StyleSheet,
  Animated,
  Easing,
  Alert,
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
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { UserService } from "../../services/user/user.service";
import PhoneInput from "react-native-phone-number-input";
import { validateCardExpiryDate } from "../../utils/validateCardExpiryDate";
import { isValidEmail } from "../../utils/isEmailValid";
import { PartnerPicker } from "../../components/partnerPicker";
import { PartnerService } from "../../services/location/location.service";
import { companyLogo, config } from "../../utils/constants";
// import { Button } from "react-native-paper";

export const RegistrationScreen = () => {
  const theme = useTheme();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPasswordMatch, setIsPasswordMatch] = useState(false);
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

  dateLimit.setFullYear(dateLimit.getFullYear() - 18);

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
    if (
      state.username.trim() === "" ||
      state.password.trim() === "" ||
      state.cpassword.trim() === "" ||
      state.email.trim() === "" ||
      state.mobile.trim() === "" ||
      state.partner_id == undefined ||
      state.card_valid_date === ""
    ) {
      shake();
      Alert.alert("Empty Fields", "Some fields are empty.");
      return false;
    }

    if (state.username.trim().length < 8) {
      shake();
      Alert.alert(
        "Username too short",
        "Username must be at least 8 characters long"
      );
      return false;
    }

    if (
      !(state.password.trim().length >= 8) ||
      !(state.cpassword.trim().length >= 8)
    ) {
      shake();
      Alert.alert(
        "Password too short",
        "Password must be at least 8 characters long!"
      );
      return false;
    }

    if (state.password !== state.cpassword) {
      shake();
      Alert.alert("Invalid Password", "Password does not match!");
      return false;
    }

    if (!isValidEmail(state.email)) {
      shake();
      Alert.alert("Invalid Email", "The email you have entered is invalid");
      return false;
    }

    setIsPasswordMatch(true);
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
    setState({
      ...state,
      card_valid_date: validateCardExpiryDate(state.card_valid_date, prev),
    });
  };

  const handleMobileChange = (prev) => {
    setState({ ...state, mobile: prev.replace(/[^0-9]/g, ``) });
  };

  const nextPage = () => {
    setIsSubmitted(true);

    if (validateInfo()) {
      const data = {
        ...state,
      };

      UserService.validateDetails(data).then((response) => {
        if (response.success) {
          navigate("RegisterDetails", { login: data });
        } else {
          shake();
          alert(response.message);
        }
      });
    }
  };

  const [partnerList, setPartnerList] = useState([]);
  useEffect(() => {
    let isMounted = true;

    const getPartners = async () => {
      try {
        const response = await PartnerService.getPartners();
        if (response.success && isMounted) {
          setPartnerList(response.data);
          // alert("eii");
          // console.log(response.data);
        } else {
          Alert.alert(
            "Error Occured",
            "There's a problem loading the partners"
          );
        }
      } catch (error) {
        console.log(error);
      }
    };

    getPartners();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <Background>
        <SafeArea style={styles.safeArea}>
          <Image style={styles.companyLogo} source={companyLogo} />

          <Animated.View style={[styles.safeArea, shakeAnimatedStyle]}>
            <KeyboardAwareScrollView
              // behavior={Platform.OS === "ios" ? "position" : ""}
              // behavior={Platform.OS === "ios" ? "height" : ""}
              automaticallyAdjustKeyboardInsets
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="always"
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "center",
              }}
              style={[
                {
                  paddingHorizontal: 16,
                  flexDirection: "column",
                  flex: 1,
                },
              ]}
            >
              {/* <ScrollView
                keyboardShouldPersistTaps="always"
                // keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
                style={{
                  height: "100%",
                  // flex: 1,
                }}
                contentContainerStyle={
                  {
                    // backgroundColor: "palegreen",
                  }
                }
              > */}
              <View
                style={{
                  flexDirection: "row",
                  marginBottom: 16,
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
                  <Ionicons name="arrow-back" size={35} color={"#eee"} />
                  <Label
                    size={"body"}
                    weight="bold"
                    style={{ color: "#dfdfdf", justifyContent: "center" }}
                  >
                    Login
                  </Label>
                </TouchableOpacity>
              </View>
              <Spacer position={"top"} size={"small"} />
              <CustomTextInput
                value={state.username}
                onChangeText={handleUsernameChange}
                label={"Username *"}
                error={isSubmitted && state.username.trim() === ""}
              />
              <Spacer position={"top"} size={"small"} />
              <CustomTextInput
                value={state.password}
                onChangeText={handlePasswordChange}
                label="Password *"
                error={
                  isSubmitted &&
                  state.password.trim() === "" &&
                  !isPasswordMatch
                }
                secureTextEntry={true}
                showEye={true}
              />
              <Spacer position={"top"} size={"small"} />
              <CustomTextInput
                value={state.cpassword}
                onChangeText={handlCPasswordChange}
                label="Confirm Password *"
                error={
                  isSubmitted &&
                  state.cpassword.trim() === "" &&
                  !isPasswordMatch
                }
                secureTextEntry={true}
                showEye={true}
              />
              <Spacer position={"top"} size={"small"} />
              <CustomTextInput
                label="Miscellaneous"
                value={state.miscellaneous}
                onChangeText={handleMisc}
                style={{ width: 0, height: 0 }}
              />
              <CustomTextInput
                label={"E-mail *"}
                value={state.email}
                onChangeText={handleEmailChange}
                keyboardType={"email-address"}
                error={isSubmitted && state.email.trim() === ""}
              />
              <Spacer position={"top"} size={"small"} />
              {/* <CustomTextInput
                maxLength={12}
                label={"IFZA Card Number *"}
                value={state.card_number}
                returnKeyType={"done"}
                keyboardType="numeric"
                onChangeText={handleCardNumberChange}
                error={isSubmitted && state.card_number.trim() === ""}
              />
              <Spacer position={"top"} size={"small"} /> */}
              <PartnerPicker
                data={partnerList}
                setPartner={handlePartnerChange}
                error={!state.partner_id && isSubmitted}
              />
              <Spacer position={"top"} size={"small"} />
              <CustomTextInput
                maxLength={5}
                label={"GEC Card Expiry Date *"}
                value={state.card_valid_date}
                returnKeyType={"done"}
                keyboardType="numeric"
                placeholder={"mm/yy"}
                onChangeText={handleValidityChange}
                error={isSubmitted && state.card_valid_date.trim() === ""}
              />
              <Spacer position={"top"} size={"small"} />
              <PhoneInput
                defaultCode="AE"
                layout="first"
                placeholder="541234567"
                onChangeText={handleMobileChange}
                onChangeCountry={handleMobileCountryChange}
                containerStyle={{
                  borderRadius: 5,
                  width: "100%",
                  borderWidth: 2,
                  borderColor:
                    isSubmitted && state.mobile.trim() === ""
                      ? "red"
                      : "#00000099",
                  marginTop: 0,
                }}
                textContainerStyle={{
                  borderTopRightRadius: 5,
                  borderBottomRightRadius: 5,
                }}
              />
              <Spacer size={"medium"} position={"top"} />

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={nextPage}
                style={{
                  height: 60,
                  backgroundColor: theme.colors.ui.button,
                  borderRadius: 5,
                  justifyContent: "center",
                  alignItems: "center",
                  marginVertical: 30,
                }}
              >
                <Label style={{ color: "white" }} size={"body"} weight={"bold"}>
                  Next
                </Label>
              </TouchableOpacity>
              {/* </ScrollView> */}
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
