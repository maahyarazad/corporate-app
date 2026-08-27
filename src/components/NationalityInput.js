// NationalityInput.js
import React, { memo, useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions, Keyboard
} from "react-native";
import { getAllCountries } from "react-native-country-picker-modal";
import { MaterialCommunityIcons } from "@expo/vector-icons";
// Converts a CCA2 country code to its emoji flag — no assets needed, works everywhere
const toFlagEmoji = (cca2 = "") =>
  cca2
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
    .join("");


const SCREEN_PADDING = 8;
const MENU_OFFSET = 4;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MENU_WIDTH = Math.min(420, Math.round(SCREEN_WIDTH * 0.92));

// Memoized row for the ~250-country list. `selected` is passed as a primitive so
// the memo compares cheaply; onPress takes the item (contracts/list-api.md C1).
const CountryRow = memo(({ item, selected, onPress }) => (
  <Pressable
    onPress={() => onPress(item)}
    style={({ pressed }) => [
      styles.itemRow,
      selected && styles.itemRowSelected,
      pressed && { backgroundColor: "#f3f4f6" },
    ]}
  >
    <Text style={styles.flag}>{toFlagEmoji(item.value)}</Text>
    <Text
      style={[styles.itemText, selected && styles.itemTextSelected]}
      numberOfLines={1}
    >
      {item.label}
    </Text>
    {selected && (
      <MaterialCommunityIcons name="check" size={16} color="#111827" />
    )}
  </Pressable>
));

export function NationalityInput({
  value,
  onChange,
  placeholder = "Select Nationality",
  disabled = false,
  searchPlaceholder = "Search country...",
  error = null,
  showErrorBorder = true,
  containerStyle,
}) {
  const [countries, setCountries] = useState([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [anchor, setAnchor] = useState(null);
  const [menuReady, setMenuReady] = useState(false);
  const [menuHeight, setMenuHeight] = useState(0);

  const buttonRef = React.useRef(null);

  // ── load countries ────────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;
    (async () => {
      const all = await getAllCountries();
      if (mounted) setCountries(all || []);
    })();
    return () => { mounted = false; };
  }, []);

  // ── derived ───────────────────────────────────────────────────────────────

  const items = useMemo(() =>
    countries.map((c) => ({ label: c.name, value: c.cca2, _country: c })),
    [countries]
  );

  const selectedItem = useMemo(() =>
    items.find((x) => x.value === value) ?? null,
    [items, value]
  );

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.label.toLowerCase().includes(q));
  }, [items, query]);

  const hasError = !!error;
  const showError = showErrorBorder && hasError;

  // ── positioning ───────────────────────────────────────────────────────────

  const direction = useMemo(() => {
    if (!anchor) return "down";
    const spaceBelow = SCREEN_HEIGHT - (anchor.y + anchor.height) - SCREEN_PADDING;
    const spaceAbove = anchor.y - SCREEN_PADDING;
    return spaceBelow >= spaceAbove ? "down" : "up";
  }, [anchor]);

  const maxMenuHeight = useMemo(() => {
    if (!anchor) return 320;
    const available = direction === "down"
      ? SCREEN_HEIGHT - (anchor.y + anchor.height) - MENU_OFFSET - SCREEN_PADDING
      : anchor.y - MENU_OFFSET - SCREEN_PADDING;
    return Math.max(180, Math.min(320, available));
  }, [anchor, direction]);

  const menuTop = useMemo(() => {
    if (!anchor || !menuHeight) return 0;
    return direction === "down"
      ? anchor.y + anchor.height + MENU_OFFSET
      : anchor.y - Math.min(menuHeight, maxMenuHeight) - MENU_OFFSET;
  }, [anchor, menuHeight, direction, maxMenuHeight]);

  const menuLeft = useMemo(() => {
    if (!anchor) return SCREEN_PADDING;
    const left = anchor.x + anchor.width / 2 - MENU_WIDTH / 2;
    return Math.max(SCREEN_PADDING, Math.min(left, SCREEN_WIDTH - MENU_WIDTH - SCREEN_PADDING));
  }, [anchor]);

  // ── handlers ──────────────────────────────────────────────────────────────

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
  
         if (disabled) return;
    buttonRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setMenuReady(false);
      setMenuHeight(0);
      setQuery("");
      setOpen(true);
    });
    });
  };
  


  const handleClose = () => {
    // Only hide the modal. Do NOT reset anchor/menuHeight/menuReady here: while
    // the modal plays its fade-out, those values still drive the menu's absolute
    // position. Nulling them makes menuTop/menuLeft fall back to 0/padding, so
    // the menu visibly jumps to the top-left before disappearing. They are
    // re-initialized on the next open (measureAndOpen).
    setOpen(false);
  };

  const pick = (item) => {
    onChange?.(item.value, item);
    handleClose();
  };

  const keyExtractor = useCallback((item) => String(item.value), []);

  const renderCountry = useCallback(
    ({ item }) => (
      <CountryRow item={item} selected={item.value === value} onPress={pick} />
    ),
    [value, pick]
  );


  // ── render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, containerStyle]}>

      {/* Trigger button */}
      <Pressable
        ref={buttonRef}
        onPress={handleOpen}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          showError && styles.buttonError,
          open && styles.buttonFocus,
          disabled && styles.buttonDisabled,
          pressed && !disabled && { opacity: 0.85 },
        ]}
      >
        {selectedItem ? (
          <View style={styles.buttonInner}>
            <Text style={styles.flag}>{toFlagEmoji(selectedItem.value)}</Text>
            <Text style={styles.buttonText} numberOfLines={1}>
              {selectedItem.label}
            </Text>
          </View>
        ) : (
          <Text style={[styles.placeholder, showError && styles.placeholderError]}>
            {placeholder}
          </Text>
        )}

        <MaterialCommunityIcons
          name={open ? "chevron-up" : "chevron-down"}
          size={22}
          color={disabled ? "#aaa" : "#111827"}
        />
      </Pressable>

      {/* Dropdown modal */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        {/*
          KeyboardAvoidingView wraps the whole modal content.
          On iOS "padding" shifts content up when keyboard appears.
          On Android the window is resized by the OS so "undefined" avoids double-shifting.
        */}
        <KeyboardAvoidingView
          style={styles.kavContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          {/* Dismiss overlay — sits behind the menu */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
          />

          {/* Menu — absolutely positioned relative to button */}
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
            {/* Search input — always visible at top of menu */}
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
                // Do NOT use autoFocus — it triggers keyboard before menu
                // is positioned, causing layout jumps
                style={styles.searchInput}
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery("")} hitSlop={8}>
                  <MaterialCommunityIcons name="close-circle" size={16} color="#9ca3af" />
                </Pressable>
              )}
            </View>

            {/* Country list */}
            <FlatList
              data={filteredItems}
              keyExtractor={keyExtractor}
              keyboardShouldPersistTaps="handled"  // ← lets taps reach list items while keyboard is open
              keyboardDismissMode="on-drag"          // ← dismiss keyboard when user scrolls
              renderItem={renderCountry}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No countries found</Text>
                </View>
              }
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Inline error */}
      {typeof error === "string" && error.trim() !== "" && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },

  // ── trigger button ──────────────────────────────────────────────────────
  button: {
    height: 55,
    width: "100%",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d0d5dd",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  buttonFocus: { borderWidth: 1.5, borderColor: "#333" },
  buttonError: { borderWidth: 1.5, borderColor: "#ef4444" },
  buttonDisabled: { backgroundColor: "#f4f4f5" },

  buttonInner: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, marginRight: 8 },
  buttonText: { fontSize: 15, color: "#111827", flex: 1 },
  placeholder: { fontSize: 15, color: "#9ca3af", flex: 1 },
  placeholderError: { color: "#ef4444" },

  // ── modal ───────────────────────────────────────────────────────────────
  kavContainer: {
    flex: 1,
    // transparent — overlay handled by absoluteFill Pressable
  },

  // ── menu ────────────────────────────────────────────────────────────────
  menu: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
    }),
  },

  // ── search ──────────────────────────────────────────────────────────────
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    marginVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    backgroundColor: "#fafafa",
    height: 40,
  },
  searchIcon: { marginRight: 6 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    paddingVertical: 0, // removes Android extra padding
  },

  // ── list items ──────────────────────────────────────────────────────────
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#f3f4f6",
  },
  flag: { fontSize: 22, lineHeight: 26 },
  itemText: { flex: 1, fontSize: 14, color: "#111827" },
  itemTextSelected: { fontWeight: "600" },

  empty: { paddingVertical: 20, alignItems: "center" },
  emptyText: { fontSize: 14, color: "#6b7280" },

  // ── error ───────────────────────────────────────────────────────────────
  errorText: { color: "#ef4444", marginTop: 4, fontSize: 12 },
});