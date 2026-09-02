import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Label } from "../../../components/typography/label.component";
import { navigate } from "../../../navigation/navigate";

const RegisterSection = ({ theme }) => {
  return (
    <>
      <View style={styles.box}>
        <View style={styles.overlay}>
          <Label weight="bold">OR</Label>
        </View>

        <View style={styles.box2} />
      </View>

      <View style={styles.spacer}>
        <TouchableOpacity
          onPress={() => navigate("Registration")}
          style={[styles.centerBox, { backgroundColor: theme.colors.ui.button }]}
        >
          <Label style={styles.label} weight="bold">
            Create an Account{"\n"}(Corporate Cardholders Only)
          </Label>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default RegisterSection;

const styles = StyleSheet.create({
  box: {
    height: 50,
    justifyContent: "center",
  },
  overlay: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "white",
    position: "absolute",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  box2: {
    borderTopWidth: 2,
    borderColor: "white",
  },
  spacer: {
    margin: 16,
  },
  label: {
    color: "white",
    textAlign: "center",
  },
  centerBox: {
    height: 55,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
});
