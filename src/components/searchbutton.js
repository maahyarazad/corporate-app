import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Label } from "./typography/label.component";

export const SearchButton = ({ onPress }) => {
  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onPress}>
        <View
          style={{
            flex: 1,
            borderRadius: 6,
            backgroundColor: "white",
            borderColor: "#aaa",
            elevation: 10,
            shadowOpacity: 0.3,
            shadowOffset: {
              width: 1,
              height: 2,
            },
            borderRadius: 6,
            alignItems: "center",
            paddingLeft: 10,
            flexDirection: "row",
          }}
        >
          <MaterialCommunityIcons
            name="store-search"
            size={30}
            color={"#888"}
          />
          <Label
            style={{ marginLeft: 10, color: "#999" }}
            size={"title"}
            weight="medium"
          >
            Search
          </Label>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
});
