import React, { useContext, useEffect, useRef, useState } from "react";
import { Alert, Image, Platform, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Checkbox, TextInput } from "react-native-paper";
import { SafeArea } from "../../components/safearea.component";
import { Spacer } from "../../components/spacer/spacer.component";
import { Label } from "../../components/typography/label.component";
import styled from "styled-components/native";
import { LoadingOverlay } from "../../components/loading/loading.component";
import { useTheme } from "styled-components";
import { StatusBar } from "expo-status-bar";
import { AuthContext } from "../../services/auth/auth.context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { navigate } from "../../navigation/navigate";
import Background from "../../components/background/background.component";
import { CustomTextInput } from "../../components/customTextInput";
import { UserContext } from "../../services/user/user.context";
import * as WebBrowser from "expo-web-browser";
import { isValidURL } from "../../utils/isValidURL";
import { companyLogo, config, EULAPrivacyLink } from "../../utils/constants";
import useRequest from "../../../hooks/useRequest";
import useAuth from "../../../hooks/useAuth";
import { TranslationContext } from "../../services/translation/translation.context";
import * as Application from "expo-application";
import * as Network from "expo-network";
import * as Constants from "expo-constants";

export const TextInputForm = styled(TextInput)`
  border-radius: 10px;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
`;

export const LoginButton = styled(TouchableOpacity)`
  flex: 1;
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

  const theme = useTheme();

  const handleForgetPassword = () => [navigate("ForgotPassword")];

  const handleLogin = async () => {
    try {
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

      setLoginLoading(true);
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
        if (response.member_id) {
          navigate("UpdateMember", {
            member_id: response.member_id,
            credentials,
          });
          return;
        }
        if (response.status) {
          console.log("refreshToken", response.refreshToken);
          signin(response.refreshToken, response.accessToken);
          setLang(response.member ? "de" : "en");
          navigation.navigate("VerifyOTP", {
            hiddenNumber: response.phone_number,
          });
        } else {
          navigation.navigate("Unverified Email", {
            userId: response.user_id,
          });
        }
      } else {
        Alert.alert(response.title, response.message);
      }

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
      setLoading(false);
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
      {/* <LoadingOverlay display={loginLoading} /> */}
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: "black" }}>
        <Background>
          <SafeArea
            style={{
              height: "100%",
              backgroundColor: "transparent",
              justifyContent: "flex-end",
            }}
          >
            <KeyboardAwareScrollView
              automaticallyAdjustKeyboardInsets={true}
              keyboardShouldPersistTaps={"always"}
              style={{ height: "100%" }}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <View
                style={{
                  height: "100%",
                  justifyContent: "flex-end",
                }}
              >
                <Image
                  style={{
                    width: 100,
                    height: 50,
                    resizeMode: "contain",
                    marginLeft: 16,
                    position: "relative",
                    top: 0,
                  }}
                  source={companyLogo}
                />

                <View
                  style={{
                    flex: 1,
                    justifyContent: "flex-end",
                    margin: 16,
                  }}
                >
                  <Label
                    style={{
                      color: "white",
                    }}
                    shadow={true}
                    size={"h5"}
                    weight={"medium"}
                  >
                    {/* Wilkommen! */}
                    Welcome!
                  </Label>
                  <Spacer position={"top"} size={"small"} />
                  <Label
                    style={{ color: "white" }}
                    size={"caption"}
                    weight={"medium"}
                    shadow={true}
                  >
                    Sign in with your username and password.
                    {/* Melden Sie sich mit Ihrem Club-Benutzernamen und Passwort an. */}
                  </Label>
                  <Spacer position={"top"} size={"small"} />

                  <CustomTextInput
                    onChangeText={setUsername}
                    label={"Username or Email"}
                    value={username}
                    autoFillPassword={true}
                    textContentType={"username"}
                    // label={"Nutzername"}
                  />
                  <Spacer position={"top"} size={"small"} />
                  <CustomTextInput
                    onChangeText={setPassword}
                    secureTextEntry={true}
                    showEye={true}
                    textContentType={"password"}
                    value={password}
                    autoFillPassword={true}
                    label={"Password"}
                  />
                  <Spacer position={"top"} size={"medium"} />
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleForgetPassword}
                  >
                    <Label
                      shadow={true}
                      style={{
                        color: "white",
                        textDecorationLine: "underline",
                      }}
                    >
                      Forgot password?
                      {/* Passwort vergessen? */}
                    </Label>
                  </TouchableOpacity>
                  <Spacer position={"top"} size={"medium"} />
                  <Spacer position={"right"} size={"large"}>
                    <View style={{ flexDirection: "row" }}>
                      <Checkbox.Android
                        status={checked ? "checked" : "unchecked"}
                        onPress={() => {
                          setChecked(!checked);
                        }}
                        uncheckedColor="white"
                        color="white"
                      />
                      <View style={{ flex: 0.98 }}>
                        <Label
                          elevation={10}
                          shadow={true}
                          style={{ color: "white", elevation: 9 }}
                          size={"caption"}
                        >
                          {/* Ich akzeptiere die Endnutzer-Lizenzvereinbarung & die
                        Datenschutz-Bestimmungen. */}
                          {`I accept the `}
                          <Label
                            onPress={() => {
                              // navigate("Login Privacy Policy");
                              handleBrowser();
                            }}
                            style={{
                              color: "white",
                              textDecorationLine: "underline",
                            }}
                            size={"caption"}
                          >
                            End User License Agreement & the Privacy Policy.
                          </Label>
                        </Label>
                      </View>
                    </View>
                  </Spacer>

                  <Spacer position={"top"} size={"medium"} />

                  <LoginButton
                    onPress={handleLogin}
                    activeOpacity={0.8}
                    disabled={!checked}
                    checked={checked}
                  >
                    <Label style={{ color: "white" }} weight={"bold"}>
                      Login
                    </Label>
                  </LoginButton>
                </View>
                {canRegister && (
                  <View>
                    <View
                      style={{
                        height: 50,
                        justifyContent: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 25,
                          backgroundColor: "white",
                          position: "absolute",
                          alignSelf: "center",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 20,
                        }}
                      >
                        <Label size={"body"} weight={"bold"}>
                          OR
                        </Label>
                      </View>
                      <View
                        style={{
                          borderColor: "white",
                          borderTopWidth: 2,
                        }}
                      ></View>
                    </View>
                    <View
                      style={{
                        margin: 16,
                      }}
                    >
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          // navigation.navigate("RegisterSuccess");
                          navigation.navigate("Registration");
                        }}
                        style={{
                          height: 60,
                          backgroundColor: theme.colors.ui.button,
                          borderRadius: 5,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Label
                          style={{ color: "white", textAlign: "center" }}
                          size={"body"}
                          weight={"bold"}
                        >
                          {`Create an Account \n(Corporate Cardholders Only)`}
                        </Label>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </KeyboardAwareScrollView>
          </SafeArea>
        </Background>
      </View>
    </>
  );
};
