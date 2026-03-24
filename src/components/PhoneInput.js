// PhoneInput.js
import React, { useEffect, useMemo, useState } from "react";
import {
  Platform,
  View,
  Text,
  TextInput,
  StyleSheet,
  Keyboard,
  InputAccessoryView,
  TouchableOpacity,
} from "react-native";
import {
  getAllCountries,
  getCallingCodeAsync,
} from "react-native-country-picker-modal";
import { DropDown } from "../components/DropDown";
import { useTheme } from "styled-components/native";
import { BlurView } from 'expo-blur';
// --- helpers ---------------------------------------------------------------

function normalizeDigits(input) {
  return String(input || "").replace(/[^\d]/g, "");
}

function formatE164(countryCode, callingCode, nationalNumber) {
  const cc = String(callingCode || "").replace(/[^\d]/g, "");
  const nn = normalizeDigits(nationalNumber);
  if (!cc || !nn) return "";
  return `+${cc}${nn}`;
}

function basicValid(numberDigits, min = 6, max = 15) {
  const n = normalizeDigits(numberDigits);
  return n.length >= min && n.length <= max;
}

// --- component -------------------------------------------------------------

export function PhoneInput({
  defaultCode = "AE",
  value,
  defaultValue = "",
  disabled = false,
  placeholder = "541234567",

  onChangeCountry,
  onChangeText,
  onChangeFormattedText,

  containerStyle,
  textContainerStyle,
  textInputStyle,
  codeTextStyle,
  flagButtonStyle,
  countryPickerButtonStyle,

  textInputProps,
  filterProps,
  countryPickerProps,

  error = null,
  showErrorBorder = true,

  searchable = true,
  searchPlaceholder = "Search country...",
}) {
  const theme = useTheme();
  const inputAccessoryViewID = "phonePadAccessory";
  const isControlled = value !== undefined;

  const [number, setNumber] = useState(defaultValue);
  const [countryCode, setCountryCode] = useState(defaultCode);
  const [callingCode, setCallingCode] = useState("971");
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const all = await getAllCountries(countryPickerProps);
        if (mounted) {
          setCountries(all || []);
        }
      } catch (err) {
        if (mounted) {
          setCountries([]);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [countryPickerProps]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const cc = await getCallingCodeAsync(countryCode);
        if (mounted) {
          setCallingCode(String(cc || ""));
        }
      } catch {
        if (mounted) {
          setCallingCode("");
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [countryCode]);

  const currentNumber = isControlled ? value : number;

  const hasError = !!error;
  const showError = showErrorBorder && hasError;

  const items = useMemo(() => {
    const arr = (countries || [])
      .filter(() => true)
      .map((c) => {
        const cc = (c.callingCode && c.callingCode[0]) || "";
        return {
          label: `${c.name} (+${cc})`,
          value: c.cca2,
          _country: c,
        };
      });

    arr.sort((a, b) => {
      if (a.value === defaultCode) return -1;
      if (b.value === defaultCode) return 1;
      return a.label.localeCompare(b.label);
    });

    return arr;
  }, [countries, defaultCode]);

  const selectedCountryItem = useMemo(() => {
    return items.find((x) => x.value === countryCode) || null;
  }, [items, countryCode]);

  const handlePickCountry = (cca2, item) => {
    setCountryCode(cca2);

    const c = item?._country;
    if (c && onChangeCountry) {
      onChangeCountry(c);
    }
  };

  const handleNumberChange = (text) => {
    const digits = normalizeDigits(text);

    if (!isControlled) {
      setNumber(digits);
    }

    if (onChangeText) {
      onChangeText(digits);
    }

    const formatted = formatE164(countryCode, callingCode, digits);
    if (onChangeFormattedText) {
      onChangeFormattedText(formatted);
    }
  };

  const formattedValue = useMemo(() => {
    return formatE164(countryCode, callingCode, currentNumber);
  }, [countryCode, callingCode, currentNumber]);

  const computedContainerStyle = useMemo(() => {
    return [
      styles.container,
      containerStyle,
      showError ? styles.containerError : null,
      disabled ? styles.containerDisabled : null,
    ];
  }, [containerStyle, showError, disabled]);

  return (
    <View>
      <View style={computedContainerStyle}>
        <View style={[styles.left, flagButtonStyle, countryPickerButtonStyle]}>
          <DropDown
            items={items}
            value={countryCode}
            onChange={handlePickCountry}
            disabled={disabled}
            searchable={searchable}
            searchPlaceholder={searchPlaceholder}
            error={showError ? true : null}
            showErrorBorder={false}
            placeholder="Country"
            buttonStyle={styles.countryButton}
            buttonTextStyle={[styles.countryButtonText, codeTextStyle]}
            menuStyle={styles.countryMenu}
            renderButtonLabel={() => {
              const cc =
                (selectedCountryItem?._country?.callingCode &&
                  selectedCountryItem._country.callingCode[0]) ||
                callingCode ||
                "";

              return (
                <View style={styles.countryButtonInner}>
                  <Text style={[styles.countryCodeText, codeTextStyle]}>
                    +{cc}
                  </Text>
                </View>
              );
            }}
          />
        </View>

        <View style={[styles.right, textContainerStyle]}>
          <TextInput
            value={String(currentNumber || "")}
            onChangeText={handleNumberChange}
            inputAccessoryViewID={
              Platform.OS === "ios" ? inputAccessoryViewID : undefined
            }
            editable={!disabled}
            placeholder={placeholder}
            placeholderTextColor={showError && !currentNumber ? "red" : "#999"}
            keyboardType={Platform.OS === "ios" ? "number-pad" : "phone-pad"}
            returnKeyType="done"
            style={[
              styles.input,
              textInputStyle,
              disabled ? { color: "#999" } : null,
            ]}
            selectionColor={textInputProps?.selectionColor ?? "#a6cdfb"}
            {...textInputProps}
          />
        </View>
      </View>

      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <View style={styles.accessoryContainer}>
            
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => Keyboard.dismiss()}
              style={[
                styles.doneButton,
                {
                  backgroundColor:
                    theme?.colors?.ui?.button || "#000",
                },
              ]}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}

      {typeof error === "string" && error.trim() !== "" ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
}

// --- styles ---------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 60,
    borderWidth: 2,
    borderColor: "#00000099",
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    overflow: "hidden",
  },

  containerError: {
    borderColor: "red",
  },

  containerDisabled: {
    backgroundColor: "#f4f4f5",
  },

  left: {
    height: "100%",
    justifyContent: "center",
  },

  right: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    backgroundColor: "white",
    paddingVertical: 0,
  },

  input: {
    height: "100%",
    paddingHorizontal: 12,
    fontSize: 16,
    color: "black",
  },

  countryButton: {
    height: "100%",
    borderWidth: 0,
    backgroundColor: "transparent",
    borderRadius: 0,
    paddingHorizontal: 10,
    minWidth: 90,
  },

  countryButtonText: {
    fontSize: 16,
  },

  countryButtonInner: {
    flexDirection: "row",
    alignItems: "center",
  },

  countryCodeText: {
    fontSize: 16,
    color: "black",
  },

accessoryContainer: {
  backgroundColor: "rgba(255, 255, 255, 0.7)", // 👈 tweak opacity
  padding: 10,
  borderTopWidth: 1,
  borderColor: "rgba(0,0,0,0.1)",
},

  doneButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  doneButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },

  errorText: {
    color: "red",
    marginRight: 10,
    fontSize: 12,
    marginTop: 6,
  },
});