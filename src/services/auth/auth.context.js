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
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [isUserVerified, setIsUserVerified] = useState(false);
  const [user, setUser] = useState({});
  const isLogout = useRef(false);
  const { setLang } = useContext(TranslationContext);
  const [skip, setSkip] = useState(null);

  useEffect(() => {
    (async () => {
      await retrieve();
      const getSkip = parseInt(await SecureStore.getItemAsync("skip"));
      setSkip(getSkip);
      console.log("getSkip: ", getSkip);
    })();
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
      const deviceInfo = await getDeviceInfo();
      const user_id = await retrieveUserId();
      if (user_id !== null) {
        const result = await isAuthorized(user.token);
        console.log("-------------");
        console.log("Authorized: ", result.isAuthorized);
        setUser({
          ...user,
          ...deviceInfo,
          user_id: user_id,
          token: await retrieveToken(),
          isAuthorized: result.isAuthorized,
          submitCard: result.hasSubmit,
          remarks: result.remarks,
          requestDate: result.date_created,
          requestId: result.requestId,
          member: result.member,
        });

        console.log("Result: ", result);

        if (result && result.expired) {
          Alert.alert(
            "Card Expired",
            "Your membership card has expired. Please login again."
          );
          // setExpired(true);
          setUser({ ...user, token: "" });
          removeStorage();
        }
      }
      // setUser({});
      // await SecureStore.deleteItemAsync("user_details");
      console.log("skip: ", skip);
    } catch (err) {
      alert(err);
    } finally {
      setIsRetrieving(false);
    }
  };

  const isAuthorized = async (user_id) => {
    return await checkAuthorization(user_id);
  };

  const logout = async () => {
    setIsLoading(true);
    isLogout.current = true;
    console.log("removing storage");
    setUser({ ...user, token: null, status: 0, requestId: null });
    setSkip(0);
    await removeStorage();
    setIsLoading(false);
  };

  const verify = async (otp_details) => {
    setIsLoading(true);
    verifyOTP(otp_details)
      .then((response) => {
        isLogout.current = false;
        setUser({ ...user, status: 1, token: response.token });
        setIsLoading(false);
        return true;
      })
      .catch((err) => {
        setIsLoading(false);
        alert(err);
        return false;
      });
  };

  const login = (credentials) => {
    return new Promise((resolve, reject) => {
      axiosInstance
        .post(`user/login`, credentials)
        .then(async (response) => {
          try {
            const res = response.data;
            if (res.member) {
              // alert(res.member_id);
              setLang("de");
              if (res.member_id) {
                navigate("UpdateMember", {
                  member_id: res.member_id,
                  credentials,
                });
                return;
              }
            } else {
              setLang("en");
            }
            await SecureStore.setItemAsync("user_id", res.user_id.toString());
            resolve(res);
          } catch (err) {
            console.log(err);
          }
        })
        .catch(() => {
          // console.log(err.data.message);
          reject();
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
    isUserVerified,
    resendOTP,
    setUser,
    user,
    storeToken,
    isLogout,
    skip,
    setSkip,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
