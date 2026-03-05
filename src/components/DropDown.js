// Dropdown.js
// Pure React Native (no UI libs). JavaScript only.

import React, { useEffect, useMemo, useState } from "react";
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

/**
 * items: [{ label: string, value: any, disabled?: boolean }]
 */
export function Dropdown({
  items,

  // controlled / uncontrolled
  value, // if provided => controlled
  defaultValue = null,
  onChange,

  placeholder = "Select...",
  disabled = false,

  // search
  searchable = false,
  searchPlaceholder = "Search...",
  searchFilter, // (query, item) => boolean

  // customization
  renderButtonLabel, // (selectedItemOrNull) => ReactNode
  renderItem, // (item, { selected, disabled }) => ReactNode
  keyExtractor,

  // styles
  style,
  buttonStyle,
  buttonTextStyle,
  menuStyle,
  itemStyle,
  itemTextStyle,
  overlayStyle,
  searchInputStyle,

  // behavior
  closeOnSelect = true,
  maxMenuHeight = 360,
  title,
}) {
  const isControlled = value !== undefined;

  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [query, setQuery] = useState("");

  const selectedValue = isControlled ? (value ?? null) : internalValue;

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

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
    if (onChange) onChange(item.value, item);

    if (closeOnSelect) setOpen(false);
  };

  const defaultKeyExtractor = (item, index) => {
    const v = item?.value;
    if (typeof v === "string" || typeof v === "number") return String(v);
    return `${item?.label ?? "item"}-${index}`;
  };

  return (
    <View style={[styles.wrap, style]}>
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.button,
          pressed && !disabled ? { opacity: 0.85 } : null,
          disabled ? styles.buttonDisabled : null,
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
              !selectedItem ? styles.placeholder : null,
              disabled ? { opacity: 0.6 } : null,
              buttonTextStyle,
            ]}
          >
            {selectedItem ? selectedItem.label : placeholder}
          </Text>
        )}

        <Text style={[styles.chevron, disabled ? { opacity: 0.5 } : null]}>
          ▾
        </Text>
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
          {/* overlay */}
          <Pressable
            style={[styles.overlay, overlayStyle]}
            onPress={() => setOpen(false)}
          />

          {/* menu */}
          <View style={[styles.menu, menuStyle, { maxHeight: maxMenuHeight }]}>
            {!!title && <Text style={styles.title}>{title}</Text>}

            {searchable && (
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder}
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
    </View>
  );
}

const { width } = Dimensions.get("window");
const MENU_WIDTH = Math.min(420, Math.round(width * 0.92));

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
  button: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: "#d0d5dd",
    backgroundColor: "#fff",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  buttonDisabled: {
    backgroundColor: "#f4f4f5",
  },
  buttonText: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    marginRight: 10,
  },
  placeholder: {
    color: "#6b7280",
  },
  chevron: {
    fontSize: 16,
    color: "#111827",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  menu: {
    position: "absolute",
    alignSelf: "center",
    top: 90,
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
    marginHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    marginTop: 8,
    backgroundColor:"#fff",
    borderColor: "#e5e7eb",
   borderRadius: 4,
    minheight: 56,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    placeholderTextColor:'#999'
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
  itemRowSelected: {
    backgroundColor: "#f9fafb",
  },
  itemRowDisabled: {
    backgroundColor: "#fff",
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    marginRight: 10,
  },
  itemTextSelected: {
    fontWeight: "600",
  },
  check: {
    fontSize: 16,
    color: "#111827",
  },
  empty: {
    padding: 18,
    alignItems: "center",
  },
  emptyText: {
    color: "#6b7280",
  },
});