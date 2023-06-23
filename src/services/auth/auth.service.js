import * as SecureStore from "expo-secure-store";
import { axiosInstance } from "../interceptor/axiosInstance";
import * as Network from "expo-network";
import * as Application from "expo-application";
import { navigate } from "../../navigation/navigate";
import { Alert, Platform } from "react-native";
import * as Constants from "expo-constants";

// const API_URL = `${config.BASE_URL}user`;

export const verifyOTP = (otp_details) => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`user/verify`, otp_details)
      .then((response) => {
        const res = response.data;
        if (res.success) {
          console.log("---------res---------");
          console.log(res);
          storeToken(res.token);
          resolve(res);
        } else {
          console.log(res);
          reject(res.message);
        }
      })
      .catch(() => {
        // console.log(err.response);
        reject("Invalid Code");
      });
  });
};

export const getDeviceInfo = async () => {
  try {
    const info = {};
    console.log("getting info");
    info.ip_address = await Network.getIpAddressAsync();
    const platform = Platform.OS;
    const deviceId =
      platform === "ios"
        ? await Application.getIosIdForVendorAsync()
        : platform === "android"
        ? await Application.androidId
        : "n/a";
    const version = Constants.default.expoConfig.version;
    info.device_id = deviceId;
    info.platform = platform;
    info.version = version;
    return info;
  } catch (err) {
    console.log("error in getting device info");
    console.log(err);
  }
};

export const retrieveToken = () => {
  return new Promise((resolve, reject) => {
    try {
      const data = SecureStore.getItemAsync("token");
      resolve(data);
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
};

// export const hasSubmitCard = () => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const data = await SecureStore.getItemAsync("submitCard");
//       resolve(parseInt(data));
//     } catch (err) {
//       console.log(err);
//       reject(err);
//     }
//   });
// };

export const storeToken = (value) => {
  return new Promise((resolve, reject) => {
    try {
      SecureStore.setItemAsync("token", value);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

export const removeStorage = async () => {
  try {
    console.log("-----Remove------\n");
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("user_id");
    await SecureStore.deleteItemAsync("user_details");
    await SecureStore.deleteItemAsync("skip");
    await SecureStore.deleteItemAsync("pushtoken");
  } catch (err) {
    console.log(err);
  }
};

export const resendOTP = async (user_id) => {
  return new Promise((resolve, reject) => {
    try {
      axiosInstance.post("user/resend-otp", { user_id }).then((response) => {
        resolve(response.success);
      });
    } catch (err) {
      console.log(err);
      reject(false);
    }
  });
};

export const checkAuthorization = async () => {
  return new Promise((resolve, reject) => {
    try {
      console.log("CHECKING");
      axiosInstance
        .post(`user/check-authorization/`)
        .then((response) => {
          // console.log("response:", response);
          resolve(response.data.result);
        })
        .catch((err) => {
          console.log("eehhh", err);
          navigate("Logout");
          reject(err);
        });
    } catch (err) {
      console.log(err);
    }
  });
};

export const retrieveUserId = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const userId = await SecureStore.getItemAsync("user_id");
      resolve(userId);
    } catch (err) {
      console.log(err);
      reject(null);
    }
  });
};
