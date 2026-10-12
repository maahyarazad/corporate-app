import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useContext } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { TranslationContext } from "../services/translation/translation.context";
import { Label } from "./typography/label.component";

export const SearchButton = ({ onPress }) => {
  const { i18n } = useContext(TranslationContext);
  return (
    <View style={styles.fill}>
      <TouchableOpacity style={styles.fill} activeOpacity={1} onPress={onPress}>
        <View style={styles.rowCenter}>
          <MaterialCommunityIcons
            name="store-search"
            size={30}
            color="#888"
          />
          <Label style={styles.label} size="title" weight="medium">
            {i18n.t("search")}
          </Label>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  fill: {
    flex: 1,
  },
  rowCenter: {
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
  },
  label: {
    marginLeft: 10,
    color: "#999",
  },
});
