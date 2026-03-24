import React, { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from "react-native";
import { theme } from "../infrastructure/theme";

export const CodeInputField = ({
  maxLength = 6,
  code = "",
  setCode,
  setPinReady,
  onFulfill,
  inputBoxStyle,
  containerStyle,
  codeInputBoxStyle,
  codeInputTextStyle,
  hidden = false,
}) => {
  const codeDigitArray = new Array(maxLength).fill(0);
  const textInputRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const hasTriggeredFulfillRef = useRef(false);

  useEffect(() => {
    setPinReady(code.length === maxLength);

    if (code.length < maxLength) {
      hasTriggeredFulfillRef.current = false;
    }

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
    textInputRef.current?.focus();
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

    if (sanitized.length === maxLength && !hasTriggeredFulfillRef.current) {
      hasTriggeredFulfillRef.current = true;
      onFulfill?.(sanitized);
      Keyboard.dismiss();
    }
  };

  const renderCodeInputBox = (_, index) => {
    const digit = code[index];
    const hasValue = digit !== undefined;
    const isCurrent = index === code.length;
    const isLastFilled = code.length === maxLength && index === maxLength - 1;
    const isActive = focused && (isCurrent || isLastFilled);

    return (
      <View
        key={`otp_${index}`}
        style={[
          styles.codeInputBox,
          !hasValue && styles.emptyBox,
          isActive && styles.focusedBox,
          inputBoxStyle,
          codeInputBoxStyle,
        ]}
      >
        {hasValue ? (
          hidden ? (
            <View style={styles.dot} />
          ) : (
            <Text style={[styles.codeInputText, codeInputTextStyle]}>
              {digit}
            </Text>
          )
        ) : (
          <Text style={[styles.codeInputText, codeInputTextStyle]} />
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
        autoComplete={Platform.OS === "android" ? "sms-otp" : "one-time-code"}
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
    alignItems: "center",
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