import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";
import { navigate } from "../../navigation/navigate";
import { config } from "../../utils/constants";

let headers = {};

export const axiosInstance = axios.create({
  baseURL: config.BASE_URL,
  headers,
  timeout: 15000, //15 secs
  timeoutErrorMessage: "Server Error, Please contact the developer!",
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.log("Axios Error: " + error.message);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return new Promise((resolve, reject) => {
      resolve(response);
    });
  },
  (error) => {
    const _title =
      (error &&
        error.response &&
        error.response.data &&
        error.response.data.title) ??
      "Alert";
    const _message =
      (error &&
        error.response &&
        error.response.data &&
        error.response.data.message) ??
      "Error Occured";

    if (!error.response) {
      return new Promise((resolve, reject) => {
        // console.log(error.response);
        // console.log(error);
        // navigate("Logout");
        reject({
          status: error.response.status,
          title: _title,
          message: _message,
        });
      });
    }

    if (error.response.status === 403) {
      return new Promise((resolve, reject) => {
        // navigate("Logout");
        alert(error.response.data.message);
        reject(error.response.data.message);
      });
    } else if (error.response.status === 503) {
      Alert.alert("Service Unavailable", "Could not reach the server");
      return new Promise((resolve, reject) => {
        console.log("asdfasd");
        reject(error.response);
      });
    } else {
      return new Promise((resolve, reject) => {
        reject({
          status: error.response.status,
          title: _title,
          message: _message,
        });
        // reject(error.response.status);
      });
    }
  }
);
