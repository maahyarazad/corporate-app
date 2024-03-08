import React, { createContext, useEffect, useRef, useState } from "react";
import * as SecureStorage from "expo-secure-store";
import useUser from "../../../hooks/useUser";
import useRequest from "../../../hooks/useRequest";
import axios from "axios";
import { config } from "../../utils/constants";

export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [refreshToken, setRefreshToken] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [hasSubmit, setHasSubmit] = useState(null);
  const [isSkip, setIsSkip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [noConnection, setNoConnection] = useState(false);
  const [noConnectionRetry, setNoConnectionRetry] = useState({});
  // const request = useRequest();
  const isMounted = useRef(true);
  const initialize = async () => {
    try {
      setLoading(true);
      const flags = await retrieveInfo();
      console.log("FLAG", flags);
      if (flags && isMounted.current) {
        await setTimeout(() => {
          setRefreshToken(flags._refreshToken);
          setAccessToken(flags._accessToken);
          setIsAuthorized(parseInt(flags._isAuthorized));
          setPhoneVerified(flags._phoneVerified);
          setHasSubmit(parseInt(flags._hasSubmit ?? 0));
          setIsSkip(parseInt(flags._isSkip));
          setLoading(false);
        }, 0);
        setNoConnection(false);
      }
    } catch (error) {
    } finally {
    }
  };

  useEffect(() => {
    initialize();

    return () => {
      isMounted.current = false;
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
  const signout = async () => {
    try {
      setRefreshToken(null);
      setAccessToken(null);
      setPhoneVerified(null);
      setIsAuthorized(null);
      setHasSubmit(null);
      setIsSkip(null);
      await SecureStorage.deleteItemAsync("refreshToken");
      await SecureStorage.deleteItemAsync("accessToken");
      await SecureStorage.deleteItemAsync("verified");
      await SecureStorage.deleteItemAsync("hasSubmit");
      await SecureStorage.deleteItemAsync("isSkip");
      await SecureStorage.deleteItemAsync("isAuthorized");
      await SecureStorage.deleteItemAsync("userData"); //Not Sure to delete?

      const logout = await axios
        .request({
          method: "put",
          url: "/v2/auth/logout",
          baseURL: config.SERVER_HOST,
          timeout: 15000,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .catch(async (err) => {
          switch (err.response.status) {
            case 401:
              const response = await axios.get("/v2/auth/refresh_token", {
                baseURL: config.SERVER_HOST,
                headers: {
                  Authorization: `Bearer ${refreshToken}`,
                },
              });

              if (response.data.success) {
                const newAccessToken = response.data.accessToken;
                const _logout = await axios.request({
                  method: "put",
                  url: "/v2/auth/logout",
                  baseURL: config.SERVER_HOST,
                  timeout: 15000,
                  headers: {
                    Authorization: `Bearer ${newAccessToken}`,
                  },
                });
              }
              break;
          }
        });
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
      setHasSubmit(1);
      await SecureStorage.setItemAsync("hasSubmit", "1");
    } catch (error) {
      console.error("Failed to store: ", error);
    }
  };

  const authorize = async () => {
    try {
      setIsAuthorized(1);
      await SecureStorage.setItemAsync("isAuthorized", "1");
    } catch (error) {
      console.error("Failed to store: ", error);
    }
  };

  const unauthorize = async () => {
    try {
      setIsAuthorized(0);
      setHasSubmit(0);

      await SecureStorage.setItemAsync("hasSubmit", "0");
      await SecureStorage.setItemAsync("isAuthorized", "0");
      console.log("unauth");
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
  const goToVerification = async () => {
    try {
      setIsSkip(false);
      setIsAuthorized(0);
      setHasSubmit(0);
      await SecureStorage.setItemAsync("hasSubmit", "0");
      await SecureStorage.setItemAsync("isAuthorized", "0");
    } catch (error) {
      console.log("Failed to store: ", error);
    }
  };

  const renewAccessToken = async (token) => {
    setAccessToken(token);

    await SecureStorage.setItemAsync("accessToken", token);
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
    const _isAuthorized = await SecureStorage.getItemAsync("isAuthorized");
    const _hasSubmit = await SecureStorage.getItemAsync("hasSubmit");
    const _isSkip = await SecureStorage.getItemAsync("isSkip");

    return {
      _refreshToken,
      _accessToken,
      _phoneVerified,
      _isAuthorized,
      _hasSubmit,
      _isSkip,
    };
  };

  const values = {
    signin,
    signout,
    verifyOTP,
    loading,
    refreshToken,
    accessToken,
    isSkip,
    renewAccessToken,
    phoneVerified,
    submittedCard,
    isAuthorized,
    hasSubmit,
    skipAuth,
    goToVerification,
    noConnection,
    setNoConnection,
    noConnectionRetry,
    setNoConnectionRetry,
    initialize,
    authorize,
    unauthorize,
  };

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
