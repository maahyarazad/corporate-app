import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { Dropdown } from "react-native-element-dropdown";
import { Button } from "react-native-paper";
import { PartnerService } from "../services/location/location.service";
import { CustomTextInput } from "./customTextInput";
import { Label } from "./typography/label.component";

export const PartnerPicker = ({ data, setPartner, error }) => {
  const [selectedPartner, setSelectedPartner] = useState("");
  const [openPartner, setOpenPartner] = useState(false);
  // const [partnerList, setPartnerList] = useState();

  const handleSelection = (e) => {
    setOpenPartner(false);
    setSelectedPartner(e.label);
    setPartner(e.value);
  };

  const handleToggle = () => {
    setOpenPartner(!openPartner);
  };

  return (
    <>
      <View
        style={{
          height: 55,
        }}
      >
        <CustomTextInput
          value={selectedPartner}
          label={"Partner *"}
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
              onPress={() => {
                handleToggle;
              }}
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
        // setValue=
        listMode="MODAL"
        searchable
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
