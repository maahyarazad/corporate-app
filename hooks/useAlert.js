import { View, Text } from "react-native";
import React, { useContext } from "react";
import { AlertContext } from "../src/services/alert/alert.context";

const useAlert = () => {
  return useContext(AlertContext);
};

export default useAlert;
