import React, { useEffect, useRef, useState } from "react";
import {
  TouchableOpacity,
  View,
  Image,
  StyleSheet,
  Animated,
  Easing,
  Vibration,
  Touchable,
  Pressable,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { config, honorificList } from "../../utils/constants";
import { useTheme } from "styled-components";
import { Button, TextInput } from "react-native-paper";
import { DatePicker } from "react-native-woodpicker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeArea } from "../../components/safearea.component";
import { Spacer } from "../../components/spacer/spacer.component";
import { Label } from "../../components/typography/label.component";
import ModalDropdown from "react-native-modal-dropdown";
import CountryPicker, {
  CountryCodeList,
} from "react-native-country-picker-modal";
import Background from "../../components/background/background.component";
import { goback, navigate } from "../../navigation/navigate";
import { UserService } from "../../services/user/user.service";
import { Ionicons } from "@expo/vector-icons";
import { CustomTextInput } from "../../components/customTextInput";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import moment from "moment";
import { CustomModal } from "../../components/modal/customModal.component";

export const RegistrationDetailsScreen = ({ route }) => {
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
      state.firstname.trim() === "" ||
      state.middlename.trim() === "" ||
      state.lastname.trim() === "" ||
      state.birthdate === null ||
      state.honorifics === "" ||
      state.gender === ""
    ) {
      shake();
      alert("Some fields are empty.");
      return false;
    }

    return true;
  };

  const submit = () => {
    setIsSubmitted(true);
    if (validateInfo()) {
      const register1 = route.params.login;

      const user = {
        ...register1,
        ...state,
        birthdate: state.birthdate.toDateString(),
        gender: state.gender.charAt(0),
      };

      console.log(user);

      UserService.createUser(user)
        .then((result) => {
          if (result) navigate("RegisterSuccess");
        })
        .catch((err) => {
          alert(err.message);
        });
    }
  };

  const openBdayModal = () => {
    setShowBdayModal(true);
  };

  const closeBdayModal = () => {
    setState({ ...state, birthdate: tempBday });
    setShowBdayModal(false);
  };

  const handleBdayChange = (_, date) => {
    setTempBday(date);
  };

  const handleBdayChangeAndroid = (date) => {
    setState({ ...state, birthdate: date });
  };

  const handleHonorificChange = (_, value) => {
    setState({ ...state, honorifics: value });
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

  const displayCountries = () => {
    setShowCountries(true);
  };

  const handleNationalityChange = (country) => {
    setState({ ...state, nationality: country.name });
  };

  const handleGenderChange = (_, value) => {
    setState({ ...state, gender: value });
  };

  return (
    <>
      <CustomModal showModal={showBdayModal}>
        <View
          style={{
            backgroundColor: "#00000088",
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              width: "90%",
              borderRadius: 10,
            }}
          >
            <DateTimePicker
              // style={{ flex: 1, height: 200, width: 200 }}
              themeVariant={"dark"}
              value={tempBday}
              mode={"date"}
              display={Platform.OS === "ios" ? "spinner" : "calendar"}
              maximumDate={dateLimit}
              onChange={handleBdayChange}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                paddingBottom: 16,
              }}
            >
              <Button
                onPress={closeBdayModal}
                color={theme.colors.icons.active}
                mode="contained"
              >
                Set Birthdate
              </Button>
            </View>
          </View>
        </View>
      </CustomModal>
      <Background>
        <SafeArea style={styles.safeArea}>
          <Image
            style={styles.companyLogo}
            source={require("../../../assets/IFZA-Logo.png")}
          />
          <Animated.View style={[styles.safeArea, shakeAnimatedStyle]}>
            <KeyboardAwareScrollView
              automaticallyAdjustKeyboardInsets
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="always"
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
                    Return
                  </Label>
                </TouchableOpacity>
              </View>
              <View
                style={{
                  height: 58,
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <CustomTextInput
                  value={state.honorifics}
                  // onChangeText={handleHonorificChange}
                  label={"Salutation *"}
                  style={{
                    width: "100%",
                    maxHeight: 58,
                    position: "absolute",
                    zIndex: -1,
                  }}
                  right={<TextInput.Icon name="chevron-down" />}
                  error={!state.honorifics && isSubmitted}
                />

                <ModalDropdown
                  isFullWidth
                  keyboardShouldPersistTaps="always"
                  style={{
                    flex: 1,
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    zIndex: 2,
                  }}
                  textStyle={{
                    height: 58,
                    color: "transparent",
                  }}
                  dropdownTextStyle={{ fontSize: 16 }}
                  dropdownStyle={{
                    height: "auto",
                  }}
                  options={honorificList}
                  onSelect={handleHonorificChange}
                />
              </View>
              <Spacer position={"top"} size={"small"} />
              <CustomTextInput
                value={state.firstname}
                onChangeText={handleFirstNameChange}
                label={"First Name *"}
                error={isSubmitted && state.firstname.trim() === ""}
              ></CustomTextInput>
              <Spacer position={"top"} size={"small"} />
              <CustomTextInput
                value={state.middlename}
                onChangeText={handleMiddleNameChange}
                label={"Middle Name *"}
                error={isSubmitted && state.middlename.trim() === ""}
              ></CustomTextInput>
              <Spacer position={"top"} size={"small"} />
              <CustomTextInput
                value={state.lastname}
                onChangeText={handleLastNameChange}
                label={"Last Name *"}
                error={isSubmitted && state.lastname.trim() === ""}
              ></CustomTextInput>
              <Spacer position={"top"} size={"small"} />
              <View
                style={{
                  height: 58,
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <CustomTextInput
                  value={state.nationality}
                  label={"Nationality"}
                  style={{
                    width: "100%",
                    height: 58,
                    position: "absolute",
                    zIndex: -1,
                  }}
                  right={
                    <TextInput.Icon
                      name="chevron-down"
                      onPress={displayCountries}
                    />
                  }
                />
                <View
                  style={{
                    flex: 1,
                    paddingTop: 10,
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    zIndex: 1,
                  }}
                >
                  <CountryPicker
                    countryCodes={CountryCodeList}
                    onSelect={handleNationalityChange}
                    withEmoji={true}
                    withFilter
                    placeholder=""
                    containerButtonStyle={{
                      height: "100%",
                      width: "100%",
                      top: 0,
                      right: 0,
                      bottom: 0,
                      left: 0,
                    }}
                    visible={showCountries}
                  />
                </View>
              </View>
              <Spacer position={"top"} size={"small"} />
              {/* <DateTimePicker
                value={new Date()}
                mode={"date"}
                display="spinner"
              /> */}

              <View
                style={{
                  flexDirection: "row",
                  flex: 1,
                  height: 60,
                  maxHeight: 60,
                }}
              >
                {Platform.OS === "ios" ? (
                  <View style={{ marginBottom: 0, flex: 1 }}>
                    <CustomTextInput
                      value={
                        state.birthdate
                          ? moment(state.birthdate).format("L")
                          : ""
                      }
                      // onChangeText={setBirthdate}
                      label={"Birthdate *"}
                      style={{
                        width: "100%",
                        maxHeight: 60,
                        position: "absolute",
                      }}
                      error={!state.birthdate && isSubmitted}
                    ></CustomTextInput>
                    <Pressable
                      style={{ flex: 1 }}
                      onPress={openBdayModal}
                    ></Pressable>
                  </View>
                ) : (
                  <View style={{ marginBottom: 0, flex: 1 }}>
                    <CustomTextInput
                      value={
                        state.birthdate
                          ? moment(state.birthdate).format("L")
                          : ""
                      }
                      // onChangeText={setBirthdate}
                      label={"Birthdate *"}
                      style={{
                        width: "100%",
                        maxHeight: 60,
                        position: "absolute",
                      }}
                      error={!state.birthdate && isSubmitted}
                    ></CustomTextInput>
                    <DatePicker
                      value={state.birthdate}
                      onDateChange={handleBdayChangeAndroid}
                      title="Birthdate"
                      isNullable={false}
                      iosMode="date"
                      androidMode="date"
                      androidDisplay="default"
                      textColor="black"
                      maximumDate={dateLimit}
                      locale="en"
                      iosDisplay="spinner"
                      style={{
                        width: "100%",
                        height: 58,
                        marginTop: 6,
                      }}
                    />
                  </View>
                )}
                <Spacer position={"left"} size={"small"} />
                <View
                  style={{
                    flex: 1,
                    height: 58,
                  }}
                >
                  <CustomTextInput
                    value={state.gender}
                    // onChangeText={setGender}
                    label={"Gender *"}
                    style={{
                      width: "100%",
                      maxHeight: 58,
                      position: "absolute",
                    }}
                    right={<TextInput.Icon name="chevron-down" />}
                    error={!state.gender && isSubmitted}
                  ></CustomTextInput>
                  <ModalDropdown
                    textStyle={{
                      height: 58,
                      color: "transparent",
                    }}
                    dropdownTextStyle={{
                      fontSize: 16,
                    }}
                    dropdownStyle={{ height: 80, width: "46%" }}
                    options={["Male", "Female"]}
                    onSelect={handleGenderChange}
                  />
                </View>
              </View>
              <Spacer size={"medium"} position={"top"} />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={submit}
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
});
