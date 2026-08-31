import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from "react-native";
import Animated from "react-native-reanimated";
import { useShakeAnimation } from "../../hooks/useShakeAnimation";
import { showToast } from "../../Toast";
import { TouchableOpacity } from "react-native-gesture-handler";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Background from "../../components/background/background.component";
import { CustomTextInput } from "../../components/customTextInput";
import { SafeArea } from "../../components/safearea.component";
import { Spacer } from "../../components/spacer/spacer.component";
import { Label } from "../../components/typography/label.component";
import { goback, navigate } from "../../navigation/navigate";
import { useTheme } from "styled-components/native";
import PhoneInput from "react-native-phone-number-input";
import { useEffect } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { UserService } from "../../services/user/user.service";
import { isCancel } from "../../utils/cancellation";
import country from "country-list-js";
import { AuthContext } from "../../services/auth/auth.context";
import { UserContext } from "../../services/user/user.context";
import useUser from "../../../hooks/useUser";

export const UpdateMemberScreen = () => {
  // Static-config screens receive only `route` - the navigator renders them
  // through a render callback, so `navigation` never arrives as a prop.
  const navigation = useNavigation();

  const theme = useTheme();
  const { user, setUser } = useContext(AuthContext);
  const { getUserInfo } = useUser();
  const [loading, setLoading] = useState(false);
  const route = useRoute();
  const { member_id, credentials } = route.params;
  const [state, setState] = useState({
    firstname: "",
    middlename: "",
    lastname: "",
    email: "",
    // mobileCountry: "AE",
    // mobileNumber: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const dateLimit = new Date();
  dateLimit.setFullYear(dateLimit.getFullYear() - 18);

  const { shakeStyle, shake } = useShakeAnimation();

  const handleFirstNameChange = (value) => {
    setState({ ...state, firstname: value });
  };

  const handleMiddleNameChange = (value) => {
    setState({ ...state, middlename: value });
  };

  const handleLastNameChange = (value) => {
    setState({ ...state, lastname: value });
  };

  const handleEmailChange = (prev) => {
    setState({ ...state, email: prev });
  };

  const handleMobileCountryChange = (country) => {
    setState({
      ...state,
      mobileCode: country.callingCode[0],
      mobileCountry: country.cca2,
    });
    // console.log("Country: ", country);
  };

  const handleMobileChange = (prev) => {
    // console.log("number: ", prev);
    setState({ ...state, mobileNumber: prev.replace(/[^0-9]/g, ``) });
  };

  const validateInfo = () => {
    if (
      state.firstname.trim() === "" ||
      state.lastname.trim() === "" ||
      state.email.trim() === "" ||
      state.mobileNumber.trim() === ""
    ) {
      shake();
      showToast("error", "Invalid", "Some fields are empty.");
      return false;
    }

    return true;
  };

  const submit = async () => {
    setIsSubmitted(true);
    setLoading(true);
    if (validateInfo()) {
      const user = {
        ...state,
        ...credentials,
      };

      const response = await UserService.addMember(user);

    //   console.log("add member: ", response);
      if (response.status) {
        setUser((prev) => ({
          ...prev,
          user_id: response.user_id,
          isAuthorized: response.isAuthorized,
          submitCard: response.hasSubmit,
        }));

        getUserInfo();
        setLoading(false);

        navigate("RegisterSuccess");
        // navigation.navigate("VerifyOTP", {
        //   hiddenNumber: response.phone_number,
        // });
      } else {
        navigation.navigate("Unverified Email", {
          userId: response.user_id,
        });
      }

    //   console.log(response);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    const fetchMember = async () => {
      try {
        const response = await UserService.getMemberInfo(
          member_id,
          controller.signal
        );

        if (response.success) {
        //   console.log("success");
        //   console.log(response);
          setState({
            ...state,
            firstname: response.data.first_name ?? "",
            middlename: response.data.middle_name ?? "",
            lastname: response.data.last_name ?? "",
            email: response.data.email ?? "",
            mobileCode: response.data.phone[0] ?? "",
            mobileCountry:
              country.findByPhoneNbr(response.data.phone[0]).code.iso2 ?? "",
            mobileNumber: `${response.data.phone[1]}${response.data.phone[2]}`,
          });
        //   console.log(state);
        //   console.log(country.findByPhoneNbr(response.data.phone[0]).code.iso2);
          // console.log(response.data.phone[0]);
        } else {
          Alert(response.title, response.message);
        }
      } catch (error) {
        if (isCancel(error)) return;
        console.log("Failed to load member info:", error);
      }
    //   console.log("Member Response: ", state);
    };

    fetchMember();

    return () => controller.abort();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <Background>
        <SafeArea
          style={{
            height: "100%",
            backgroundColor: "transparent",
            justifyContent: "flex-end",
          }}
        >
          <Animated.View style={[styles.safeArea, shakeStyle]}>
            <KeyboardAwareScrollView
              automaticallyAdjustKeyboardInsets={true}
              keyboardShouldPersistTaps="always"
              style={{ height: "100%" }}
              // contentContainerStyle={{ flexGrow: 1 }}
            >
              <View
                style={{
                  height: "100%",
                  padding: 20,
                }}
              >
                <View>
                  <Label size="h4" weight="bold" style={{ color: "white" , ...styles.fixMargin}}>
                    Mitgliedsprofil aktualisieren
                  </Label>

                 
                  <Label 
                    size="title"
                    weight="bold"
                    style={{ color: "white" , ...styles.fixMargin}}
                  >
                    {/* Keep your information up-to-date. */}
                    Halten Sie Ihre Informationen auf dem neuesten Stand.
                    {/* Please update your information in our database by filling out
                  the form. Keeping our records current and up to date will
                  ensure that you receive the latest news and benefits. */}
                  </Label>

               
                  <CustomTextInput style={styles.fixMargin}
                    value={state.firstname}
                    onChangeText={handleFirstNameChange}
                    label="Vorname *"
                    error={isSubmitted && state.firstname.trim() === ""}
                  ></CustomTextInput>
                  
                  <CustomTextInput
                  style={styles.fixMargin}
                    value={state.middlename}
                    onChangeText={handleMiddleNameChange}
                    label="zweiter Vorname"
                  ></CustomTextInput>
                  
                  <CustomTextInput
                  style={styles.fixMargin}
                    value={state.lastname}
                    onChangeText={handleLastNameChange}
                    label="Nachname *"
                    error={isSubmitted && state.lastname.trim() === ""}
                  ></CustomTextInput>

                  
                  <CustomTextInput
                  style={styles.fixMargin}
                    label="E-mail *"
                    value={state.email}
                    // value={route.params.member_id}
                    onChangeText={handleEmailChange}
                    keyboardType="email-address"
                    error={isSubmitted && state.email.trim() === ""}
                  />

                  <View style={{marginTop: 8}}/>

                  {state.mobileCountry || state.mobileNumber ? (
                    <>
                      <PhoneInput
                        defaultValue={state.mobileNumber}
                        defaultCode={state.mobileCountry}
                        layout="first"
                        placeholder="543248901"
                        onChangeText={handleMobileChange}
                        onChangeCountry={handleMobileCountryChange}
                        containerStyle={{
                          borderRadius: 5,
                          width: "100%",
                          borderWidth: 2,
                          borderColor:
                            isSubmitted && state.mobileNumber.trim() === ""
                              ? "red"
                              : "#fff",
                          marginTop: 0,
                        }}
                        textContainerStyle={{
                          borderTopRightRadius: 5,
                          borderBottomRightRadius: 5,
                        }}
                      />

                      <View style={{marginTop: 8}}/>
                    </>
                  ) : (
                    <></>
                  )}

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
                    <Label
                      style={{ color: "white" }}
                      size="body"
                      weight="bold"
                    >
                      aktualisieren
                    </Label>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAwareScrollView>
          </Animated.View>
        </SafeArea>
      </Background>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    justifyContent: "flex-start",
  },

  fixMargin: {
    marginTop: 8
  }
});
