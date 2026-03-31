import * as SecureStore from "expo-secure-store";
import { axiosInstance } from "../interceptor/axiosInstance";
import * as Network from "expo-network";
import * as Application from "expo-application";
import Constants from "expo-constants";
import { Platform } from "react-native";

export const verifyOTP = async (otp_details) => {
  try {
    const response = await axiosInstance.post("user/verify", otp_details);
    const res = response.data;

    if (!res?.success) {
      throw new Error(res?.message || "Invalid Code");
    }

    await storeToken(res.token);
    return res;
  } catch (err) {
    console.log("verifyOTP error:", err);
    throw new Error(err?.response?.data?.message || err?.message || "Invalid Code");
  }
};

export const getDeviceInfo = async () => {
  const platform = Platform.OS;

  let ip_address = "";
  let device_id = "";
  let version = "";

  try {
    ip_address = await Network.getIpAddressAsync();
  } catch (err) {
    console.log("getDeviceInfo ip error:", err);
  }

  try {
    if (platform === "ios") {
      device_id = (await Application.getIosIdForVendorAsync()) || "";
    } else if (platform === "android") {
      device_id = Application.getAndroidId() || "";
    } else {
      device_id = "n/a";
    }
  } catch (err) {
    console.log("getDeviceInfo device id error:", err);
    device_id = "";
  }

  try {
    version =
      Constants.expoConfig?.version ||
      Constants.manifest2?.extra?.expoClient?.version ||
      Constants.manifest?.version ||
      "";
  } catch (err) {
    console.log("getDeviceInfo version error:", err);
    version = "";
  }

  return {
    ip_address,
    device_id,
    platform,
    version,
  };
};

export const retrieveToken = async () => {
  try {
    return await SecureStore.getItemAsync("token");
  } catch (err) {
    console.log("retrieveToken error:", err);
    throw err;
  }
};

export const storeToken = async (value) => {
  try {
    await SecureStore.setItemAsync("token", value);
    return true;
  } catch (err) {
    console.log("storeToken error:", err);
    throw err;
  }
};

export const removeStorage = async () => {
  try {
    console.log("-----Remove------\n");
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("user_id");
    await SecureStore.deleteItemAsync("user_details");
    await SecureStore.deleteItemAsync("skip");
    await SecureStore.deleteItemAsync("pushtoken");
    return true;
  } catch (err) {
    console.log("removeStorage error:", err);
    return false;
  }
};

export const resendOTP = async (user_id) => {
  try {
    const response = await axiosInstance.post("user/resend-otp", { user_id });
    return response.data?.success ?? false;
  } catch (err) {
    console.log("resendOTP error:", err);
    return false;
  }
};

export const checkAuthorization = async () => {
  try {
    const response = await axiosInstance.post("user/check-authorization/");
    return response.data?.result;
  } catch (err) {
    console.log("checkAuthorization error:", err);
    throw err;
  }
};

export const retrieveUserId = async () => {
  try {
    return await SecureStore.getItemAsync("user_id");
  } catch (err) {
    console.log("retrieveUserId error:", err);
    return null;
  }
};