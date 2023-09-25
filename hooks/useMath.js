import { View, Text } from "react-native";
import React from "react";

const useMath = () => {
  function limitToTwoDecimalPlaces(num) {
    let rounded = Math.floor(num * 100) / 100;
    return rounded % 1 !== 0 ? rounded : Math.floor(rounded);
  }

  return { limitToTwoDecimalPlaces };
};

export default useMath;
