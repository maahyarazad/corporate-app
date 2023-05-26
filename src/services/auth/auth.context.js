import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { navigate } from "../../navigation/navigate";
import { adminFileBaseURL } from "../../utils/constants";
import * as SecureStore from "expo-secure-store";
import { axiosInstance } from "../interceptor/axiosInstance";
import { TranslationContext } from "../translation/translation.context";
import {
  verifyOTP,
  login,
  retrieveToken,
  removeStorage,
  resendOTP,
  storeToken,
  getDeviceInfo,
  checkAuthorization,
  retrieveUserId,
} from "./auth.service";
import { Alert } from "react-native";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const { i18n } = useContext(TranslationContext);
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [user, setUser] = useState({});
  const [noConnection, setNoConnection] = useState(false);
  const [noConnectionRetry, setNoConnectionRetry] = useState({});
  const isLogout = useRef(false);
  const { setLang } = useContext(TranslationContext);
  const [skip, setSkip] = useState(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const getSkip = parseInt(await SecureStore.getItemAsync("skip"));
      setSkip(getSkip);
      const deviceInfo = await getDeviceInfo();
      const token = await retrieveToken();
      setUser((prev) => ({
        ...prev,
        ...deviceInfo,
        token,
      }));
      if (!!token) {
        await retrieve();
      }
    })();

    return () => {
      let isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const saveSkip = async () => {
      if (isMounted) await SecureStore.setItemAsync("skip", skip.toString());
    };

    if (skip) {
      saveSkip();
    }

    return () => {
      isMounted = false;
    };
  }, [skip]);

  const retrieve = async () => {
    try {
      setIsRetrieving(true);
      // const deviceInfo = await getDeviceInfo();
      // const user_id = await retrieveUserId();
      const user_id = await retrieveUserId();
      console.log("USERID:", user_id);

      // console.log("[Retrieved User ID from LS]: ", user_id);
      // console.log("[Device Info]: ", deviceInfo);
      if (user_id !== null) {
        setUser((prev) => ({
          ...prev,
          user_id: user_id,
        }));

        // // console.log("CONSOLE LOG BEFORE AUTH");
        // console.log("[USER (CONTEXT)]: ", user);
        const token = await retrieveToken();
        const result = await isAuthorized(token);

        console.log("-------------");
        if (result) {
          console.log(result);
          console.log("Authorized: ", result.isAuthorized);
          setUser((prev) => ({
            ...prev,
            isAuthorized: result?.isAuthorized ?? 0,
            submitCard: result.hasSubmit,
            remarks: result.remarks,
            requestDate: result.date_created,
            requestId: result.requestId,
            member: result.member,
          }));
        }

        if (result && result.expired) {
          Alert.alert(
            "Card Expired",
            "Your membership card has expired. Please contact your administrator."
          );
          setUser((prev) => ({ ...prev, token: "" }));
          removeStorage();
        }
        setNoConnection(false);
      }
    } catch (err) {
      // console.log("erra: ", err);

      console.log("err:", err);
      switch (err.status) {
        case 0:
          setNoConnection(true);
          setNoConnectionRetry({
            fn: () => {
              console.log("aw");
              retrieve();
            },
          });
          break;
        case 403:
          setNoConnection(false);
          setUser({ ...user, token: "" });
          Alert.alert(err.title, err.message);

          break;
      }
    } finally {
      setIsRetrieving(false);
    }
  };

  const isAuthorized = async () => {
    try {
      return await checkAuthorization();
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    isLogout.current = true;
    setUser({ ...user, token: null, status: 0, requestId: null });
    setSkip(0);
    await removeStorage();
    setIsLoading(false);
  };

  const verify = async (otp_details) => {
    return new Promise((resolve, reject) => {
      setIsLoading(true);
      verifyOTP(otp_details)
        .then((response) => {
          isLogout.current = false;
          setUser((prev) => ({ ...prev, status: 1, token: response.token }));
          setIsLoading(false);
          resolve(1);
        })
        .catch((err) => {
          if (err === -1) {
            Alert.alert(i18n.t("auth.fail-header"), i18n.t("auth.fail-msg"));
          }
          setIsLoading(false);
          // alert(err);
          resolve(0);
        });
    });
  };

  const login = (credentials, setLoading) => {
    return new Promise(async (resolve, reject) => {
      const deviceInfo = await getDeviceInfo();
      axiosInstance
        .post(`user/login`, { ...credentials, ...deviceInfo })
        .then(async (response) => {
          try {
            const res = response.data;
            setLang(res.member ? "de" : "en");
            console.log("MEMBER", res);
            if (res.member) {
              // alert(res.member_id);
              if (res.member_id) {
                navigate("UpdateMember", {
                  member_id: res.member_id,
                  credentials,
                });
                setLoading(false);
                return;
              }
            }
            await SecureStore.setItemAsync("user_id", res.user_id.toString());
            resolve(res);
          } catch (err) {
            console.log(err);
          }
        })
        .catch((err) => {
          // console.log(err.data.message);
          Alert.alert(err.title, err.message);
          reject(err);
        });
    });
  };

  const contextValue = {
    logout,
    login,
    isLoading,
    verify,
    retrieve,
    isRetrieving,
    resendOTP,
    setUser,
    setSkip,
    skip,
    user,
    storeToken,
    isLogout,
    noConnection,
    setNoConnection,
    noConnectionRetry,
    setNoConnectionRetry,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
