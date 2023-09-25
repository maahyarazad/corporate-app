import { View, Text } from "react-native";
import React, { createContext, useState } from "react";

export const BottomDrawerContext = createContext();

const BottomDrawerProvider = ({ children }) => {
  const [showBottomDrawer, setShowBottomDrawer] = useState(false);
  const [drawerContent, setDrawerContent] = useState(null);

  const drawerOpen = () => {
    setShowBottomDrawer(true);
  };

  const drawerClose = () => {
    setShowBottomDrawer(false);
    setDrawerContent(null);
  };

  const test = () => {
    alert("Test Complete");
  };

  const values = {
    test,
    showBottomDrawer,
    drawerOpen,
    drawerClose,
    drawerContent,
    setDrawerContent,
  };

  return (
    <BottomDrawerContext.Provider value={values}>
      {children}
    </BottomDrawerContext.Provider>
  );
};

export default BottomDrawerProvider;
