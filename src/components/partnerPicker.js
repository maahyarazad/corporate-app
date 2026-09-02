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
          style={{
            width: "100%",
            maxHeight: 58,
            position: "absolute",
          }}
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
          style={{ opacity: 0 }}
          contentStyle={{ height: "100%" }}
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
        style={{ borderWidth: 0, height: 56, display: "none" }}
        searchPlaceholder="Type partner name..."
        searchContainerStyle={{ padding: 5 }}
        searchTextInputStyle={{
          paddingVertical: 15,
          borderWidth: 2,
          borderColor: "#00000044",
        }}
        listItemContainerStyle={{
          borderBottomWidth: 1,
          borderBottomColor: "#00000033",
        }}
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
});
