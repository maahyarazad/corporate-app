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
import { theme } from "../infrastructure/theme";

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
  const [focused, setFocused] = useState(false);

  const renderCodeInputBox = (value, index) => {
    const rand = Math.random();
    return (
      <CodeInputBox
        style={[
          code.length < index + 1 && {
            backgroundColor: "white",
            borderColor: "#ccc",
          },
          focused &&
            index <= code.length && {
              borderColor: theme.colors.ui.secondary,
            },
          inputBoxStyle,
        ]}
        key={`otp1_${index}`}
      >
        <CodeInputBoxText key={`otp2_${index}`}>
          {code[index] != undefined ? (
            !hidden ? (
              code[index]
            ) : (
              <View
                style={{
                  backgroundColor: "black",
                  width: 12,
                  height: 12,
                  borderRadius: 20,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              ></View>
            )
          ) : (
            ""
          )}
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

  const handleFocus = () => {
    setFocused(true);
  };

  const handleBlur = () => {
    setFocused(false);
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
            textContentType="oneTimeCode"
            maxLength={maxLength}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            returnKeyType="done"
            onFocus={handleFocus}
            onBlur={handleBlur}
          ></HiddenTextInput>
        </View>
      </CodeInputContainer>
    </>
  );
};
