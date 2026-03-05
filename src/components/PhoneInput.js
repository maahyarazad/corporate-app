// PhoneInput.js
// Rewritten PhoneInput using YOUR Dropdown component (no new UI libs).
// Uses react-native-country-picker-modal only for the country data (and optional Flag rendering).

import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import CountryPicker, {
  getAllCountries,
  getCallingCodeAsync,
} from "react-native-country-picker-modal";
import { DropDown } from "../components/DropDown"; // <- adjust path

// --- helpers ---------------------------------------------------------------

function normalizeDigits(input) {
  // keep digits only
  return String(input || "").replace(/[^\d]/g, "");
}

function formatE164(countryCode, callingCode, nationalNumber) {
  // +<callingCode><nationalNumber> (no spaces)
  const cc = String(callingCode || "").replace(/[^\d]/g, "");
  const nn = normalizeDigits(nationalNumber);
  if (!cc || !nn) return "";
  return `+${cc}${nn}`;
}

// NOTE: Without libphonenumber-js, we can't do real validation by country.
// We'll provide basic heuristics and let you override validation externally.
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

  // passthrough
  textInputProps,
  filterProps,
  countryPickerProps,

  // NEW (optional, to match your error patterns)
  error = null, // string|boolean
  showErrorBorder = true,

  // Dropdown props passthrough (optional)
  searchable = true,
  searchPlaceholder = "Search country...",
}) {
  const isControlled = value !== undefined;

  const [number, setNumber] = useState(defaultValue);
  const [countryCode, setCountryCode] = useState(defaultCode);
  const [callingCode, setCallingCode] = useState("971"); // default AE

  // load countries once
  const [countries, setCountries] = useState([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const all = await getAllCountries(countryPickerProps);
      if (!mounted) return;
      setCountries(all || []);
    })();
    return () => {
      mounted = false;
    };
  }, [countryPickerProps]);

  // update calling code when country changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cc = await getCallingCodeAsync(countryCode);
        if (!mounted) return;
        setCallingCode(String(cc || ""));
      } catch {
        if (!mounted) return;
        setCallingCode("");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [countryCode]);

  // controlled/uncontrolled number
  const currentNumber = isControlled ? value : number;

  const hasError = !!error;
  const showError = showErrorBorder && hasError;

  // Build dropdown items from countries
  const items = useMemo(() => {
    const arr = (countries || [])
      .filter((c) => {
        // apply optional filterProps similar to country modal (basic)
        // you can extend this later; leaving open for your filters
        return true;
      })
      .map((c) => {
        const cc = (c.callingCode && c.callingCode[0]) || "";
        const label = `${c.name} (+${cc})`;
        return {
          label,
          value: c.cca2, // CountryCode
          _country: c,
        };
      });

    // optional: prioritize defaultCode on top
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

    // resolve country object from stored metadata
    const c = item?._country;
    if (c && onChangeCountry) onChangeCountry(c);
  };

  const handleNumberChange = (text) => {
    const digits = normalizeDigits(text);

    if (!isControlled) setNumber(digits);
    if (onChangeText) onChangeText(digits);

    const formatted = formatE164(countryCode, callingCode, digits);
    if (onChangeFormattedText) onChangeFormattedText(formatted);
  };

  const formattedValue = useMemo(() => {
    return formatE164(countryCode, callingCode, currentNumber);
  }, [countryCode, callingCode, currentNumber]);

  // This mimics your red border logic: you can still pass containerStyle externally
  const computedContainerStyle = useMemo(() => {
    const base = [
      styles.container,
      containerStyle,
      showError ? styles.containerError : null,
      disabled ? styles.containerDisabled : null,
    ];
    return base;
  }, [containerStyle, showError, disabled]);

  return (
    <View style={computedContainerStyle}>
      {/* LEFT: country dropdown */}
      <View style={[styles.left, flagButtonStyle, countryPickerButtonStyle]}>
        <DropDown
          items={items}
          value={countryCode}
          onChange={handlePickCountry}
          disabled={disabled}
          searchable={searchable}
          searchPlaceholder={searchPlaceholder}
          error={showError ? true : null}
          showErrorBorder={false} // border handled by wrapper container
          placeholder="Country"
          // button styles: compact to fit left side
          buttonStyle={[styles.countryButton]}
          buttonTextStyle={[styles.countryButtonText, codeTextStyle]}
          menuStyle={styles.countryMenu}
          // show only +code (or short) in button:
          renderButtonLabel={() => {
            const cc =
              (selectedCountryItem?._country?.callingCode &&
                selectedCountryItem._country.callingCode[0]) ||
              callingCode ||
              "";
            // Use CountryPicker's Flag component (from same library) if you want:
            // <CountryPicker .../> isn't needed; but Flag is rendered by CountryPicker internally.
            // We'll keep it simple text-only.
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

      {/* RIGHT: phone number input */}
      <View style={[styles.right, textContainerStyle]}>
        <TextInput
          value={String(currentNumber || "")}
          onChangeText={handleNumberChange}
          editable={!disabled}
          placeholder={placeholder}
          placeholderTextColor={showError && !currentNumber ? "red" : "#999"}
          keyboardType="phone-pad"
          style={[styles.input, textInputStyle, disabled ? { color: "#999" } : null]}
          selectionColor={textInputProps?.selectionColor ?? "#a6cdfb"}
          {...textInputProps}
        />
      </View>

      {/* Optional error text (string) */}
      {typeof error === "string" && error.trim() !== "" ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      {/* For debugging/preview if you want: */}
      {/* <Text>{formattedValue}</Text> */}
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

  // Dropdown compressed for country area
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

  errorText: {
    color: "red",
    // marginTop: 6,
    marginRight: 10,
    fontSize: 12,
  },
});