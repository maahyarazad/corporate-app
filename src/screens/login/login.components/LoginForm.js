import React, {useRef} from "react";
import { View, TouchableOpacity, Keyboard } from "react-native";
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

      const usernameRef = useRef(null);
      const passwordRef = useRef(null);

  return (
    <View style={{ margin: 16, marginTop: 0 }}>

         <View style={{ flex: 1, justifyContent: "flex-end" }}>
    <View style={{ margin: 0 }}>
      <Label color="white" shadow size="h5" weight="medium">
        Welcome!
      </Label>

      <View style={{ marginTop: 6 }} />

      <Label color="white" size="caption" weight="medium" shadow>
        Sign in with your username and password.
      </Label>
    </View>
  </View>

      <CustomTextInput style={{marginTop: 8}}
        value={username}
        ref={usernameRef}
        onChangeText={setUsername}
        label="Username or Email"
        textContentType="username"
         onSubmitEditing={() => passwordRef.current?.focus()}
      />

      

      <CustomTextInput
        value={password} style={{marginTop: 8}}
        ref={passwordRef}
        onChangeText={setPassword}
        label="Password"
        secureTextEntry
        showEye
        textContentType="password"
         onSubmitEditing={() => Keyboard.dismiss()}
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
            I accept the" "
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
