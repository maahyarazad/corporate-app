import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { Button } from "react-native-paper";
import { CustomTextInput } from "./customTextInput";

export const PartnerPicker = ({
  data,
  setPartner,
  error,
  style,
  selectedPartnerName = "",
}) => {
  const [selectedPartner, setSelectedPartner] = useState("");
  const [openPartner, setOpenPartner] = useState(false);

  const handleSelection = (e) => {
    setOpenPartner(false);
    setSelectedPartner(e.label);
    setPartner(e.value, e.label);
  };

  const handleToggle = () => {
    setOpenPartner(!openPartner);
  };




  return (
    <>
      <View
        style={{
          ...style,
          height: 55,
        }}
      >
        <CustomTextInput
          value={selectedPartner ? selectedPartner : selectedPartnerName}
          label="Partner *"
          style={styles.customTextInput}
          error={error}
          right={
            <MaterialCommunityIcons
              name="chevron-down"
              size={25}
              onPress={handleToggle}
            />
          }
        ></CustomTextInput>
        <Button
          style={styles.button}
          contentStyle={styles.buttonContent}
          onPress={handleToggle}
        ></Button>
      </View>
      <DropDownPicker
        items={data}
        onPress={handleToggle}
        onSelectItem={handleSelection}
        open={openPartner}
        onClose={handleToggle}
        listMode="MODAL"
        searchable
        modalProps={{
          animationType: "slide",
          presentationStyle: "pageSheet", // or 'formSheet' on iOS
          style: { maxHeight: 400 }, // <-- limit the height here
        }}
        style={styles.dropDownPicker}
        searchPlaceholder="Type partner name..."
        searchContainerStyle={styles.dropDownPickerSearchContainer}
        searchTextInputStyle={styles.dropDownPickerSearchTextInput}
        listItemContainerStyle={styles.dropDownPickerListItemContainer}
      />
      <StatusBar style={openPartner ? "dark" : "light"} />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 4,
    height: 56,
  },
  customTextInput: {
    width: "100%",
    maxHeight: 58,
    position: "absolute",
  },
  button: {
    opacity: 0,
  },
  buttonContent: {
    height: "100%",
  },
  dropDownPicker: {
    borderWidth: 0,
    height: 56,
    display: "none",
  },
  dropDownPickerSearchContainer: {
    padding: 5,
  },
  dropDownPickerSearchTextInput: {
    paddingVertical: 15,
    borderWidth: 2,
    borderColor: "#00000044",
  },
  dropDownPickerListItemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#00000033",
  },
});
