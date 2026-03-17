import { View, Text, Alert, Platform } from "react-native";
import React, { useEffect, useState } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import useRequest from "./useRequest";
import useUser from "./useUser";

const useBiometrics = () => {
  const [available, setAvailable] = useState(false);
  const [type, setType] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [token, setToken] = useState(null);
  const request = useRequest();
  const { userData } = useUser();

  useEffect(() => {
    checkBiometricStatus();

    return () => {};
  }, []);

  const checkBiometricStatus = async () => {
    try {
    //   console.log("Checking Biometric...s");

      //Check if device has biometrics
      const isBiometricAvailable = await LocalAuthentication.hasHardwareAsync();
    //   console.log("bio", isBiometricAvailable);
      setAvailable(isBiometricAvailable);

      //Check what type of biometrics is available
      const supportedBiometrics =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

      if (supportedBiometrics.includes(2)) {
        setType(false ? "face-id" : "face-recognition");
      } else if (supportedBiometrics.includes(1)) {
        setType("fingerprint");
      }

      //Check if biometric token is saved in app
      const biometricToken = await SecureStore.getItemAsync("biometric_token");
      setToken(biometricToken);

      //Check if user has enabled biometrics in phone settings
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setEnrolled(isEnrolled);
    } catch (error) {
      console.log("Failed to check biometrics:", error);
    }
  };

  const authenticate = async () => {
    const biometricAuth = await LocalAuthentication.authenticateAsync({
      promptMessage: "Login with Biometrics",
      cancelLabel: "Cancel",
      fallbackLabel: "Use Password",
    });

    return biometricAuth.success;
  };

  const enable = async () => {
    try {
      const biometricToken = await request("/v2/user/biometrics", "POST", {
        user_id: userData?.user_id,
        device_id: userData?.device_id,
        ip_address: userData?.ip_address,
        platform: userData?.platform,
      });

      if (!biometricToken.success) {
        Alert.alert(
          "Fehler!",
          "Aktivierung der biometrischen Authentifizierung fehlgeschlagen."
        );
        return;
      }
      await SecureStore.setItemAsync("biometric_token", biometricToken.data);
      Alert.alert("Erfolg!", `Biometrische Authentifizierung aktiviert.`);
      return true;
    } catch (error) {
      return false;
    }
  };

  const disable = async () => {
    const removeToken = await request("/v2/user/biometrics", "DELETE", {
      user_id: userData?.user_id,
      device_id: userData?.device_id,
    });
    // console.log("Remove Token", removeToken);
    await SecureStore.deleteItemAsync("biometric_token");
    Alert.alert("Erfolg!", "Biometrische Authentifizierung deaktiviert.");
  };

  return { available, type, enrolled, token, authenticate, enable, disable };
};
export default useBiometrics;
