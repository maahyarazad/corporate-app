import React, { useContext, useEffect, useState } from "react";
import {
  Image,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ActivityIndicator, TextInput } from "react-native-paper";
import { SafeArea } from "../../components/safearea.component";
import { useTheme } from "styled-components/native";
import { StatusBar } from "expo-status-bar";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { navigate } from "../../navigation/navigate";
import Background from "../../components/background/background.component";
import * as WebBrowser from "expo-web-browser";
import { isValidURL } from "../../utils/isValidURL";
import { companyLogo, config, EULAPrivacyLink } from "../../utils/constants";
import useRequest from "../../../hooks/useRequest";
import useAuth from "../../../hooks/useAuth";
import { TranslationContext } from "../../services/translation/translation.context";
import * as Constants from "expo-constants";
import LoginHeader from "./login.components/LoginHeader";
import LoginForm from "./login.components/LoginForm";
import BiometricLogin from "./login.components/BiometricLogin";
import RegisterSection from "./login.components/RegisterSection";
import useBiometrics from "../../../hooks/useBiometrics";
import { useTranslation } from "../../../hooks/useTranslation";
import { showToast } from "../../Toast";
import { getDeviceInfo } from "../../services/auth/auth.service";
import styled from "styled-components/native";

export const TextInputForm = styled(TextInput)`
  border-radius: 10px;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
`;

export const LoginButton = styled(TouchableOpacity)`
  min-height: 60px;
  max-height: 60px;
  background-color: ${({ checked }) => (checked ? "#207ede" : "#c7c7c7")};
  border-radius: 5px;
  justify-content: center;
  align-items: center;
`;

export const LoginScreen = ({ navigation }) => {
  const [checked, setChecked]           = useState(false);
  const [username, setUsername]         = useState(null);
  const [password, setPassword]         = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false); // ✅ separate loading state
  const [canRegister, setCanRegister]   = useState(true);

  const request = useRequest();
  const { signin, loading } = useAuth();
  const { setLang } = useContext(TranslationContext);
  const theme = useTheme();
  const { i18n } = useTranslation();

  // ✅ Destructure once — use these variables directly everywhere
  const {
    available,
    type,
    enrolled,
    token,
    authenticate,
    enable,
    disable,
    checkBiometricStatus,
  } = useBiometrics();

  // ✅ Construct a biometric object to pass to child components
  const biometric = { available, type, enrolled, token, authenticate, enable, disable };

  useEffect(() => {
    // Re-check biometric status when availability changes
    checkBiometricStatus();
  }, [available]); // ✅ now correctly references the destructured variable

  const handleBiometricLogin = async () => {
    try {
      // 1. Guard: hardware available
      if (!available) {
        showToast("info", "Notice", "Biometric authentication is not available on this device.");
        return;
      }

      // 2. Guard: user has enrolled biometrics in device settings
      if (!enrolled) {
        showToast("info", "Notice", `Please enable ${type} in your device settings.`);
        return;
      }

      // 3. Guard: user has enabled biometrics in the app
      if (!token) {
        showToast(
          "info",
          "Notice",
          `Please enable '${i18n.t(`profile-tabs.settings-menu.login-${type}`)}' in the app.\n\n` +
          `${i18n.t("bottom-tabs.profile")} > ${i18n.t("profile-tabs.settings")} > ${i18n.t(`profile-tabs.settings-menu.login-${type}`)}`
        );
        return;
      }

      // 4. Trigger biometric prompt
      const authenticated = await authenticate();
      if (!authenticated) return; // user cancelled — silent return

      // 5. Biometric passed — call login API
      setBiometricLoading(true); // ✅ use dedicated loading state
      const deviceInfo = await getDeviceInfo();

      const credentials = {
        app_id: config.APP_ID,
        device_id: deviceInfo.device_id,
        ip_address: deviceInfo.ip_address,
        platform: Platform.OS,
        version: Constants.default.expoConfig.version,
        biometric_token: token,
      };

      const response = await request("/v2/auth/login", "post", credentials);

      if (!response.success) {
        showToast("error", response.title, response.message);
        return;
      }

      // 6. Handle successful login
      setLang(response.member ? "de" : "en");
      signin(response.refreshToken, response.accessToken);

      if (response.member_id) {
        navigation.navigate("UpdateMember", { member_id: response.member_id, credentials });
        return;
      }

      if (response.status) {
        navigation.navigate("VerifyOTP", { hiddenNumber: response.phone_number });
      } else {
        navigation.navigate("Unverified Email", { userId: response.user_id });
      }

    } catch (error) {
      console.error("Biometric login failed:", error);
      showToast("error", "Error", "Something went wrong. Please try again.");
    } finally {
      setBiometricLoading(false); // ✅ always clears loading
    }
  };

  const handleForgetPassword = () => navigate("ForgotPassword");

  const handleLogin = async () => {
    try {
      setLoginLoading(true);

      if (!username?.trim() && !password?.trim()) {
        showToast("error", "Invalid Login", "Please enter your username and password");
        return;
      }
      if (!username?.trim()) {
        showToast("error", "Invalid Login", "Please enter your username");
        return;
      }
      if (!password?.trim()) {
        showToast("error", "Invalid Login", "Please enter your password");
        return;
      }

      Keyboard.dismiss();
      const deviceInfo = await getDeviceInfo();

      const credentials = {
        app_id: config.APP_ID,
        username,
        password,
        device_id: deviceInfo.device_id,
        ip_address: deviceInfo.ip_address,
        platform: Platform.OS,
        version: Constants.default.expoConfig.version,
      };

      const response = await request("/v2/auth/login", "post", credentials);

      if (!response.success) {
        showToast("error", response.title, response.message);
        return;
      }

      setLang(response.member ? "de" : "en");
      signin(response.refreshToken, response.accessToken); // ✅ called once

      if (response.member_id) {
        navigate("UpdateMember", { member_id: response.member_id, credentials });
        return;
      }

      if (response.status) {
        navigation.navigate("VerifyOTP", { hiddenNumber: response.phone_number });
      } else {
        navigation.navigate("Unverified Email", { userId: response.user_id });
      }

    } catch (err) {
      console.error("Login error:", err);
      showToast("error", "Error", "Something went wrong. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleBrowser = async () => {
    try {
      if (isValidURL(EULAPrivacyLink)) {
        await WebBrowser.openBrowserAsync(EULAPrivacyLink);
      }
    } catch (error) {
      showToast("error", "Error Occured", "Cannot Open Document");
    }
  };

  // Opens the support portal in the in-app browser so users who can't log in can
  // still reach help. Mirrors the Contact Us behaviour in profSettings.
  const handleSupport = async () => {
    try {
      await WebBrowser.openBrowserAsync(
        "https://services.german-emirates-club.com/support"
      );
    } catch (error) {
      showToast("error", "Error Occurred", "Cannot Open Support Page");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "white", justifyContent: "center", alignItems: "center" }}>
        <View style={{ alignItems: "center", height: 400, justifyContent: "center" }}>
          <Image style={{ width: 170, resizeMode: "contain", top: 0 }} source={companyLogo} />
          <View style={{ position: "absolute", alignItems: "center", bottom: 0, right: 0, left: 0 }}>
            <ActivityIndicator size="large" color="#FFB400" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: "black" }}>
        <Background>
          <SafeArea style={{ flex: 1 }}>
            <KeyboardAwareScrollView
              automaticallyAdjustKeyboardInsets
              keyboardShouldPersistTaps="always"
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <View style={{ flex: 1, justifyContent: "space-between" }}>
                <LoginHeader companyLogo={companyLogo} />

                <LoginForm
                  username={username}
                  password={password}
                  setUsername={setUsername}
                  setPassword={setPassword}
                  checked={checked}
                  setChecked={setChecked}
                  loginLoading={loginLoading}
                  handleLogin={handleLogin}
                  handleForgetPassword={handleForgetPassword}
                  handleBrowser={handleBrowser}
                />

                {/* ✅ Pass biometric object + dedicated loading state */}
                <BiometricLogin
                  biometric={biometric}
                  biometricLoading={biometricLoading}
                  handleBiometricLogin={handleBiometricLogin}
                  i18n={i18n}
                />

                {canRegister && <RegisterSection navigation={navigation} theme={theme} />}

                {/* Support link — lets users who can't log in reach the portal */}
                <TouchableOpacity
                  onPress={handleSupport}
                  activeOpacity={0.7}
                  style={styles.supportLink}
                >
                  <Text style={styles.supportText}>
                    Having trouble? Contact Support
                  </Text>
                </TouchableOpacity>
              </View>
            </KeyboardAwareScrollView>
          </SafeArea>
        </Background>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  supportLink: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  supportText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});