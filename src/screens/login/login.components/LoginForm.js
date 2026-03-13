import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Checkbox, ActivityIndicator } from "react-native-paper";
import { Spacer } from "../../../components/spacer/spacer.component";
import { Label } from "../../../components/typography/label.component";
import { CustomTextInput } from "../../../components/customTextInput";
import styled from "styled-components/native";

const LoginButton = styled(TouchableOpacity)`
  min-height: 60px;
  max-height: 60px;
  background-color: ${({ checked }) => (checked ? "#207ede" : "#c7c7c7")};
  border-radius: 5px;
  justify-content: center;
  align-items: center;
`;

const LoginForm = ({
  username,
  password,
  setUsername,
  setPassword,
  checked,
  setChecked,
  loginLoading,
  handleLogin,
  handleForgetPassword,
  handleBrowser,
}) => {
  return (
    <View style={{ margin: 16 }}>
      <CustomTextInput style={{marginTop: 8}}
        value={username}
        onChangeText={setUsername}
        label="Username or Email"
        textContentType="username"
      />

      

      <CustomTextInput
        value={password} style={{marginTop: 8}}
        onChangeText={setPassword}
        label="Password"
        secureTextEntry
        showEye
        textContentType="password"
      />

      

      <TouchableOpacity onPress={handleForgetPassword} style={{padding: 4}}>
        <Label shadow color="white" style={{ textDecorationLine: "underline"}}>
          Forgot password?
        </Label>
      </TouchableOpacity>

      

      {/* Checkbox */}
      <View style={{ flexDirection: "row", justifyContent:"space-between", alignItems:'center' }}>
        <Checkbox.Android
          status={checked ? "checked" : "unchecked"}
          onPress={() => setChecked(!checked)}
          uncheckedColor="white"
          color="white"
        />
        <View style={{ flex: 1 }}>
          <Label size="caption" shadow style={{ color: "white" }}>
            I accept the{" "}
            <Label
              onPress={handleBrowser}
              size="caption"
              style={{ textDecorationLine: "underline", color: "white" }}
            >
              End User License Agreement & Privacy Policy
            </Label>
          </Label>
        </View>
      </View>

      

      <LoginButton
        onPress={handleLogin}
        disabled={!checked || loginLoading}
        checked={checked && !loginLoading}
      >
        {loginLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Label style={{ color: "white" }} weight="bold">
            Login
          </Label>
        )}
      </LoginButton>
    </View>
  );
};

export default LoginForm;
