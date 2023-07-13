import { StyleSheet, Text, View } from "react-native";
import React from "react";
import moment from "moment";

export default function useLog() {
  const logTime = (text) => {
    console.log(`${moment(Date.now()).format("hh:mm:ss.SSS")}:`, text);
  };

  return { logTime };
}

const styles = StyleSheet.create({});
