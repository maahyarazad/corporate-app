// components/BirthdatePicker.js

import React, { useState } from "react";
import { View, Pressable, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import moment from "moment";
import { CustomTextInput } from "../components/customTextInput";

export function BirthdatePicker({
  value,
  onChange,
  label = "Birthdate *",
  error,
}) {
  const [show, setShow] = useState(false);

  const handleChange = (event, selectedDate) => {
    if (Platform.OS !== "ios") setShow(false);

    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
    <>
      <Pressable onPress={() => setShow(true)} >
        <View pointerEvents="none">
          <CustomTextInput
            value={value ? moment(value).format("DD MMM YYYY") : ""}
            label={label}
            editable={false}
            error={error}
            style={{
              borderRadius: 5,
              height: 60,
              width: "100%",
            }}
          />
        </View>
      </Pressable>

      {show && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          maximumDate={new Date()}
          onChange={handleChange}
        />
      )}
    </>
  );
}