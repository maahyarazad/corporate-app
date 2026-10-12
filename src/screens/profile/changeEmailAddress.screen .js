import { StyleSheet, TouchableOpacity, View } from "react-native";
import { showToast } from "../../Toast";
import React, { useContext, useState } from "react";
import Background from "../../components/background/background.component";
import { SafeArea } from "../../components/safearea.component";
import { StatusBar } from "expo-status-bar";
import { Label } from "../../components/typography/label.component";
import { theme } from "../../infrastructure/theme";
import { goback } from "../../navigation/navigate";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "../../../hooks/useTranslation";
import useRequest from "../../../hooks/useRequest";
import useUser from "../../../hooks/useUser";
import { AuthContext } from "../../services/auth/auth.context";
import { CustomTextInput } from "../../components/customTextInput";
import { UserService } from "../../services/user/user.service";
import { useRoute } from "@react-navigation/native";

const ChangeEmailAddressScreen = () => {
  const [state, setState] = useState({
    email: "",
    valid: false,
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { i18n } = useTranslation();
  const request = useRequest();
  const { setUserData, userData } = useUser();
  const { resendOTP } = useContext(AuthContext);
  const { params } = useRoute();

  const handleUpdateEmail = async () => {
    try {
      //Change mobile nubmer in server
      setIsSubmitted(true);

      //Check if email is valid using regex
      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(state.email)) {
        showToast("error", "Invalid Email", "Please enter a valid email address");
        setState({ ...state, valid: false });
        return;
      }
      setState({ ...state, valid: true });

      const response = await request("/v2/user/update-email", "PUT", state);

      if (response.success) {
        setUserData((prev) => ({
          ...prev,
          email: state.email,
        }));

        const resend = await UserService.resendEmailVerification(params.userId);
        showToast(
          "success",
          i18n.t("update-email.success"),
          i18n.t("update-email.success-msg")
        );
        goback();
      } else {
        showToast(
          "error",
          i18n.t("update-email.failed"),
          i18n.t("update-email.failed-msg")
        );
      }
    } catch (error) {
      console.log("Failed to change mobile number", error);
    }
  };

  const handleEmailChange = (prev) => {
    setState({ ...state, email: prev });
  };

  return (
    <Background>
      <StatusBar style="light" />
      <SafeArea style={styles.safeArea}>
        <View style={styles.box}>
          <TouchableOpacity
            onPress={goback}
            style={styles.rowCenter}
            activeOpacity={0.5}
          >
            <Ionicons name="arrow-back" size={35} color={"#fff"} />
            <Label size={"body"} weight="bold" style={styles.label} color={"white"}>
              {i18n.t("return")}
            </Label>
          </TouchableOpacity>
        </View>
        <View style={styles.flexBox}>
          <Label size={"h4"} weight={"bold"} color={"white"}>
            {i18n.t("update-email.header")}
          </Label>

          <View>
            <CustomTextInput
              label={"E-mail *"}
              value={state.email}
              onChangeText={handleEmailChange}
              keyboardType={"email-address"}
              error={isSubmitted && state.email.trim() === ""}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleUpdateEmail}
              style={[
                styles.centerBox,
                {
                  backgroundColor:
                    state.email.trim() === "" ? "#ccc" : theme.colors.ui.button,
                },
              ]}
              disabled={state.email.trim() === ""}
            >
              <Label style={styles.label2} size={"body"} weight={"bold"}>
                {i18n.t("update-email.confirm")}
              </Label>
            </TouchableOpacity>
          </View>
        </View>
      </SafeArea>
    </Background>
  );
};

export default ChangeEmailAddressScreen;

const styles = StyleSheet.create({
  safeArea: {
    alignItems: "center",
  },
  box: {
    paddingHorizontal: 12,
    width: "100%",
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    justifyContent: "center",
  },
  flexBox: {
    flex: 1,
    width: "100%",
    padding: 12,
    gap: 50,
  },
  label2: {
    color: "white",
  },
  centerBox: {
    height: 60,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 30,
  },
});
