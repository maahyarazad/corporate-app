import React from "react";
import { View, TouchableWithoutFeedback, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Label } from "../../../components/typography/label.component";

const BiometricLogin = ({ biometric, handleBiometricLogin, i18n }) => {
  if (!biometric?.available || !biometric?.type) return null;

  return (
    <TouchableWithoutFeedback onPress={handleBiometricLogin}>
      <View style={styles.rowCenter}>
        <MaterialCommunityIcons
          color="white"
          name={
            biometric.type === "fingerprint"
              ? "fingerprint"
              : "face-recognition"
          }
          size={30}
        />

        <Label color="white" style={styles.label}>
          {i18n.t(`profile-tabs.settings-menu.login-${biometric.type}`)}
        </Label>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default BiometricLogin;

const styles = StyleSheet.create({
  rowCenter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  label: {
    textDecorationLine: "underline",
  },
});
