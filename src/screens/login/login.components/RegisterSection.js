import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Label } from "../../../components/typography/label.component";

const RegisterSection = ({ navigation, theme }) => {
  return (
    <>
      <View style={{ height: 50, justifyContent: "center" }}>
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: "white",
            position: "absolute",
            alignSelf: "center",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
          }}
        >
          <Label weight="bold">OR</Label>
        </View>

        <View style={{ borderTopWidth: 2, borderColor: "white" }} />
      </View>

      <View style={{ margin: 16 }}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Registration")}
          style={{
            height: 60,
            backgroundColor: theme.colors.ui.button,
            borderRadius: 5,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Label
            style={{ color: "white", textAlign: "center" }}
            weight="bold"
          >
            Create an Account{"\n"}(Corporate Cardholders Only)
          </Label>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default RegisterSection;