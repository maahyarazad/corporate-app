import { View, Text } from "react-native";
import React, { Children, createContext, useEffect, useState } from "react";
import { showToast } from "../../Toast";
import useRequest from "../../../hooks/useRequest";
import * as SecureStorage from "expo-secure-store";
import useAuth from "../../../hooks/useAuth";

export const UserContext = createContext(null);

const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const {
    refreshToken,
    accessToken,
    authorize,
    unauthorize,
    goToVerification,
    isAuthorized,
    hasSubmit,
    isSkip,
  } = useAuth();
  const request = useRequest();

  useEffect(() => {
    let isMounted = true;

    //Retrieve Data from Device during startup
    const retrieveUserData = async () => {
      try {
        await checkAuthorization();
      } catch (error) {
        console.log("Failed to retrieve user data: ", error);
      }
    };

    if (refreshToken && accessToken && !userData) retrieveUserData();

    return () => {
      isMounted = false;
    };
  }, [refreshToken, accessToken]);

  const syncUserInfo = async () => {
    try {
          
      
      const response = await request(
        "/v2/auth/me",
        "get",
        null,
        null,
        null,
        accessToken
      );
      //Fetch user data from database and store in device
     

  
    //   console.log("bio token", response.data.biometric_token);
      const bioToken = await SecureStorage.getItemAsync("biometric_token");
      if (bioToken) {
        console.log(
          "bio token match",
          bioToken === response.data.biometric_token
        );
        if (bioToken !== response.data.biometric_token) {
        }
      }
    //   console.log("overriding biotoken");
      if (response.data.biometric_token != null) {
        // console.log("biometric_token", response.data.biometric_token);
        await SecureStorage.setItemAsync(
          "biometric_token",
          response.data.biometric_token
        );
      } else {
        await SecureStorage.deleteItemAsync("biometric_token");
      }

      if (accessToken && response && response.success) {
        setUserData(response.data);

        SecureStorage.setItemAsync("userData", JSON.stringify(response.data));
        // console.log("USER DATA");
        return response.data;
      } else {
        const lastSuccessfulUserData = await SecureStorage.getItemAsync(
          "userData"
        );
        // console.log("USER BACK UP");
        setUserData(JSON.parse(lastSuccessfulUserData));
        return null;
        // return lastSuccessfulUserData;
      }
    } catch (error) {
      console.log("Failed to get user info: ", error);
    }
  };

  const checkAuthorization = async () => {
    try {
      const response = await syncUserInfo();
      
      if (
        response?.expired === 1 &&
        response?.member === 0 &&
        response?.isAuthorized === 1 &&
        response?.hasSubmit === 1
      ) {
        updateAuthDB();
        showToast(
          "error",
          "Card Expired",
          "Your card has expired. Please contact your HR Department to renew your card."
        );
        goToVerification();
      } else if (
        response?.isAuthorized === 0 &&
        response?.hasSubmit === 0 &&
        !!isSkip
      ) {
        unauthorize();
      } else if (response?.isAuthorized === 1) {
        authorize();
      }
    } catch (error) {
      console.log("Failed to check user status:", error);
    }
  };

  const updateAuthDB = async () => {
    try {
      //Update user status to unauthorized in Server
      const unauth = await request("/v2/auth/unauthorize", "put", {
        user_id: userData.user_id,
      });
      if (unauth.success) {
        await SecureStorage.setItemAsync("isAuthorized", "0");
        await SecureStorage.setItemAsync("hasSubmit", "0");
      }
    } catch (error) {
      console.log("Failed to update DB status:", error);
    }
  };

  const values = {
    getUserInfo: syncUserInfo,
    setUserData,
    userData,
    checkAuthorization,
  };

  return <UserContext.Provider value={values}>{children}</UserContext.Provider>;
};

export default UserProvider;
