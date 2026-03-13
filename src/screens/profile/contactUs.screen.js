import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useEffect, useLayoutEffect, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Button } from "react-native-paper";
import { CustomTextInput } from "../../components/customTextInput";
import { SafeArea } from "../../components/safearea.component";
import { Spacer } from "../../components/spacer/spacer.component";
import { Label } from "../../components/typography/label.component";
import { goback } from "../../navigation/navigate";
import { SupportService } from "../../services/support/support.service";
import { TranslationContext } from "../../services/translation/translation.context";
import { UserContext } from "../../services/user/user.context";
import { config } from "../../utils/constants";
import useUser from "../../../hooks/useUser";
import useRequest from "../../../hooks/useRequest";

export const ContactUsScreen = () => {
  const { userData } = useUser();
  const { i18n } = useContext(TranslationContext);
  const [disableButton, setDisableButton] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState({
    name: ".",
    email: ".",
    mobile: ".",
    message: "",
  });
  const request = useRequest();

  useLayoutEffect(() => {
    let isMounted = true;

    if (userData != undefined && isMounted) {
      setState({
        ...state,
        name: `${userData.first_name} ${userData.last_name}`,
        email: userData.email,
        mobile: `+${userData.area_code} ${userData.phone_number}`,
      });
    }

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const empty = Object.keys(state).find((key) => {
      // console.log('There is Empty', key)
      // console.log(state[key])
      return state[key]?.trim() === ``;
    });
    if (empty) {
      setDisableButton(true);
    } else {
      setDisableButton(false);
    }
  }, [state]);

  const handleNameChange = (prev) => {
    setState({ ...state, name: prev });
  };

  const handleEmailChange = (prev) => {
    setState({ ...state, email: prev });
  };

  const handleMessageChange = (prev) => {
    setState({ ...state, message: prev });
  };

  const handleMobileChange = (prev) => {
    setState({ ...state, mobile: prev });
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const data = { ...state, app: config.APP_ID };

      const response = await request(`/v2/support/message`, "post", data);
      // const response = await SupportService.sendFeedbackMsg(data);
      if (response.success) {
        Alert.alert(
          "Sent Successfully",
          "Your message has been sent. Thank you for contacting us!"
        );
        goback();
      } else {
        Alert.alert("Sending Failed", response.message);
      }

      Alert.alert(
        i18n.t("contact-us.sent-successful"),
        i18n.t("contact-us.message-sent")
      );
      setTimeout(() => {
        setIsLoading(false);
      }, 3000);
    } catch (error) {
      setIsLoading(false);
      Alert.alert("Sending Failed", "Your inquiry was not sent");
    } finally {
      setIsLoading(true);
    }
  };

  return (
    <View style={[styles.container, { marginTop: 30 }]}>
      <TouchableOpacity
        onPress={goback}
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
        activeOpacity={0.5}
      >
        <Ionicons name="arrow-back" size={35} color={"#555"} />
        <Label
          size={"body"}
          weight="bold"
          style={{ color: "#555", justifyContent: "center" }}
        >
          {i18n.t("return")}
        </Label>
      </TouchableOpacity>
      <View style={styles.contactContainer}>
        <View style={{ marginBottom: 24 }}>
          <Label
            size={"h5"}
            weight="bold"
            style={{ color: "#555", justifyContent: "center" , marginTop: 10}}
          >
            {i18n.t("profile-tabs.settings-menu.contact-us")}
          </Label>
        </View>
        <KeyboardAwareScrollView
          //   scroll
          // automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="always"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          style={[styles.container, { marginHorizontal: -16 }]}
          contentContainerStyle={{ paddingVertical: 12 }}
        >
          <View>
            <CustomTextInput
              disable={true}
              value={state.name}
              style={{
                shadowOpacity: 0.3,
                shadowRadius: 5,
                shadowOffset: {
                  width: 3,
                  height: 3,
                },
              }}
              onChangeText={handleNameChange}
              label={`${i18n.t("contact-us.form-name")} *`}
            />
            <View style={{marginTop: 8}}/>
            <CustomTextInput
              disable={true}
              value={state.email}
              style={{
                shadowOpacity: 0.3,
                shadowRadius: 5,
                shadowOffset: {
                  width: 3,
                  height: 3,
                },
              }}
              onChangeText={handleEmailChange}
              label={`${i18n.t("contact-us.form-email")} *`}
            />
            <View style={{marginTop: 8}}/>
            <CustomTextInput
              disable={true}
              value={state.mobile}
              style={{
                shadowOpacity: 0.3,
                shadowRadius: 5,
                shadowOffset: {
                  width: 3,
                  height: 3,
                },
              }}
              onChangeText={handleMobileChange}
              label={`${i18n.t("contact-us.form-phone-number")} *`}
            />
            <View style={{marginTop: 8}}/>
            <CustomTextInput
              value={state.message}
              style={{
                shadowOpacity: 0.3,
                shadowRadius: 5,
                shadowOffset: {
                  width: 3,
                  height: 3,
                },
              }}
              inputStyle={{
                paddingTop: 16,
                paddingBottom: 16,
              }}
              onChangeText={handleMessageChange}
              label={`${i18n.t("contact-us.form-message")} *`}
              multiline={true}
            />
            <View style={{marginTop: 8}}/>
            <Button
              loading={isLoading}
              disabled={disableButton || isLoading}
              onPress={handleSubmit}
              contentStyle={{ paddingVertical: 8 }}
              color={"orange"}
              mode="contained"
            >
              <Label size={"body"} weight={"medium"}>
                {i18n.t("submit")}
              </Label>
            </Button>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contactContainer: {
    flex: 1,
  },
});
