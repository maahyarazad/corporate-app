import React from "react";
import { View, Image } from "react-native";
import { Label } from "../../../components/typography/label.component";
import { Spacer } from "../../../components/spacer/spacer.component";

const LoginHeader = ({ companyLogo }) => {

  return (
  <View style={{ flex: 1, maxHeight: "20%" }}>
  <Image
    style={{
      width: 100,
      height: 50,
      resizeMode: "contain",
      marginLeft: 16,
    }}
    source={companyLogo}
  />

 
</View>
  );
};

export default LoginHeader;
