// Dropdown.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  TextInput,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const GAP = -20; // nicer than negative
const SCREEN_PADDING = 8;

export function DropDown({
  items,

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
  maxMenuHeight = 360,
  title,

  // ✅ NEW
  openBelow = false, // boolean requested
  openDirection = "auto", // "auto" | "up" | "down" (optional)
}) {
  const isControlled = value !== undefined;

  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [query, setQuery] = useState("");

  const selectedValue = isControlled ? (value ?? null) : internalValue;

  const hasError = !!error;
  const showError = showErrorBorder && hasError && !open;

  const buttonRef = useRef(null);
  const { height: screenHeight } = Dimensions.get("window");

  // ---- positioning state ----
  const [anchor, setAnchor] = useState(null); // {x,y,width,height}
  const [measuredMenuHeight, setMeasuredMenuHeight] = useState(0);
  const [menuTop, setMenuTop] = useState(0);
  const [menuReady, setMenuReady] = useState(false);

  const selectedItem = useMemo(() => {
    return items.find((x) => Object.is(x.value, selectedValue)) || null;
  }, [items, selectedValue]);

  const filteredItems = useMemo(() => {
    if (!searchable) return items;

    const q = String(query || "").trim().toLowerCase();
    if (!q) return items;

    const filterFn =
      searchFilter ||
      ((qq, item) => String(item.label).toLowerCase().includes(qq));

    return items.filter((it) => filterFn(q, it));
  }, [items, query, searchable, searchFilter]);

  const pick = (item) => {
    if (!item || item.disabled) return;

    if (!isControlled) setInternalValue(item.value);
    onChange?.(item.value, item);

    if (closeOnSelect) setOpen(false);
  };

  const defaultKeyExtractor = (item, index) => {
    const v = item?.value;
    if (typeof v === "string" || typeof v === "number") return String(v);
    return `${item?.label ?? "item"}-${index}`;
  };

  const borderStateStyle = showError
    ? styles.errorBorder
    : open
    ? styles.focusBorder
    : styles.normalBorder;

  const textStateStyle = showError
    ? styles.textError
    : open
    ? styles.textFocus
    : styles.textNormal;

  const isPlaceholder = !selectedItem;
  const placeholderStateStyle =
    isPlaceholder && showError
      ? styles.placeholderError
      : isPlaceholder
      ? styles.placeholder
      : null;

  const resetModalState = () => {
    setMenuReady(false);
    setMeasuredMenuHeight(0);
    setMenuTop(0);
    setAnchor(null);
    setQuery("");
  };

  useEffect(() => {
    if (!open) resetModalState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handlePress = () => {
    if (disabled) return;

    buttonRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setOpen(true);
    });
  };

  const resolvedDirection = useMemo(() => {
  // explicit boolean takes precedence
  if (openBelow) return "down";
  if (openDirection === "up" || openDirection === "down") return openDirection;

  // fallback to auto
  if (!anchor) return "down";

  const spaceAbove = anchor.y - SCREEN_PADDING;
  const spaceBelow = screenHeight - (anchor.y + anchor.height) - SCREEN_PADDING;

  // pick direction with more space
  return spaceBelow >= spaceAbove ? "down" : "up";
}, [openBelow, openDirection, anchor, screenHeight]);

const computedMaxHeight = useMemo(() => {
  if (!anchor) return maxMenuHeight;

  const availableAbove = anchor.y - GAP - SCREEN_PADDING;
  const availableBelow =
    screenHeight - (anchor.y + anchor.height) - GAP - SCREEN_PADDING;

  const available = openBelow ? availableBelow : availableAbove;

  return Math.max(120, Math.min(maxMenuHeight, available));
}, [anchor, maxMenuHeight, screenHeight, openBelow]);

const IOS_TOP_ADJUST = Platform.OS === "ios" ? 25 : 0;

useEffect(() => {
  if (!open || !anchor || !measuredMenuHeight) return;

  const baseTop = openBelow
    ? anchor.y + anchor.height + (GAP + 53)
    : anchor.y - measuredMenuHeight - GAP;

  let top = baseTop - IOS_TOP_ADJUST;

  top = Math.max(SCREEN_PADDING, top);
  const maxTop = screenHeight - measuredMenuHeight - SCREEN_PADDING;
  top = Math.min(top, maxTop);

  setMenuTop(top);
  setMenuReady(true);
}, [open, anchor, measuredMenuHeight, screenHeight, openBelow]);

  return (
    <View style={[styles.wrap, style]}>
      <Pressable
        ref={buttonRef}
        disabled={disabled}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.button,
          borderStateStyle,
          disabled ? styles.buttonDisabled : null,
          pressed && !disabled ? { opacity: 0.9 } : null,
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
              textStateStyle,
              placeholderStateStyle,
              disabled ? { opacity: 0.6 } : null,
              buttonTextStyle,
            ]}
          >
            {selectedItem ? selectedItem.label : placeholder}
          </Text>
        )}

        <View style={styles.chevronWrap}>
          <MaterialCommunityIcons
            name="chevron-down"
            size={25}
            color={disabled ? "rgba(17,24,39,0.5)" : "#111827"}
          />
        </View>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <Pressable
            style={[styles.overlay, overlayStyle]}
            onPress={() => setOpen(false)}
          />

          <View
            style={[
              styles.menu,
              {
                top: menuReady ? menuTop : SCREEN_PADDING,
                opacity: menuReady ? 1 : 0,
                maxHeight: computedMaxHeight,
              },
              menuStyle,
            ]}
            onLayout={(e) => {
              const h = e.nativeEvent.layout.height;
              if (!measuredMenuHeight && h) setMeasuredMenuHeight(h);
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
                style={[styles.searchInput, searchInputStyle]}
              />
            )}

            <FlatList
              data={filteredItems}
              keyboardShouldPersistTaps="handled"
              keyExtractor={keyExtractor || defaultKeyExtractor}
              renderItem={({ item }) => {
                const selected = selectedItem
                  ? Object.is(item.value, selectedItem.value)
                  : false;

                const row = renderItem ? (
                  renderItem(item, { selected, disabled: !!item.disabled })
                ) : (
                  <View
                    style={[
                      styles.itemRow,
                      selected ? styles.itemRowSelected : null,
                      item.disabled ? styles.itemRowDisabled : null,
                      itemStyle,
                    ]}
                  >
                    <Text
                      style={[
                        styles.itemText,
                        selected ? styles.itemTextSelected : null,
                        item.disabled ? { opacity: 0.5 } : null,
                        itemTextStyle,
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>

                    {selected ? <Text style={styles.check}>✓</Text> : null}
                  </View>
                );

                return (
                  <Pressable onPress={() => pick(item)} disabled={item.disabled}>
                    {row}
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
        </KeyboardAvoidingView>
      </Modal>

      {typeof error === "string" && error.trim() !== "" ? (
        <Text style={styles.errorMessage}>{error}</Text>
      ) : null}
    </View>
  );
}

const { width } = Dimensions.get("window");
const MENU_WIDTH = Math.min(420, Math.round(width * 0.92));

const styles = StyleSheet.create({
  wrap: { width: "100%" },

  button: {
    height: 60,
    width: "100%",
    borderRadius: 4,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  normalBorder: { borderWidth: 1, borderColor: "#d0d5dd" },
  focusBorder: { borderWidth: 1, borderColor: "#333" },
  errorBorder: { borderWidth: 2, borderColor: "red" },

  buttonDisabled: { backgroundColor: "#f4f4f5" },

  buttonText: { flex: 1, fontSize: 15, marginRight: 10 },

  textNormal: { color: "#111827" },
  textFocus: { color: "#111827" },
  textError: { color: "#111827" },

  placeholder: { paddingLeft: 8, color: "#999" },
  placeholderError: { paddingLeft: 8, color: "red" },

  chevronWrap: { alignItems: "center", justifyContent: "center" },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  menu: {
    position: "absolute",
    alignSelf: "center",
    width: MENU_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  title: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },

  searchInput: {
    height: 56,
    marginHorizontal: 12,
    marginBottom: 10,
    marginTop: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#111827",
  },

  itemRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  itemRowSelected: { backgroundColor: "#f9fafb" },
  itemRowDisabled: { backgroundColor: "#fff" },

  itemText: { flex: 1, fontSize: 14, color: "#111827", marginRight: 10 },
  itemTextSelected: { fontWeight: "600" },
  check: { fontSize: 16, color: "#111827" },

  empty: { padding: 18, alignItems: "center" },
  emptyText: { color: "#6b7280" },

  errorMessage: { color: "red", marginTop: 6, fontSize: 12 },
});