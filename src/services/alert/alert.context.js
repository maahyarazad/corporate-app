import { View, Text, Alert } from "react-native";
import React, { createContext, useRef, useState } from "react";

export const AlertContext = createContext(null);

const AlertContextProvider = ({ children }) => {
  const isAlertShown = useRef(false);

  const showAlert = ({ title = "Alert", message }) => {
    if (!isAlertShown.current) {
      //   setIsAlertShown(true);
      isAlertShown.current = true;
      Alert.alert(title, message, [
        {
          text: "OK",
          //   onPress: () => setIsAlertShown(false),
          onPress: () => {
            isAlertShown.current = false;
          },
        },
      ]);
    }
  };

  const value = { showAlert, isAlertShown };

  return (
    <AlertContext.Provider value={value}>{children}</AlertContext.Provider>
  );
};

export default AlertContextProvider;
