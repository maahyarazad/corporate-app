import React, { useEffect, useState } from "react";
import { Text } from "react-native";
import { SafeArea } from "../components/safearea.component";

export const DeliveryScreen = ({ navigation }) => {
  const [testing, setTesting] = useState(true);

  useEffect(() => {
    if (true) {
      navigation.navigate("Login");
    }

    return () => {
      console.log("destroyed");
    };
  }, []);

  return (
    <SafeArea>
      <Text>Content goes here!</Text>
    </SafeArea>
  );
};
