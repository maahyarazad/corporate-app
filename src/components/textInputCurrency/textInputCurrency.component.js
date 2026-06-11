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
  const safeValue =
    value === null || value === undefined ? "" : String(value);

  return (
    <View style={[styles.container, style]}>
      <Label size={labelSize} weight={labelWeight}>
        {label} {minValue !== undefined ? `(min: ${minValue})` : ""}
      </Label>

      <View style={styles.rowContainer}>
        <View style={styles.currencyContainer}>
          <Label weight="bold">{currency}</Label>
        </View>

        <TextInput
          disabled={!!disabled}
          onBlur={onBlur}
          onFocus={onFocus}
          onChangeText={onChangeText}
          style={[
            styles.input,
            {
              color: disabled ? "#aaa" : "#333",
            },
          ]}
          outlineColor="transparent"
          activeUnderlineColor="black"
          value={safeValue}
          placeholder={placeholder}
          mode="flat"
          keyboardAppearance="light"
          keyboardType="decimal-pad"
          returnKeyType="done"
          underlineColor="transparent"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  rowContainer: {
    borderWidth: 1,
    flexDirection: "row",
    borderRadius: 6,
    overflow: "hidden",
  },
  currencyContainer: {
    flex: 0.2,
    padding: 8,
    borderRightWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    fontWeight: "bold",
    fontSize: 16,
    backgroundColor: "transparent",
    height: 40,
    paddingBottom: 2,
    marginBottom: -2,
  },
});