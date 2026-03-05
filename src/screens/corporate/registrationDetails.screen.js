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
} from "react-native";
import { companyLogo, config, honorificList } from "../../utils/constants";
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
import Recaptcha from "react-native-recaptcha-that-works";

import { DropDown } from "../../components/DropDown";
import { BirthdatePicker } from "../../components/BirthdatePicker";
import { NationalityInput } from "../../components/NationalityInput";

const genderItems = [
  { label: "Select Gender", value: "" },
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
];

export const RegistrationDetailsScreen = ({ route }) => {
  console.log({ route });
  const theme = useTheme();
  const [showCountries, setShowCountries] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
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

  const [openHorific, setOpenHorific] = useState(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
  ]);

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

  const recaptcha = useRef();

  const sendCaptcha = () => {
    setIsSubmitted(true);
    if (validateInfo()) {
      const misc = route.params.login.miscellaneous;
      if (misc === undefined) recaptcha.current.open();
      return;
    }
  };

  const onVerify = (token) => {
    console.log("success!", token);
    submit(token);
    // nextPage();
  };

  const onExpire = () => {
    console.warn("expired!");
    showToast("error", "Expired", "NOT NICE");
  };

  const validateInfo = () => {
    if (
      state.firstname.trim() === "" ||
      state.lastname.trim() === "" ||
      state.birthdate === null ||
      state.honorifics === "" ||
      state.gender === ""
    ) {
      shake();
      showToast("error", "Empty Fields", "Some fields are empty.");
      return false;
    }

    return true;
  };

  const submit = (token) => {
    const register1 = route.params.login;

    const user = {
      ...register1,
      ...state,
      birthdate: state.birthdate.toDateString(),
      gender: state.gender.charAt(0),
      token,
    };

    console.log(user);

    UserService.createUser(user)
      .then((result) => {
        if (result) navigate("RegisterSuccess");
      })
      .catch((err) => {
        showToast("error", "Error", err.message);
      });
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

  return (
    <>
      <Background>
        <SafeArea style={styles.safeArea}>
          <Image style={styles.companyLogo} source={companyLogo} />
          <Animated.View style={[styles.safeArea, shakeAnimatedStyle]}>
            <KeyboardAwareScrollView
              automaticallyAdjustKeyboardInsets
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "center",
                flexDirection: "column",
              }}
              style={[
                {
                  paddingHorizontal: 16,
                  flexDirection: "column",
                  flex: 1,
                },
              ]}
            >
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
                  placeholder={"Salutation *"}
                  error={!state.honorifics && isSubmitted}
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
                  value={state.firstname}
                  onChangeText={handleFirstNameChange}
                  label={"First Name *"}
                  error={isSubmitted && state.firstname.trim() === ""}
                />
              </View>

              <View style={styles.formControl}>
                <CustomTextInput
                  value={state.middlename}
                  onChangeText={handleMiddleNameChange}
                  label={"Middle Name"}
                />
              </View>

              <View style={styles.formControl}>
                <CustomTextInput
                  value={state.lastname}
                  onChangeText={handleLastNameChange}
                  label={"Last Name *"}
                  error={isSubmitted && state.lastname.trim() === ""}
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
                    placeholder={"Gender *"}
                    error={!state.gender && isSubmitted}
                  />
                </View>
              </View>

              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Recaptcha
                  ref={recaptcha}
                  siteKey="6LfkGVAmAAAAALcsQxnK2wntbm2ccMfBCz0V81M9"
                  baseUrl="http://www.german-emirates-club.com"
                  onVerify={onVerify}
                  onError={(e) => console.log("ERROR:", e)}
                  onExpire={onExpire}
                  size="small"
                  
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={sendCaptcha}
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
  },
  formControl: {
    height: 58,
    justifyContent: "center",
    position: "relative",
    marginBottom: 6,
  },
});
