import { StyleSheet, Text, TouchableWithoutFeedback, View } from "react-native";
import React, { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Label } from "./typography/label.component";

const CustomButton = ({
  style,
  icon,
  onPress,
  children,
  iconSize = 25,
  color = "#000000",
  label,
  labelStyle = {},
}) => {
  const [pressedIn, setPressedIn] = useState(false);

  const onPressIn = () => {
    setPressedIn(true);
  };
  const onPressOut = () => {
    setPressedIn(false);
  };

  return (
    <>
      <TouchableWithoutFeedback
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <View
          style={[
            {
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 8,
              borderWidth: 2,
              borderColor: color,
              paddingHorizontal: 8,
              paddingVertical: 10,
              backgroundColor: pressedIn ? color + "22" : "white",
              gap: 8,
            },
            style,
          ]}
        >
          {icon && (
            <MaterialCommunityIcons name={icon} size={iconSize} color={color} />
          )}
          <Label weight={"bold"} color={color} style={labelStyle}>
            {label}
          </Label>
        </View>
      </TouchableWithoutFeedback>
    </>
  );
};

export default CustomButton;

const styles = StyleSheet.create({});
