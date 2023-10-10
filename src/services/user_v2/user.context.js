import { View, Text, Alert } from "react-native";
import React, { Children, createContext, useEffect, useState } from "react";
import useRequest from "../../../hooks/useRequest";
import * as SecureStorage from "expo-secure-store";
import useAuth from "../../../hooks/useAuth";

export const UserContext = createContext(null);

const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const { refreshToken, accessToken } = useAuth();
  const request = useRequest();

  useEffect(() => {
    let isMounted = true;

    //Retrieve Data from Device during startup
    const retrieveUserData = async () => {
      try {
        await getUserInfo();
      } catch (error) {
        console.error("Failed to retrieve user data: ", error);
      }
    };

    if (refreshToken) retrieveUserData();

    return () => {
      isMounted = false;
    };
  }, [refreshToken]);

  const getUserInfo = async () => {
    try {
      const response = await request("/v2/auth/me", "get");
      //Fetch user data from database and store in device
      if (response && response.success) {
        setUserData(response.data);
        SecureStorage.setItemAsync("userData", JSON.stringify(response.data));
        return response.data;
      }
    } catch (error) {
      console.error("Failed to get user info: ", error);
    }
  };

  const values = {
    getUserInfo,
    setUserData,
    userData,
  };

  return <UserContext.Provider value={values}>{children}</UserContext.Provider>;
};

export default UserProvider;
