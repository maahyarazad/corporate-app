import React, { useState } from "react";
import { View, Pressable, Platform, Modal, Button } from "react-native";
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
  
  const [tempDate, setTempDate] = useState(value || new Date());

  const openPicker = () => {
    setTempDate(value || new Date());
    setShow(true);
  };

  const handleChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShow(false);

      if (event?.type === "set" && selectedDate) {
        onChange(selectedDate);
      }
      return;
    }

    // iOS: keep temporary date until user presses Done
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const handleDone = () => {
    onChange(tempDate);
    setShow(false);
  };

  const handleCancel = () => {
    setShow(false);
  };

  return (
    <>
      <Pressable onPress={openPicker}>
        <View pointerEvents="none">
          <CustomTextInput
            value={value ? moment(value).format("DD MMM YYYY") : ""}
            label={label}
            editable={false}
            error={error}
            style={{
              borderRadius: 5,
              height: 55,
              width: "100%",
            }}
          />
        </View>
      </Pressable>

      {Platform.OS === "android" && show && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={handleChange}
        />
      )}

      {Platform.OS === "ios" && (
        <Modal visible={show} transparent animationType="slide">
          <View
            style={{
              flex: 1,
              justifyContent: "flex-end",
              backgroundColor: "rgba(0,0,0,0.3)",
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                padding: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Button title="Cancel" onPress={handleCancel} />
                <Button title="Done" onPress={handleDone} />
              </View>

              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={handleChange}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}