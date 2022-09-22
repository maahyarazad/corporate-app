import React from "react";
import { StyleSheet, View } from "react-native";
import { TextInput } from "react-native-paper";
import { Label } from "../typography/label.component";

export const TextInputCurrency = ({
  onBlur,
  onChangeText,
  label = "Label",
  labelSize = "body",
  labelWeight = "medium",
  currency = "AED",
  placeholder,
  disabled,
  style,
  value,
  minValue,
  onFocus,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Label size={labelSize} weight={labelWeight}>
        {label} {minValue != undefined ? `(min: ${minValue})` : ""}
      </Label>
      <View
        style={{
          borderWidth: 1,
          flexDirection: "row",
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            flex: 0.2,
            padding: 8,
            borderRightWidth: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Label weight={"bold"}>{currency}</Label>
        </View>
        {/* <TextInput
          style={{
            flex: 1,
            padding: 8,
            fontWeight: "bold",
            fontSize: 16,
            color: disabled ? "#aaa" : "#333",
          }}
          value={value}
          placeholderTextColor="#aaa"
          placeholder={placeholder}
          onChangeText={onChangeText}
          editable={!disabled}
          keyboardType="decimal-pad"
          returnKeyType="done"
        /> */}
        <TextInput
          disabled={disabled}
          onBlur={onBlur}
          onFocus={onFocus}
          onChangeText={onChangeText}
          style={{
            flex: 1,
            fontWeight: "bold",
            fontSize: 16,
            color: disabled ? "#aaa" : "#333",
            backgroundColor: "transparent",
            height: 40,
            paddingBottom: 2,
            marginBottom: -2,
          }}
          outlineColor="transparent"
          activeUnderlineColor="black"
          value={value}
          mode="flat"
          keyboardAppearance="light"
          keyboardType="decimal-pad"
          returnKeyType="done"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
});
