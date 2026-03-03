import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { ActivityIndicator, Checkbox, TextInput } from "react-native-paper";
import { SafeArea } from "../../components/safearea.component";
import { Spacer } from "../../components/spacer/spacer.component";
import { Label } from "../../components/typography/label.component";
import styled from "styled-components/native";
import { useTheme } from "styled-components/native";
import { StatusBar } from "expo-status-bar";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { navigate } from "../../navigation/navigate";
import Background from "../../components/background/background.component";
import { CustomTextInput } from "../../components/customTextInput";
import * as WebBrowser from "expo-web-browser";
import { isValidURL } from "../../utils/isValidURL";
import { companyLogo, config, EULAPrivacyLink } from "../../utils/constants";
import useRequest from "../../../hooks/useRequest";
import useAuth from "../../../hooks/useAuth";
import { TranslationContext } from "../../services/translation/translation.context";
import * as Application from "expo-application";
import * as Network from "expo-network";
import * as Constants from "expo-constants";
import LoginHeader from "./login.components/LoginHeader";
import LoginForm from "./login.components/LoginForm";
import BiometricLogin from "./login.components/BiometricLogin";
import RegisterSection from "./login.components/RegisterSection";
import useBiometrics from "../../../hooks/useBiometrics";
import { useTranslation } from "../../../hooks/useTranslation";

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
  const [checked, setChecked] = useState(false);
  const [username, setUsername] = useState(null);
  const [password, setPassword] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [canRegister, setCanRegister] = useState(true);
  const request = useRequest();
  const { signin, loading } = useAuth();
  const { setLang } = useContext(TranslationContext);
  const [biometricType, setBiometricType] = useState(null);
  const theme = useTheme();
  const biometric = useBiometrics();
  const { i18n } = useTranslation();

  useEffect(() => {
    console.log("biometric", biometric);
    return () => {};
  }, [biometric.available]);

  const handleBiometricLogin = async () => {
    try {
      if (!biometric.enrolled) {
        Alert.alert(
          "Notice",
          `Please enable your ${biometric.type} in your device settings.`
        );
        return;
      }

      //Check if biometric token is available
      if (!biometric.token) {
        Alert.alert(
          "Notice",
          `Please enable '${i18n.t(
            `profile-tabs.settings-menu.login-${biometric.type}`
          )}' in your device settings. \n\n` +
            `${i18n.t("bottom-tabs.profile")} > ${i18n.t(
              "profile-tabs.settings"
            )} > ${i18n.t(
              `profile-tabs.settings-menu.login-${biometric.type}`
            )}`
        );
        return;
      }

      //Authenticate User
      const status = await biometric.authenticate();

      if (status) {
        console.log("Biometric Token:", biometric.token);

        const ip = await Network.getIpAddressAsync();
        const platform = Platform.OS;
        const deviceId =
          platform === "ios"
            ? await Application.getIosIdForVendorAsync()
            : platform === "android"
              ? await Application.androidId
              : "n/a";

        const credentials = {
          app_id: config.APP_ID,
          device_id: deviceId,
          ip_address: ip,
          platform: platform,
          version: Constants.default.expoConfig.version,
          biometric_token: biometric.token,
        };

        // const response = await login(credentials, setLoading);

        const response = await request("/v2/auth/login", "post", credentials);

        if (response.success) {
          setLang(response.member ? "de" : "en");
          if (response.member_id) {
            navigate("UpdateMember", {
              member_id: response.member_id,
              credentials,
            });
            return;
          }
          if (response.status) {
            signin(response.refreshToken, response.accessToken);
            navigation.navigate("VerifyOTP", {
              hiddenNumber: response.phone_number,
            });
          } else {
            signin(response.refreshToken, response.accessToken);
            navigation.navigate("Unverified Email", {
              userId: response.user_id,
            });
          }
        } else {
          Alert.alert(response.title, response.message);
        }
      } else {
      }
    } catch (error) {
      console.error("Failed to login using biometrics:", error);
    }
  };

  const handleForgetPassword = () => {
    navigate("ForgotPassword");
  };

  const handleLogin = async () => {
    try {
      setLoginLoading(true);
      if (
        (!username || username.trim().match(/^\s+$|^$/)) &&
        (!password || password.trim().match(/^\s+$|^$/))
      ) {
        Alert.alert("Invalid Login", "Please enter your username and password");
        return;
      }

      if (!username || username.trim().match(/^\s+$|^$/)) {
        Alert.alert("Invalid Login", "Please enter your username");
        return;
      }

      if (!password || password.trim().match(/^\s+$|^$/)) {
        Alert.alert("Invalid Login", "Please enter your password");
        return;
      }

      const ip = await Network.getIpAddressAsync();
      const platform = Platform.OS;
      const deviceId =
        platform === "ios"
          ? await Application.getIosIdForVendorAsync()
          : platform === "android"
            ? await Application.androidId
            : "n/a";

      const credentials = {
        app_id: config.APP_ID,
        username,
        password,
        device_id: deviceId,
        ip_address: ip,
        platform: platform,
        version: Constants.default.expoConfig.version,
      };

      // const response = await login(credentials, setLoading);

      const response = await request("/v2/auth/login", "post", credentials);
      if (response.success) {
        console.log("Response Login", response);
        setLang(response.member ? "de" : "en");
        if (response.member_id) {
          navigate("UpdateMember", {
            member_id: response.member_id,
            credentials,
          });
          return;
        }
        if (response.status) {
          signin(response.refreshToken, response.accessToken);
          navigation.navigate("VerifyOTP", {
            hiddenNumber: response.phone_number,
          });
        } else {
          signin(response.refreshToken, response.accessToken);
          navigation.navigate("Unverified Email", {
            userId: response.user_id,
          });
        }
      } else {
        Alert.alert(response.title, response.message);
      }
      setLoginLoading(false);

      //   console.log("LOGIN:", response);
      //   if (response.status) {
      //     setUser((prev) => ({
      //       ...prev,
      //       user_id: response.user_id,
      //       isAuthorized: response.isAuthorized,
      //       submitCard: response.hasSubmit,
      //       member: response.member,
      //     }));

      //     getUserInfo(response.user_id);

      //     navigation.navigate("VerifyOTP", {
      //       hiddenNumber: response.phone_number,
      //     });
      //   } else {
      //     navigation.navigate("Unverified Email", {
      //       userId: response.user_id,
      //     });
      //   }
    } catch (err) {
      console.log("ERROR", err);
    }
  };

  const handleBrowser = async () => {
    try {
      if (isValidURL(EULAPrivacyLink)) {
        await WebBrowser.openBrowserAsync(EULAPrivacyLink);
      }
    } catch (error) {
      Alert.alert("Error Occured", "Cannot Open Document");
    }
  };

  if (loading) {
    return (
      <>
        <View
          style={{
            flex: 1,
            backgroundColor: "white",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              alignItems: "center",
              height: 400,
              justifyContent: "center",
            }}
          >
            <Image
              style={{
                width: 170,
                resizeMode: "contain",
                top: 0,
              }}
              source={companyLogo}
            />

            <View
              style={[
                {
                  position: "absolute",
                  alignContent: "center",
                  alignItems: "center",
                  bottom: 0,
                  right: 0,
                  left: 0,
                },
              ]}
            >
              <ActivityIndicator
                size={"large"}
                color="#FFB400"
              ></ActivityIndicator>
            </View>
          </View>
        </View>
      </>
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

                <BiometricLogin
                  biometric={biometric}
                  handleBiometricLogin={handleBiometricLogin}
                  i18n={i18n}
                />

                {canRegister && (
                  <RegisterSection navigation={navigation} theme={theme} />
                )}
              </View>
            </KeyboardAwareScrollView>
          </SafeArea>
        </Background>
      </View>
    </>
  );
};

const styles = StyleSheet.create({});
