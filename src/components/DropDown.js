// Dropdown.js
import React, { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const SCREEN_PADDING = 8;
const MENU_OFFSET = 4; // gap between button and menu

export function DropDown({
  items = [],

  value,
  defaultValue = null,
  onChange,

  placeholder = "Select...",
  disabled = false,

  error = null,
  showErrorBorder = true,

  searchable = false,
  searchPlaceholder = "Search...",
  searchFilter,

  renderButtonLabel,
  renderItem,
  keyExtractor,

  style,
  buttonStyle,
  buttonTextStyle,
  menuStyle,
  itemStyle,
  itemTextStyle,
  overlayStyle,
  searchInputStyle,

  closeOnSelect = true,
  maxMenuHeight = 300,
  title,

  openDirection = "auto", // "auto" | "up" | "down"
}) {
  const isControlled = value !== undefined;

  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [query, setQuery] = useState("");
  const [anchor, setAnchor] = useState(null); // { x, y, width, height }
  const [menuHeight, setMenuHeight] = useState(0);
  const [menuReady, setMenuReady] = useState(false);

  const buttonRef = useRef(null);
  const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

  const selectedValue = isControlled ? (value ?? null) : internalValue;

  const hasError = !!error;
  const showError = showErrorBorder && hasError && !open;

  // ── derived ──────────────────────────────────────────────────────────────

  const selectedItem = useMemo(
    () => items.find((x) => Object.is(x.value, selectedValue)) ?? null,
    [items, selectedValue]
  );

  const filteredItems = useMemo(() => {
    if (!searchable) return items;
    const q = String(query || "").trim().toLowerCase();
    if (!q) return items;
    const fn =
      searchFilter ??
      ((qq, item) => String(item.label).toLowerCase().includes(qq));
    return items.filter((it) => fn(q, it));
  }, [items, query, searchable, searchFilter]);

  // ── direction & position ─────────────────────────────────────────────────

  const direction = useMemo(() => {
    if (openDirection === "up" || openDirection === "down") return openDirection;
    if (!anchor) return "down";
    const spaceBelow = screenHeight - (anchor.y + anchor.height) - SCREEN_PADDING;
    const spaceAbove = anchor.y - SCREEN_PADDING;
    return spaceBelow >= spaceAbove ? "down" : "up";
  }, [openDirection, anchor, screenHeight]);

  const cappedMenuHeight = useMemo(() => {
    if (!anchor) return maxMenuHeight;
    const available =
      direction === "down"
        ? screenHeight - (anchor.y + anchor.height) - MENU_OFFSET - SCREEN_PADDING
        : anchor.y - MENU_OFFSET - SCREEN_PADDING;
    return Math.max(80, Math.min(maxMenuHeight, available));
  }, [anchor, direction, maxMenuHeight, screenHeight]);

  const menuTop = useMemo(() => {
    if (!anchor || !menuHeight) return 0;
    if (direction === "down") return anchor.y + anchor.height + MENU_OFFSET;
    return anchor.y - Math.min(menuHeight, cappedMenuHeight) - MENU_OFFSET;
  }, [anchor, menuHeight, direction, cappedMenuHeight]);

  const menuLeft = useMemo(() => {
    if (!anchor) return SCREEN_PADDING;
    const menuWidth = Math.min(420, Math.round(screenWidth * 0.92));
    const left = anchor.x + anchor.width / 2 - menuWidth / 2;
    return Math.max(
      SCREEN_PADDING,
      Math.min(left, screenWidth - menuWidth - SCREEN_PADDING)
    );
  }, [anchor, screenWidth]);

  // ── handlers ─────────────────────────────────────────────────────────────

  const handlePress = () => {
    if (disabled) return;
    buttonRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setMenuReady(false);
      setMenuHeight(0);
      setQuery("");
      setOpen(true);
    });
  };

  const handleClose = () => {
    setOpen(false);
    setMenuReady(false);
    setMenuHeight(0);
    setAnchor(null);
    setQuery("");
  };

  const pick = (item) => {
    if (!item || item.disabled) return;
    if (!isControlled) setInternalValue(item.value);
    onChange?.(item.value, item);
    if (closeOnSelect) handleClose();
  };

  const defaultKeyExtractor = (item, index) => {
    const v = item?.value;
    if (typeof v === "string" || typeof v === "number") return String(v);
    return `${item?.label ?? "item"}-${index}`;
  };

  // ── styles (derived) ──────────────────────────────────────────────────────

  const borderStyle = showError
    ? styles.errorBorder
    : open
    ? styles.focusBorder
    : styles.normalBorder;

  const menuWidth = Math.min(420, Math.round(screenWidth * 0.92));

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.wrap, style]}>
      {/* Trigger button */}
      <Pressable
        ref={buttonRef}
        disabled={disabled}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.button,
          borderStyle,
          disabled && styles.buttonDisabled,
          pressed && !disabled && { opacity: 0.85 },
          buttonStyle,
        ]}
      >
        {renderButtonLabel ? (
          renderButtonLabel(selectedItem)
        ) : (
          <Text
            numberOfLines={1}
            style={[
              styles.buttonText,
              !selectedItem && styles.placeholder,
              showError && !selectedItem && styles.placeholderError,
              disabled && { opacity: 0.5 },
              buttonTextStyle,
            ]}
          >
            {selectedItem ? selectedItem.label : placeholder}
          </Text>
        )}

        <MaterialCommunityIcons
          name={open ? "chevron-up" : "chevron-down"}
          size={24}
          color={disabled ? "#aaa" : "#111827"}
        />
      </Pressable>

      {/* Dropdown modal */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent          // keeps measurements consistent on Android
        onRequestClose={handleClose}
      >
        {/* Dismiss overlay */}
        <Pressable
          style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}
          onPress={handleClose}
        />

        {/* Menu */}
        <View
          style={[
            styles.menu,
            {
              width: menuWidth,
              maxHeight: cappedMenuHeight,
              top: menuTop,
              left: menuLeft,
              opacity: menuReady ? 1 : 0,
            },
            menuStyle,
          ]}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h && !menuReady) {
              setMenuHeight(h);
              setMenuReady(true);
            }
          }}
        >
          {!!title && <Text style={styles.title}>{title}</Text>}

          {searchable && (
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={searchPlaceholder}
              placeholderTextColor="#999"
              autoCorrect={false}
              autoCapitalize="none"
              style={[styles.searchInput, searchInputStyle]}
            />
          )}

          <FlatList
            data={filteredItems}
            keyboardShouldPersistTaps="handled"
            keyExtractor={keyExtractor ?? defaultKeyExtractor}
            renderItem={({ item }) => {
              const selected = selectedItem
                ? Object.is(item.value, selectedItem.value)
                : false;

              return (
                <Pressable
                  onPress={() => pick(item)}
                  disabled={!!item.disabled}
                >
                  {renderItem ? (
                    renderItem(item, { selected, disabled: !!item.disabled })
                  ) : (
                    <View
                      style={[
                        styles.itemRow,
                        selected && styles.itemRowSelected,
                        item.disabled && styles.itemRowDisabled,
                        itemStyle,
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.itemText,
                          selected && styles.itemTextSelected,
                          item.disabled && { opacity: 0.4 },
                          itemTextStyle,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {selected && <Text style={styles.check}>✓</Text>}
                    </View>
                  )}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No results</Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* Inline error message */}
      {typeof error === "string" && error.trim() !== "" && (
        <Text style={styles.errorMessage}>{error}</Text>
      )}
    </View>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrap: { width: "100%" },

  button: {
    height: 55,
    width: "100%",
    borderRadius: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  normalBorder: { borderWidth: 1, borderColor: "#d0d5dd" },
  focusBorder: { borderWidth: 1.5, borderColor: "#333" },
  errorBorder: { borderWidth: 1.5, borderColor: "#ef4444" },
  buttonDisabled: { backgroundColor: "#f4f4f5" },

  buttonText: { flex: 1, fontSize: 15, color: "#111827", marginRight: 8 },
  placeholder: { color: "#9ca3af" },
  placeholderError: { color: "#ef4444" },

  overlay: { backgroundColor: "rgba(0,0,0,0.25)" },

  menu: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    // cross-platform shadow
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },

  title: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },

  searchInput: {
    height: 44,
    marginHorizontal: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fafafa",
  },

  itemRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#f3f4f6",
  },
  itemRowSelected: { backgroundColor: "#f9fafb" },
  itemRowDisabled: { opacity: 0.5 },

  itemText: { flex: 1, fontSize: 14, color: "#111827", marginRight: 8 },
  itemTextSelected: { fontWeight: "600" },
  check: { fontSize: 15, color: "#111827" },

  empty: { paddingVertical: 20, alignItems: "center" },
  emptyText: { fontSize: 14, color: "#6b7280" },

  errorMessage: { marginTop: 4, fontSize: 12, color: "#ef4444" },
});