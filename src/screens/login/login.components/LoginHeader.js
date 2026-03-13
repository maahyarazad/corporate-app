import React from "react";
import { View, Image } from "react-native";
import { Label } from "../../../components/typography/label.component";
import { Spacer } from "../../../components/spacer/spacer.component";

const LoginHeader = ({ companyLogo }) => {

  return (
    <>
      <Image
        style={{
          width: 100,
          height: 50,
          resizeMode: "contain",
          marginLeft: 16,
        }}
        source={companyLogo}
      />

      <View style={{ margin: 16 }}>
        <Label color="white" shadow size="h5" weight="medium">
          Welcome!
        </Label>

        <View style={{marginTop: 6}}/>

        <Label color="white" size="caption" weight="medium" shadow>
          Sign in with your username and password.
        </Label>
      </View>
    </>
  );
};

export default LoginHeader;
