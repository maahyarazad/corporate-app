import React, { createContext, useRef } from "react";
import { showToast } from "../../Toast";

export const AlertContext = createContext(null);

const AlertContextProvider = ({ children }) => {
  const isAlertShown = useRef(false);

  const showAlert = ({ title = "Alert", message }) => {
    if (!isAlertShown.current) {
      isAlertShown.current = true;
      showToast("info", title, message);
      // The toast auto-dismisses; release the guard so later alerts can show.
      isAlertShown.current = false;
    }
  };

  const value = { showAlert, isAlertShown };

  return (
    <AlertContext.Provider value={value}>{children}</AlertContext.Provider>
  );
};

export default AlertContextProvider;
