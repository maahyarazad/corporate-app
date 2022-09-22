import React, { createContext, useEffect, useRef, useState } from "react";
import { adminFileBaseURL } from "../../utils/constants";
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

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [isUserVerified, setIsUserVerified] = useState(false);
  const [user, setUser] = useState({});
  const isLogout = useRef(false);

  useEffect(() => {
    (async () => {
      await retrieve();
    })();
  }, []);

  const retrieve = async () => {
    try {
      setIsRetrieving(true);
      const deviceInfo = await getDeviceInfo();
      const user_id = await retrieveUserId();
      const result = user_id !== null && (await isAuthorized(user_id));
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
      });
      console.log(user);
      setIsRetrieving(false);
    } catch (err) {
      console.log();
      alert(err);
    }
  };

  const isAuthorized = async (user_id) => {
    return await checkAuthorization(user_id);
  };

  const logout = async () => {
    setIsLoading(true);
    isLogout.current = true;
    setUser({ ...user, token: null, status: 0, requestId: null });
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
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
