import React, {useRef} from "react";
import { View, TouchableOpacity, Keyboard, StyleSheet } from "react-native";
import { Checkbox, ActivityIndicator } from "react-native-paper";
import { Label } from "../../../components/typography/label.component";
import { CustomTextInput } from "../../../components/customTextInput";
import styled from "styled-components/native";

const LoginButton = styled(TouchableOpacity)`
  min-height: 55px;
  max-height: 55px;
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
    <View style={styles.spacer}>

         <View style={styles.flexBox}>
    <View style={styles.spacer2}>
      <Label color="white" shadow size="h5" weight="medium">
        Welcome!
      </Label>

      <View style={styles.spacer3} />

      <Label color="white" size="caption" weight="medium" shadow>
        Sign in with your username and password.
      </Label>
    </View>
  </View>

      <CustomTextInput style={styles.customTextInput}
        value={username}
        ref={usernameRef}
        onChangeText={setUsername}
        label="Username or Email"
        textContentType="username"
         onSubmitEditing={() => passwordRef.current?.focus()}
      />

      

      <CustomTextInput
        value={password} style={styles.customTextInput}
        ref={passwordRef}
        onChangeText={setPassword}
        label="Password"
        secureTextEntry
        showEye
        textContentType="password"
         onSubmitEditing={() => Keyboard.dismiss()}
      />

      

      <TouchableOpacity onPress={handleForgetPassword} style={styles.pad}>
        <Label shadow color="white" style={styles.label}>
          Forgot password?
        </Label>
      </TouchableOpacity>

      

      {/* Checkbox */}
      <View style={styles.rowBetween}>
        <Checkbox.Android
          status={checked ? "checked" : "unchecked"}
          onPress={() => setChecked(!checked)}
          uncheckedColor="white"
          color="white"
        />
        <View style={styles.fill}>
          <Label size="caption" shadow style={styles.label2}>
            I accept the" "
            <Label onPress={handleBrowser} size="caption" style={styles.label3}>
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
          <Label style={styles.label2} weight="bold">
            Login
          </Label>
        )}
      </LoginButton>
    </View>
  );
};

export default LoginForm;

const styles = StyleSheet.create({
  spacer: {
    margin: 16,
    marginTop: 0,
  },
  flexBox: {
    flex: 1,
    justifyContent: "flex-end",
  },
  spacer2: {
    margin: 0,
  },
  spacer3: {
    marginTop: 6,
  },
  customTextInput: {
    marginTop: 8,
  },
  pad: {
    padding: 4,
  },
  label: {
    textDecorationLine: "underline",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fill: {
    flex: 1,
  },
  label2: {
    color: "white",
  },
  label3: {
    textDecorationLine: "underline",
    color: "white",
  },
});
