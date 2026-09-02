import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useEffect, useLayoutEffect, useState } from "react";
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { showToast } from "../../Toast";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Button } from "react-native-paper";
import { CustomTextInput } from "../../components/customTextInput";
import { Label } from "../../components/typography/label.component";
import { goback } from "../../navigation/navigate";
import { TranslationContext } from "../../services/translation/translation.context";
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
    if (userData != undefined) {
      setState({
        ...state,
        name: `${userData.first_name} ${userData.last_name}`,
        email: userData.email,
        mobile: `+${userData.area_code} ${userData.phone_number}`,
      });
    }
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
        showToast(
          "success",
          "Sent Successfully",
          "Your message has been sent. Thank you for contacting us!"
        );
        goback();
      } else {
        showToast("error", "Sending Failed", response.message);
      }

      showToast(
        "success",
        i18n.t("contact-us.sent-successful"),
        i18n.t("contact-us.message-sent")
      );
      setTimeout(() => {
        setIsLoading(false);
      }, 3000);
    } catch (error) {
      setIsLoading(false);
      showToast("error", "Sending Failed", "Your inquiry was not sent");
    } finally {
      setIsLoading(true);
    }
  };

  return (
    <View style={[styles.container, { marginTop: 30 }]}>
      <TouchableOpacity onPress={goback} style={styles.rowCenter} activeOpacity={0.5}>
        <Ionicons name="arrow-back" size={35} color="#555" />
        <Label size="body" weight="bold" style={styles.label}>
          {i18n.t("return")}
        </Label>
      </TouchableOpacity>
      <View style={styles.contactContainer}>
        <View style={styles.spacer}>
          <Label size="h5" weight="bold" style={styles.label2}>
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
          contentContainerStyle={styles.keyboardAwareScrollViewContentContainer}
        >
          <View>
            <CustomTextInput
              disable={true}
              value={state.name}
              style={styles.customTextInput}
              onChangeText={handleNameChange}
              label={`${i18n.t("contact-us.form-name")} *`}
            />
            <View style={styles.spacer2}/>
            <CustomTextInput
              disable={true}
              value={state.email}
              style={styles.customTextInput}
              onChangeText={handleEmailChange}
              label={`${i18n.t("contact-us.form-email")} *`}
            />
            <View style={styles.spacer2}/>
            <CustomTextInput
              disable={true}
              value={state.mobile}
              style={styles.customTextInput}
              onChangeText={handleMobileChange}
              label={`${i18n.t("contact-us.form-phone-number")} *`}
            />
            <View style={styles.spacer2}/>
            <CustomTextInput
              value={state.message}
              style={styles.customTextInput}
              inputStyle={styles.customTextInput2}
              onChangeText={handleMessageChange}
              label={`${i18n.t("contact-us.form-message")} *`}
              multiline={true}
            />
            <View style={styles.spacer2}/>
            <Button
              loading={isLoading}
              disabled={disableButton || isLoading}
              onPress={handleSubmit}
              contentStyle={styles.buttonContent}
              color="orange"
              mode="contained"
            >
              <Label size="body" weight="medium">
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
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    color: "#555",
    justifyContent: "center",
  },
  spacer: {
    marginBottom: 24,
  },
  label2: {
    color: "#555",
    justifyContent: "center",
    marginTop: 10,
  },
  keyboardAwareScrollViewContentContainer: {
    paddingVertical: 12,
  },
  customTextInput: {
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: {
      width: 3,
      height: 3,
    },
  },
  spacer2: {
    marginTop: 8,
  },
  customTextInput2: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
