import React, { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { theme } from "../infrastructure/theme";

export const CodeInputField = ({
  maxLength = 6,
  code = "",
  setCode,
  setPinReady,
  inputBoxStyle,
  containerStyle,
  codeInputBoxStyle,codeInputTextStyle,
  hidden = false,
}) => {
  const codeDigitArray = new Array(maxLength).fill(0);
  const textInputRef = useRef(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    setPinReady(code.length === maxLength);

    return () => {
      setPinReady(false);
    };
  }, [code, maxLength, setPinReady]);

  useEffect(() => {
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      textInputRef.current?.blur();
      setFocused(false);
    });

    return () => {
      hideSub.remove();
    };
  }, []);

  const handlePress = () => {
    const input = textInputRef.current;
    if (!input) return;

    input.blur();

    setTimeout(() => {
      input.focus();
    }, 50);
  };

  const handleFocus = () => {
    setFocused(true);
  };

  const handleBlur = () => {
    setFocused(false);
  };

  const handleChangeText = (text) => {
    const sanitized = String(text || "").replace(/\D/g, "").slice(0, maxLength);
    setCode(sanitized);
  };

  const renderCodeInputBox = (_, index) => {
    const hasValue = code[index] !== undefined;
    const isActive = focused && index <= code.length;

    return (
      <View
        key={`otp_${index}`}
        style={[ 
          styles.codeInputBox,
          !hasValue && styles.emptyBox,
          isActive && styles.focusedBox,
          inputBoxStyle, codeInputBoxStyle
        ]}
      >
        {hasValue ? (
          hidden ? (
            <View style={styles.dot} />
          ) : (
            <Text style={[styles.codeInputText, codeInputTextStyle]}>{code[index]}</Text>
          )
        ) : (
          <Text style={[styles.codeInputText, codeInputTextStyle]}></Text>
        )}
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: "transparent" },
        containerStyle,
      ]}
    >
      <Pressable onPress={handlePress} style={styles.pressLayer}>
        {codeDigitArray.map(renderCodeInputBox)}
      </Pressable>

      <TextInput
        ref={textInputRef}
        allowFontScaling={false}
        textContentType="oneTimeCode"
        importantForAutofill="yes"
        autoCorrect={false}
        autoCapitalize="none"
        maxLength={maxLength}
        value={code}
        onChangeText={handleChangeText}
        keyboardType="number-pad"
        returnKeyType="done"
        blurOnSubmit={false}
        showSoftInputOnFocus={true}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={styles.hiddenInput}
        caretHidden={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    justifyContent: "center",
    alignItems:"center",
    position: "relative",
  },
  pressLayer: {
    flexDirection: "row",
    alignItems: "center",
  },
  codeInputBox: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 6,
    borderColor: "#ccc",
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  emptyBox: {
    backgroundColor: "white",
    borderColor: "#ccc",
  },
  focusedBox: {
    borderColor: theme?.colors?.ui?.secondary || "#1282FF",
  },
  codeInputText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 12,
    backgroundColor: "#000",
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
});