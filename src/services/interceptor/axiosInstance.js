import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";
import { config } from "../../utils/constants";
import { showToast } from "../../Toast"; 

export const axiosInstance = axios.create({
  baseURL: config.BASE_URL,
  timeout: 600000,
  timeoutErrorMessage: "Server Error, Please contact the developer!",
});

/* ================= REQUEST ================= */

axiosInstance.interceptors.request.use(
  async (config) => {
    console.log(config.baseURL);
    const token = await SecureStore.getItemAsync("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ================= RESPONSE ================= */

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {

      showToast(
        "error",
        "Network Error",
        "Unable to reach server"
      );

      return Promise.reject({
        status: 0,
        title: "Network Error",
        message: "Unable to reach server",
      });
    }

    const { status, data } = error.response;

    const title = data?.title ?? "Alert";
    const message = data?.message ?? "Error Occurred";

    if (status === 403) {

      showToast(
        "error",
        "Unauthorized",
        message
      );

      return Promise.reject(message);
    }

    if (status === 503) {

      showToast(
        "error",
        "Service Unavailable",
        "Could not reach the server"
      );

      return Promise.reject(error.response);
    }

    return Promise.reject({
      status,
      title,
      message,
    });
  }
);