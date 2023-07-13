import React, { createContext, useEffect, useState } from "react";
import * as SecureStorage from "expo-secure-store";

export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [refreshToken, setRefreshToken] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [hasSubmit, setHasSubmit] = useState(null);
  const [isSkip, setIsSkip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [noConnection, setNoConnection] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        setLoading(true);
        const flags = await retrieveInfo();
        console.log("FLAGS", flags);
        if (flags && isMounted) {
          await setTimeout(() => {
            setRefreshToken(flags._refreshToken);
            setAccessToken(flags._accessToken);
            setPhoneVerified(flags._phoneVerified);
            setHasSubmit(flags._hasSubmit);
            setIsSkip(flags._isSkip);
            setLoading(false);
          }, 1000);
        }
      } catch (error) {
      } finally {
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

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
  const signout = async () => {
    try {
      setRefreshToken(null);
      setAccessToken(null);
      setPhoneVerified(null);
      await SecureStorage.deleteItemAsync("refreshToken");
      await SecureStorage.deleteItemAsync("accessToken");
      await SecureStorage.deleteItemAsync("verified");
      await SecureStorage.deleteItemAsync("hasSubmit");
      await SecureStorage.deleteItemAsync("userData"); //Not Sure to delete?
    } catch (error) {
      console.error("Failed in removing the tokens:", error);
    }
  };

  /**
   * @param {string} code
   *
   * @description
   * Verify the code against smsglobal API
   *
   * @returns success
   */
  const verifyOTP = async () => {
    try {
      setPhoneVerified(true);
      await SecureStorage.setItemAsync("refreshToken", refreshToken);
      await SecureStorage.setItemAsync("accessToken", accessToken);
      await SecureStorage.setItemAsync("verified", "true");
    } catch (error) {
      console.error("Failed to store: ", error);
    }
  };

  /**
   *
   * @description
   * Change status to submitted card
   *
   */
  const submittedCard = async () => {
    try {
      setHasSubmit("1");
      await SecureStorage.setItemAsync("hasSubmit", "1");
    } catch (error) {
      console.error("Failed to store: ", error);
    }
  };

  /**
   *
   * @description
   * Skips account verification but cant redeem offers
   *
   */
  const skipAuth = async () => {
    try {
      setIsSkip(true);
      await SecureStorage.setItemAsync("isSkip", "1");
    } catch (error) {
      console.error("Failed to store: ", error);
    }
  };

  /**
   *
   * @description
   * Navigate to card verification page
   *
   */
  const goToVerification = () => {
    setIsSkip(false);
  };

  /**
   *
   *
   * @description
   * Retrieve the info in the SecureStorage and assign them to the context states
   *
   * @returns accessToken: string, refreshToken: string, phoneVerified: boolean
   */
  const retrieveInfo = async () => {
    const _refreshToken = await SecureStorage.getItemAsync("refreshToken");
    const _accessToken = await SecureStorage.getItemAsync("accessToken");
    const _phoneVerified = await SecureStorage.getItemAsync("verified");
    const _hasSubmit = await SecureStorage.getItemAsync("hasSubmit");
    const _isSkip = await SecureStorage.getItemAsync("isSkip");

    return { _refreshToken, _accessToken, _phoneVerified, _hasSubmit, _isSkip };
  };

  const values = {
    signin,
    signout,
    verifyOTP,
    loading,
    refreshToken,
    accessToken,
    isSkip,
    setAccessToken,
    phoneVerified,
    submittedCard,
    hasSubmit,
    skipAuth,
    goToVerification,
    noConnection,
    setNoConnection,
  };

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
