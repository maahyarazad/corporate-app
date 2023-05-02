import React, { useEffect, useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
// import {
//   FlatList,
//   Pressable,
//   Text,
//   TouchableHighlight,
//   View,
// } from "react-native";
// import { TextInput } from "react-native-paper";
import {
  CodeInputBox,
  CodeInputBoxText,
  CodeInputContainer,
  CodeInputPressLayer,
  HiddenTextInput,
} from "./styles";

export const CodeInputField = ({
  maxLength,
  code,
  setCode,
  setPinReady,
  inputBoxStyle,
  containerStyle,
  hidden,
}) => {
  const codeDigitArray = new Array(maxLength).fill(0);
  const textInputRef = useRef();

  const renderCodeInputBox = (value, index) => {
    const rand = Math.random();
    return (
      <CodeInputBox style={inputBoxStyle} key={`otp1_${index}`}>
        <CodeInputBoxText key={`otp2_${index}`}>
          {code[index] != undefined ? (!hidden ? code[index] : "•") : ""}
        </CodeInputBoxText>
      </CodeInputBox>
    );
  };

  useEffect(() => {
    setPinReady(code.length === maxLength);
    return () => {
      setPinReady(false);
    };
  }, [code]);

  const handlePress = () => {
    textInputRef.current.focus();
  };

  return (
    <>
      <CodeInputContainer style={containerStyle}>
        <CodeInputPressLayer onPress={handlePress}>
          {codeDigitArray.map(renderCodeInputBox)}
        </CodeInputPressLayer>
        <View style={{ flexDirection: "row" }}>
          <HiddenTextInput
            ref={textInputRef}
            allowFontScaling={false}
            maxLength={maxLength}
            onChangeText={setCode}
            keyboardType="number-pad"
            returnKeyType="done"
          ></HiddenTextInput>
        </View>
      </CodeInputContainer>
    </>
  );
};
