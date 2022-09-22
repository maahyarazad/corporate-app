import React, { createContext, useContext, useRef, useState } from "react";
import { Alert } from "react-native";
import { AuthContext } from "../auth/auth.context";
import * as SecureStore from "expo-secure-store";
import { axiosInstance } from "../interceptor/axiosInstance";
import { UserContext } from "../user/user.context";

export const UploadContext = createContext();

export const UploadContextProvider = ({ children }) => {
  const { setUser, user } = useContext(AuthContext);
  const { getUserInfo } = useContext(UserContext);
  const [loading, setLoading] = useState(false);

  const controller = useRef();

  const uploadCard = async (formData) => {
    controller.current = new AbortController();
    axiosInstance
      .post("user/request-access", formData, {
        signal: controller.current.signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      })
      .then(async (response) => {
        try {
          getUserInfo(user.user_id);
          setUser({ ...user, submitCard: 1 });
          await SecureStore.setItemAsync("submitCard", "1");
          setLoading(false);
        } catch (err) {
          console.log(err);
        }
      })
      .catch((err) => {
        if (err.code === "ERR_CANCELED") {
          Alert.alert("Upload Cancelled", "Upload cancelled by User.");
          return;
        }
        Alert.alert(
          "Upload Error",
          "Error in server, please contact the administrator"
        );
      });
  };

  const abortUpload = () => {
    if (controller != undefined) {
      controller.current.abort();
    }
  };

  const contextValue = {
    uploadCard,
    loading,
    setLoading,
    abortUpload,
  };

  return (
    <UploadContext.Provider value={contextValue}>
      {children}
    </UploadContext.Provider>
  );
};
