import { View, Text } from "react-native";
import React, { useContext } from "react";
import { BottomDrawerContext } from "../src/services/bottomDrawer/bottomDrawer.context";

const useBottomDrawer = () => {
  return useContext(BottomDrawerContext);
};

export default useBottomDrawer;
