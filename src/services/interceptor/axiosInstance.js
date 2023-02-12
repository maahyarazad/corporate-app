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
    if (!error.response) {
      return new Promise((resolve, reject) => {
        // console.log(error.response);
        // console.log(error);
        console.log("interceptor error response");
        reject(error);
      });
    }

    if (error.response.status === 403) {
      return new Promise((resolve, reject) => {
        navigate("Logout");
        alert(error.response.data.message);
        reject(error.response.data.message);
      });
    } else if (error.response.status === 503) {
      Alert.alert("Service Unavailable", "Could not reach the server");
      reject(error.response);
    } else {
      return new Promise((resolve, reject) => {
        const { title = "Error" } = error.response.data;

        console.log(error.response);
        Alert.alert(title, error.response.data.message);
        reject(error.response);
      });
    }
  }
);
