import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Label } from "../../../components/typography/label.component";
import { navigate } from "../../../navigation/navigate";

const RegisterSection = ({ theme }) => {
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
          onPress={() => navigate("Registration")}
          style={{
            height: 55,
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