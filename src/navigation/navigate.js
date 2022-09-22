import { CommonActions } from "@react-navigation/native";
import React, { createRef } from "react";

export const navigationRef = createRef(null);

export const navigate = (name, params) => {
  if (navigationRef.current) navigationRef.current.navigate(name, params);
};

export const goback = () => {
  if (navigationRef.current) navigationRef.current.goBack();
};
