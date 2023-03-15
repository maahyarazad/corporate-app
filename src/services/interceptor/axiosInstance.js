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
        // navigate("Logout");
        console.log("interceptor error response");
        console.log("hhmmm HERE");
        reject({
          status: error.response.status,
          title: error.response.data.title ?? "Alert",
          message: error.response.data.message ?? "Error Occurred",
        });
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
      return new Promise((resolve, reject) => {
        console.log("asdfasd");
        reject(error.response);
      });
    } else {
      // return new Promise((resolve, reject) => {
      //   // const { title = "Error" } = error.response.data;

      //   // console.log(error.response.data);
      //   // Alert.alert(title, error.response.data.message);
      //   // Alert.alert(title, "Something went wrong");
      //   reject("Something went wrong");
      // });
      return new Promise((resolve, reject) => {
        // alert("IN HERE");
        reject({
          status: error.response.status,
          title: error.response.data.title ?? "Alert",
          message: error.response.data.message ?? "Error Occurred",
        });
        // reject(error.response.status);
      });
    }
  }
);
