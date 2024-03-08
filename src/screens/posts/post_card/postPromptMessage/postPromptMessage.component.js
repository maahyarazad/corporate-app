import { View, Text, StyleSheet } from "react-native";
import React from "react";
import { theme } from "../../../../infrastructure/theme";
import { Label } from "../../../../components/typography/label.component";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const PostPromptMessage = ({ severity = "info", message, title }) => {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.messageContainer,
          {
            borderColor:
              severity === "info"
                ? theme.colors.icons.active
                : severity === "warning" && theme.colors.ui.warning,
            backgroundColor:
              severity === "info"
                ? theme.colors.icons.active + "25"
                : severity === "warning" && theme.colors.ui.warning + "25",
          },
        ]}
      >
        <View style={styles.messageHeader}>
          {severity === "info" ? (
            <MaterialCommunityIcons
              name="alert-octagon-outline"
              size={22}
              color={theme.colors.icons.active}
            ></MaterialCommunityIcons>
          ) : (
            <MaterialCommunityIcons
              name="close-octagon-outline"
              size={22}
              color={theme.colors.ui.warning}
            ></MaterialCommunityIcons>
          )}
          <Label weight={"bold"}>{title}</Label>
        </View>
        <Label>{message}</Label>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    padding: 10,
  },
  messageContainer: {
    borderWidth: 2,
    borderColor: "black",
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});

export default PostPromptMessage;
