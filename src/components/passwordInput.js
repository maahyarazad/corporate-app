import React, { useState } from "react";
import { TextInput } from "react-native-paper";
import styled from "styled-components/native";

const StyledPass = styled(TextInput)`
  border-radius: 10px;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
`;

export const PasswordInput = ({ label, onChangeText, value, outlineColor }) => {
  const [hidePass, setHidePass] = useState(true);

  return (
    <TextInput
      secureTextEntry={hidePass}
      value={value}
      onChangeText={onChangeText}
      mode="outlined"
      outlineColor={outlineColor}
      activeOutlineColor={"#B57000"}
      textContentType="oneTimeCode"
      label={label}
      right={
        <TextInput.Icon
          name={hidePass ? "eye" : "eye-off"}
          onPress={() => {
            hidePass ? setHidePass(false) : setHidePass(true);
          }}
        />
      }
    />
  );
};
