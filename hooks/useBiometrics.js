import { Platform } from "react-native";
import { useEffect, useState } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import useRequest from "./useRequest";
import useUser from "./useUser";
import { showToast } from "../src/Toast";

const BIOMETRIC_TOKEN_KEY = "biometric_token";

const useBiometrics = () => {
  const [available, setAvailable] = useState(false);
  const [type, setType] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [token, setToken] = useState(null);

  const request = useRequest();
  const { userData } = useUser();

  // Determine language based on card_image prefix
  const isEnglish = userData?.card_image?.startsWith("GEC-");

  const t = {
    enableSuccess: isEnglish
      ? { title: "Success!", message: "Biometric authentication enabled." }
      : { title: "Erfolg!", message: "Biometrische Authentifizierung aktiviert." },
    enableError: isEnglish
      ? { title: "Error!", message: "Failed to enable biometric authentication." }
      : { title: "Fehler!", message: "Aktivierung der biometrischen Authentifizierung fehlgeschlagen." },
    disableSuccess: isEnglish
      ? { title: "Success!", message: "Biometric authentication disabled." }
      : { title: "Erfolg!", message: "Biometrische Authentifizierung deaktiviert." },
    disableError: isEnglish
      ? { title: "Error!", message: "Failed to disable biometric authentication." }
      : { title: "Fehler!", message: "Deaktivierung der biometrischen Authentifizierung fehlgeschlagen." },
  };

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    try {
      const isBiometricAvailable = await LocalAuthentication.hasHardwareAsync();
      setAvailable(isBiometricAvailable);

      const supportedBiometrics =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

      if (supportedBiometrics.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setType(Platform.OS === "ios" ? "face-id" : "face-recognition");
      } else if (supportedBiometrics.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setType("fingerprint");
      }

      const biometricToken = await SecureStore.getItemAsync(BIOMETRIC_TOKEN_KEY);
      setToken(biometricToken);

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setEnrolled(isEnrolled);
    } catch (error) {
      console.error("Failed to check biometrics:", error);
    }
  };

  const authenticate = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Login with Biometrics",
        cancelLabel: "Cancel",
        fallbackLabel: "Use Password",
        disableDeviceFallback: false,
      });
      return result.success;
    } catch (error) {
      console.error("Authentication error:", error);
      return false;
    }
  };

  const enable = async () => {
    try {
      const response = await request("/v2/user/biometrics", "POST", {
        user_id: userData?.user_id,
        device_id: userData?.device_id,
        ip_address: userData?.ip_address,
        platform: userData?.platform,
      });

      console.log(userData);

      if (!response.success) {
        showToast("error", t.enableError.title, t.enableError.message);
        return false;
      }

      await SecureStore.setItemAsync(BIOMETRIC_TOKEN_KEY, response.data);
      setToken(response.data);
      showToast("info", t.enableSuccess.title, t.enableSuccess.message);
      return true;
    } catch (error) {
      console.error("Enable biometrics error:", error);
      return false;
    }
  };

  const disable = async () => {
    try {
      const response = await request("/v2/user/biometrics", "DELETE", {
        user_id: userData?.user_id,
        device_id: userData?.device_id,
      });

      if (!response.success) {
        showToast("error", t.disableError.title, t.disableError.message);
        return false;
      }

      await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY);
      setToken(null);
      showToast("info", t.disableSuccess.title, t.disableSuccess.message);
      return true;
    } catch (error) {
      console.error("Disable biometrics error:", error);
      return false;
    }
  };

  return { available, type, enrolled, token, authenticate, enable, disable, checkBiometricStatus };
};

export default useBiometrics;