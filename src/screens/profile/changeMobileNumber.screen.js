import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useContext, useState } from "react";
import Background from "../../components/background/background.component";
import { SafeArea } from "../../components/safearea.component";
import { StatusBar } from "expo-status-bar";
import { Label } from "../../components/typography/label.component";
import PhoneInput from "react-native-phone-number-input";
import { theme } from "../../infrastructure/theme";
import { goback } from "../../navigation/navigate";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "../../../hooks/useTranslation";
import useRequest from "../../../hooks/useRequest";
import useUser from "../../../hooks/useUser";
import { AuthContext } from "../../services/auth/auth.context";

const ChangeMobileNumberScreen = () => {
  const [state, setState] = useState({
    mobileCode: "971",
    mobileCountry: "AE",
    mobile: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { i18n } = useTranslation();
  const request = useRequest();
  const { setUserData, userData } = useUser();
  const { resendOTP } = useContext(AuthContext);

  const handleMobileCountryChange = (country) => {
    setState({
      ...state,
      mobileCountry: country.cca2,
      mobileCode: country.callingCode,
    });
  };
  const handleMobileChange = (prev) => {
    setState({ ...state, mobile: prev.replace(/[^0-9]/g, ``) });
  };

  const handleUpdateNumber = async () => {
    try {
      //Change mobile nubmer in server

      const response = await request("/v2/user/update-mobile", "PUT", state);

      if (response.success) {
        setUserData((prev) => ({
          ...prev,
          phone_number: state.mobile,
          area_code: state.mobileCode,
        }));

        resendOTP(userData.user_id);
        Alert.alert(
          i18n.t("update-mobile-number.success"),
          i18n.t("update-mobile-number.success-msg")
        );
        goback();
      } else {
        Alert.alert(
          i18n.t("update-mobile-number.failed"),
          i18n.t("update-mobile-number.failed-msg")
        );
      }
    } catch (error) {
      console.log("Failed to change mobile number", error);
    }
  };

  return (
    <Background>
      <StatusBar style="light" />
      <SafeArea style={{ alignItems: "center" }}>
        <View style={{ paddingHorizontal: 12, width: "100%" }}>
          <TouchableOpacity
            onPress={goback}
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
            activeOpacity={0.5}
          >
            <Ionicons name="arrow-back" size={35} color={"#fff"} />
            <Label
              size={"body"}
              weight="bold"
              style={{ justifyContent: "center" }}
              color={"white"}
            >
              {i18n.t("return")}
            </Label>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, width: "100%", padding: 12, gap: 50 }}>
          <Label size={"h4"} weight={"bold"} color={"white"}>
            {i18n.t("update-mobile-number.header")}
          </Label>

          <View>
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
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleUpdateNumber}
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
                {i18n.t("update-mobile-number.confirm")}
              </Label>
            </TouchableOpacity>
          </View>
        </View>
      </SafeArea>
    </Background>
  );
};

export default ChangeMobileNumberScreen;

const styles = StyleSheet.create({});
