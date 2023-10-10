import { View, Text, Alert } from "react-native";
import React from "react";

const useDialog = () => {
  const confirmDialog = (title, message, approve, reject) => {
    Alert.alert(title, message, [
      {
        text: "Cancel",
        onPress: () => reject(),
        style: "cancel",
      },
      {
        text: "OK",
        onPress: () => approve(),
      },
    ]);
  };

  return { confirmDialog };
};

export default useDialog;
