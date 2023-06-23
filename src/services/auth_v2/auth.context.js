import React, { createContext, useState } from "react";
import * as SecureStorage from "expo-secure-store";

export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [refreshToken, setRefreshToken] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [phoneVerified, setPhoneVerified] = useState(false);

  /**
   * @param {string} refreshToken
   * @param {string} accessToken
   *
   * @description
   * Store both tokens in the context and in the securestorage
   *
   */
  const signin = async (refToken, accToken) => {
    try {
      setRefreshToken(refToken);
      setAccessToken(accToken);
      await SecureStorage.setItemAsync("refreshToken", refToken);
      await SecureStorage.setItemAsync("accessToken", accToken);
    } catch (error) {
      console.error("Failed in storing the tokens:", error);
    }
  };

  /**
   *
   * @description
   * Remove both tokens in context and in the securestorage
   *
   */
  const signout = () => {};

  /**
   * @param {string} code
   *
   * @description
   * Verify the code against smsglobal API
   *
   * @returns
   */
  const verifyOTP = async () => {
    setPhoneVerified(true);
    await SecureStorage.setItemAsync("verified", true);
  };
  /**
   *
   * @description
   * Retrieve the info in the SecureStorage and assign them to the context states
   *
   * @returns accessToken: string, refreshToken: string
   */
  const retrieveInfo = () => {};

  const values = {
    signin,
    signout,
    verifyOTP,
    refreshToken,
    accessToken,
    setAccessToken,
    phoneVerified,
  };

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
