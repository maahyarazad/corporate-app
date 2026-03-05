import React, { useEffect, useRef, useState, useCallback } from "react";
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
import {
  validateCardExpiryDate,
  isFutureExpiry,
} from "../../utils/validateCardExpiryDate";
import { isValidEmail } from "../../utils/isEmailValid";
import { PartnerPicker } from "../../components/partnerPicker";
import { PartnerService } from "../../services/location/location.service";
import { companyLogo, config } from "../../utils/constants";
import { Dropdown } from "../../components/DropDown";
export const RegistrationScreen = () => {

    const _login = {
  username: 'maahyarazad',
  password: '398@AZad',
  cpassword: '398@AZad',
  email: 'maahyarazad@gmail.com',
  mobile: '585831595',
  mobileCode: '971',
  mobileCountry: 'AE',
  partner_id: 525,
  app_id: 2,
  card_valid_date: '0227'
}; 

  const theme = useTheme();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [disable, setDisable] = useState(false);
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
    if (!_isFutureExpiry) {
      shake();
      Alert.alert(
        "Invalid Expiry Date",
        "The expiry date must be in the future."
      );
      return false;
    }

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

    if (!isValidEmail(state.email.trim().toLocaleLowerCase())) {
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
          navigate("RegisterDetails", { login: data });
        } else {
          shake();
          alert(response.message);
        }
      } catch (error) {
        console.error("Validation Error:", error);
        shake();
        alert("Something went wrong. Please try again.");
      }
    }
  };

  const [partnerList, setPartnerList] = useState([]);

  const getPartners = useCallback(async () => {
    try {
      const response = await PartnerService.getPartners();

      if (response.success) {
        console.log(response.data);
        setPartnerList(response.data);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error Occurred", "There's a problem loading the partners");
    }
  }, []);

  useEffect(() => {
    getPartners();
  }, [getPartners]);

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
                <TouchableOpacity
                  onPress={()=> navigate("RegisterDetails", { login: _login})}
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
                    NEXT :D
                  </Label>
                </TouchableOpacity>
              </View>
              <Spacer position={"top"} size={"small"} />
              <CustomTextInput
                ref={usernameRef}
                value={state.username}
                style={{ marginTop: 8 }}
                onChangeText={handleUsernameChange}
                label={"Username *"}
                error={isSubmitted && state.username.trim() === ""}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
              <Spacer position={"top"} size={"small"} />
              <CustomTextInput
                ref={passwordRef}
                value={state.password}
                style={{ marginTop: 8 }}
                onChangeText={handlePasswordChange}
                label="Password *"
                error={
                  isSubmitted &&
                  state.password.trim() === "" &&
                  !isPasswordMatch
                }
                secureTextEntry={true}
                showEye={true}
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              />
              <Spacer position={"top"} size={"small"} />
              <CustomTextInput
                ref={confirmPasswordRef}
                value={state.cpassword}
                style={{ marginTop: 8 }}
                onChangeText={handlCPasswordChange}
                label="Confirm Password *"
                error={
                  isSubmitted &&
                  state.cpassword.trim() === "" &&
                  !isPasswordMatch
                }
                secureTextEntry={true}
                showEye={true}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />
              <Spacer position={"top"} size={"small"} />
              {/* <CustomTextInput
                label="Miscellaneous" 
                value={state.miscellaneous}
                onChangeText={handleMisc}
                style={{ width: 0, height: 0, marginTop: 8 }}
              /> */}
              <CustomTextInput
                label={"E-mail *"}
                style={{ marginTop: 8 }}
                value={state.email}
                ref={emailRef}
                onChangeText={handleEmailChange}
                keyboardType={"email-address"}
                error={isSubmitted && state.email.trim() === ""}
                returnKeyType="next"
                onSubmitEditing={() => expiryRef.current?.focus()}
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
                style={{ marginTop: 8 }}
                setPartner={handlePartnerChange}
                error={!state.partner_id && isSubmitted}
              />

            <Dropdown
                searchable={true}
                items={partnerList}
                style={{ marginTop: 8 }}
                  onChange={handlePartnerChange}
                  placeholder={"Partner *"}
                
              />
              <Spacer position={"top"} size={"small"} />
              <CustomTextInput
                ref={expiryRef}
                labelLeftOffset={60}
                maxLength={5}
                style={{ marginTop: 8 }}
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
                selectionColor={"#a6cdfb"} // visible highlight
                onChangeText={handleMobileChange}
                onChangeCountry={handleMobileCountryChange}
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
                  backgroundColor: "white", // optional to make sure background is correct
                  paddingVertical: 0,
                }}
                textInputStyle={{
                  color: "black", // THIS ensures typed text is black
                  fontSize: 16,
                }}
                placeholderTextColor="#999"
                countryPickerProps={{
                  modalProps: {
                    presentationStyle: "pageSheet", // or 'formSheet' on iOS
                    animationType: "slide",
                    statusBarTranslucent: true,
                  },
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
