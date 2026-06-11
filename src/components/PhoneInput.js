// PhoneInput.js
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Platform,
  View,
  Text,
  TextInput,
  StyleSheet, // ✅ FIX 1: was missing from import
  Keyboard,
  InputAccessoryView,
  TouchableOpacity,
  Pressable,
  FlatList,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import {
  getAllCountries,
  getCallingCodeAsync,
} from "react-native-country-picker-modal";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "styled-components/native";

// --- helpers ---------------------------------------------------------------

const toFlagEmoji = (cca2 = "") =>
  cca2
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
    .join("");

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

  const buttonRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuTop, setMenuTop] = useState(0);
  const [menuLeft, setMenuLeft] = useState(0);
  const [menuHeight, setMenuHeight] = useState(0);
  const [menuReady, setMenuReady] = useState(false);

  const MENU_WIDTH = 280;
  const SCREEN = Dimensions.get("window");
  const maxMenuHeight = SCREEN.height * 0.45;

  const handleClose = () => {
    setOpen(false);
    setQuery("");
    setMenuReady(false);
  };

const measureTimeoutRef = useRef(null);

const handleOpen = () => {
  if (Keyboard.isVisible()) {
    Keyboard.dismiss();
    measureTimeoutRef.current = setTimeout(
      () => measureAndOpen(),
      Platform.OS === "ios" ? 80 : 80
    );
  } else {
    measureAndOpen();
  }
};

// ✅ Clear timeout on unmount to avoid state updates on unmounted component
useEffect(() => {
  return () => {
    if (measureTimeoutRef.current) {
      clearTimeout(measureTimeoutRef.current);
    }
  };
}, []);

const measureAndOpen = () => {
  // ✅ Measure screen fresh at open time — not at render time
  const FRESH_SCREEN = Dimensions.get("window");

  buttonRef.current?.measure((x, y, width, height, pageX, pageY) => {
    const spaceBelow = FRESH_SCREEN.height - (pageY + height);
    const spaceAbove = pageY;
    const menuH = menuHeight || maxMenuHeight;

    let top;
    if (spaceBelow >= menuH || spaceBelow >= spaceAbove) {
      top = pageY + height + 4; // open below
    } else {
      top = pageY - menuH - 4; // open above
    }

    // clamp left so menu doesn't overflow screen edge
    let left = pageX;
    if (left + MENU_WIDTH > FRESH_SCREEN.width - 8) {
      left = FRESH_SCREEN.width - MENU_WIDTH - 8;
    }

    setMenuTop(top);
    setMenuLeft(left);
    setMenuReady(false);
    setOpen(true);
  });
};

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const all = await getAllCountries(countryPickerProps);
        if (mounted) setCountries(all || []);
      } catch {
        if (mounted) setCountries([]);
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
        if (mounted) setCallingCode(String(cc || ""));
      } catch {
        if (mounted) setCallingCode("");
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
    const arr = (countries || []).map((c) => {
      const cc = (c.callingCode && c.callingCode[0]) || "";
      return {
        label: `${c.name} (+${cc})`, // ← no flag in label; flag rendered separately in row
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

  // ✅ FIX 2: filteredItems was missing — filters items by query string
  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.value.toLowerCase().includes(q)
    );
  }, [items, query]);

  const selectedCountryItem = useMemo(() => {
    return items.find((x) => x.value === countryCode) || null;
  }, [items, countryCode]);

  // ✅ FIX 3: corrected signature — was called as handlePickCountry(item),
  // but the function expects (cca2, item)
  const handlePickCountry = (cca2, item) => {
    setCountryCode(cca2);
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

  const computedContainerStyle = useMemo(() => {
    return [
      styles.container,
      containerStyle,
      showError ? styles.containerError : null,
      disabled ? styles.containerDisabled : null,
    ];
  }, [containerStyle, showError, disabled]);

  return (
    <View style={styles.wrapper}>
      <View style={computedContainerStyle}>
        <View style={[styles.left, flagButtonStyle, countryPickerButtonStyle]}>
          {/* Trigger button */}
          <Pressable
            ref={buttonRef}
            onPress={() => !disabled && handleOpen()} // ✅ FIX 4: was setOpen(true), now uses handleOpen()
            style={[
              styles.countryButton,
              showError ? styles.errorBorder : null,
            ]}
            disabled={disabled}
          >
            {({ pressed }) => (
              <View
                style={[styles.countryButtonInner, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.flag}>{toFlagEmoji(countryCode)}</Text>
                <Text style={[styles.countryCodeText, codeTextStyle]}>
                  +
                  {selectedCountryItem?._country?.callingCode?.[0] ||
                    callingCode ||
                    ""}
                </Text>
              </View>
            )}
          </Pressable>

          {/* Dropdown modal */}
          <Modal
            visible={open}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={handleClose}
          >
            <KeyboardAvoidingView
              style={styles.kavContainer}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              {/* Dismiss overlay */}
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={handleClose}
              />

              {/* Menu */}
              <View
                style={[
                  styles.menu,
                  {
                    top: menuTop,
                    left: menuLeft,
                    width: MENU_WIDTH,
                    maxHeight: maxMenuHeight,
                    opacity: menuReady ? 1 : 0,
                  },
                ]}
                onLayout={(e) => {
                  const h = e.nativeEvent.layout.height;
                  if (h && !menuReady) {
                    setMenuHeight(h);
                    setMenuReady(true);
                  }
                }}
              >
                {/* Search input */}
                <View style={styles.searchWrapper}>
                  <MaterialCommunityIcons
                    name="magnify"
                    size={18}
                    color="#9ca3af"
                    style={styles.searchIcon}
                  />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder={searchPlaceholder}
                    placeholderTextColor="#9ca3af"
                    autoCorrect={false}
                    autoCapitalize="none"
                    style={styles.searchInput}
                  />
                  {query.length > 0 && (
                    <Pressable onPress={() => setQuery("")} hitSlop={8}>
                      <MaterialCommunityIcons
                        name="close-circle"
                        size={16}
                        color="#9ca3af"
                      />
                    </Pressable>
                  )}
                </View>

                {/* Country list */}
                <FlatList
                  data={filteredItems}
                  keyExtractor={(item) => item.value}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  renderItem={({ item }) => {
                    const selected = item.value === countryCode;
                    return (
                      <Pressable
                        onPress={() => {
                          handlePickCountry(item.value, item); // ✅ FIX 3: correct args
                          handleClose();
                        }}
                        style={({ pressed }) => [
                          styles.itemRow,
                          selected && styles.itemRowSelected,
                          pressed && { backgroundColor: "#f3f4f6" },
                        ]}
                      >
                        <Text style={styles.flag}>
                          {toFlagEmoji(item.value)}
                        </Text>
                        <Text
                          style={[
                            styles.itemText,
                            selected && styles.itemTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                        {selected && (
                          <MaterialCommunityIcons
                            name="check"
                            size={16}
                            color="#111827"
                          />
                        )}
                      </Pressable>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={styles.empty}>
                      <Text style={styles.emptyText}>No countries found</Text>
                    </View>
                  }
                />
              </View>
            </KeyboardAvoidingView>
          </Modal>
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
                { backgroundColor: theme?.colors?.ui?.button || "#000" },
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
  wrapper: {
    width: "100%",
    zIndex: 10,
  },
  container: {
    width: "100%",
    height: 60,
    borderWidth: 2,
    borderColor: "#00000099",
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
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
    zIndex: 20,
    width: 100,
    flexShrink: 0,
  },
  right: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    backgroundColor: "white",
    paddingVertical: 0,
    zIndex: 1,
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
    justifyContent: "center",   // ✅ centers content vertically
  alignItems: "center",       // ✅ centers content horizontally
  },
  countryButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",   // ✅ centers content vertically
  alignItems: "center",       // ✅ centers content horizontally
    gap: 2,
  },
  countryCodeText: {
    fontSize: 16,
    color: "black",
  },

  // --- modal styles ---
  kavContainer: {
    flex: 1,
  },
  menu: {
    position: "absolute",
    backgroundColor: "white",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    paddingVertical: 0,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  itemRowSelected: {
    backgroundColor: "#f9fafb",
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },
  itemTextSelected: {
    fontWeight: "600",
  },
  empty: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 14,
  },

  // --- accessory / error ---
  accessoryContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
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
  flag: {
    fontSize: 22,
    lineHeight: 26,
  },
});
