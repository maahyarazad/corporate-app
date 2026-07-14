import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
import { showToast } from "../../Toast";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const { i18n, setLang } = useContext(TranslationContext);

  const [isLoading, setIsLoading] = useState(false);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [user, setUser] = useState({});
  const [noConnection, setNoConnection] = useState(false);
  const [noConnectionRetry, setNoConnectionRetry] = useState({});
  const [skip, setSkip] = useState(null);

  // Refs keep a stable identity across renders, so they never need to be deps.
  const isLogout = useRef(false);

  // --- Callbacks -------------------------------------------------------------

  const logout = useCallback(async () => {
    setIsLoading(true);
    isLogout.current = true;
    // Functional update -> no dependency on `user`, so logout stays stable.
    setUser((prev) => ({
      ...prev,
      token: null,
      status: 0,
      requestId: null,
    }));
    setSkip(0);
    await removeStorage();
    setIsLoading(false);
  }, []);

  const isAuthorized = useCallback(async () => {
    try {
      return await checkAuthorization();
    } catch (error) {
      console.log("============= SECOND ==============");
      throw error;
    }
  }, []);

  const retrieve = useCallback(async () => {
    try {
      setIsRetrieving(true);
      const user_id = await retrieveUserId();
      console.log("USERID:", user_id);

      if (user_id !== null) {
        setUser((prev) => ({ ...prev, user_id }));

        const result = await isAuthorized();

        if (result) {
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
          showToast(
            "error",
            "Card Expired",
            "Your membership card has expired. Please contact your administrator."
          );
          setUser((prev) => ({ ...prev, isAuthorized: 0, submitCard: 0 }));
        }

        setNoConnection(false);
      }
    } catch (err) {
      switch (err.status) {
        case 0:
          setNoConnection(true);
          // Safe self-reference: retrieve's deps (isAuthorized, logout) are
          // stable for the component's lifetime, so this never goes stale.
          setNoConnectionRetry({ fn: () => retrieve() });
          break;
        case 403:
          setNoConnection(false);
          showToast("error", err.title, err.message);
          logout();
          break;
      }
    } finally {
      setIsRetrieving(false);
    }
  }, [isAuthorized, logout]);

  const verify = useCallback(
    (otp_details) => {
      return new Promise((resolve) => {
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
              showToast(
                "error",
                i18n.t("auth.fail-header"),
                i18n.t("auth.fail-msg")
              );
            }
            setIsLoading(false);
            resolve(0);
          });
      });
    },
    [i18n]
  );

  const login = useCallback(
    (credentials, setLoading) => {
      return new Promise(async (resolve, reject) => {
        const deviceInfo = await getDeviceInfo();
        axiosInstance
          .post(`user/login`, { ...credentials, ...deviceInfo })
          .then(async (response) => {
            try {
              const res = response.data;
              setLang(res.member ? "de" : "en");

              if (res.member) {
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
            showToast("error", err.title, err.message);
            reject(err);
          });
      });
    },
    [setLang]
  );

  // --- Effects ---------------------------------------------------------------

  // Bootstrap once on mount: load skip flag, device info and token.
  useEffect(() => {
    // SecureStore and device-info reads can't be aborted; this only discards
    // their results once the provider has gone away.
    let cancelled = false;

    (async () => {
      const getSkip = parseInt(await SecureStore.getItemAsync("skip"));
      const deviceInfo = await getDeviceInfo();
      const token = await retrieveToken();

      if (cancelled) return;

      setSkip(getSkip);
      setUser((prev) => ({ ...prev, ...deviceInfo, token }));
      // if (token) await retrieve();
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist `skip` whenever it changes.
  useEffect(() => {
    if (!skip) return;

    let active = true;
    (async () => {
      if (active) await SecureStore.setItemAsync("skip", skip.toString());
    })();

    return () => {
      active = false;
    };
  }, [skip]);

  // --- Context value ---------------------------------------------------------

  const contextValue = useMemo(
    () => ({
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
    }),
    [
      logout,
      login,
      verify,
      retrieve,
      isLoading,
      isRetrieving,
      skip,
      user,
      noConnection,
      noConnectionRetry,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};