import React from "react";
import { View, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { CustomTextInput } from "./customTextInput";

export const GenderPicker = ({ state, setState, error, style }) => {
  return (
    <View style={{ ...style, marginVertical: 5 }}>
      
      <View style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 5, marginTop: 35 }}>
        <Picker
         label="Gender *"
          selectedValue={state.gender}
          onValueChange={(itemValue) => setState({ ...state, gender: itemValue })}
          style={{ height: 50, width: "100%" }}
        >
          <Picker.Item label="Select Gender" value="" />
          <Picker.Item label="Male" value="Male" />
          <Picker.Item label="Female" value="Female" />
          <Picker.Item label="Other" value="Other" />
        </Picker>
      </View>
    </View>
  );
};