import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { DropDown } from "../components/DropDown";
import { getAllCountries, Flag } from "react-native-country-picker-modal";

export function NationalityInput({
  value,
  onChange,
  placeholder = "Select Nationality",
  disabled = false,

  searchable = true,
  searchPlaceholder = "Search country...",

  error = null,
  showErrorBorder = true,

  containerStyle,
}) {
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const all = await getAllCountries();
      if (mounted) setCountries(all || []);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const items = useMemo(() => {
    return (countries || []).map((c) => ({
      label: c.name,
      value: c.cca2,
      _country: c,
    }));
  }, [countries]);

  const selectedCountry = useMemo(() => {
    return items.find((x) => x.value === value) || null;
  }, [items, value]);

  const hasError = !!error;
  const showError = showErrorBorder && hasError;

  return (
    <View
      style={[
        styles.container,
        showError ? styles.containerError : null,
        containerStyle,
      ]}
    >
      <DropDown
        items={items}
        value={value}
        onChange={onChange}
        disabled={disabled}
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
        placeholder={placeholder}
        showErrorBorder={false}
        buttonStyle={styles.button}
        menuStyle={styles.menu}
        renderButtonLabel={() => {
          if (!selectedCountry) {
            return <Text style={styles.placeholder}>{placeholder}</Text>;
          }

          const cca2 = selectedCountry.value;

          return (
            <View style={styles.buttonInner}>
              <Flag countryCode={cca2} flagSize={18} />
              <Text style={styles.buttonText}>{selectedCountry.label}</Text>
            </View>
          );
        }}
        renderItem={(item) => {
          const cca2 = item.value;

          return (
            <View style={styles.itemRow}>
              <Flag countryCode={cca2} flagSize={18} />
              <Text style={styles.itemText}>{item.label}</Text>
            </View>
          );
        }}
      />

      {typeof error === "string" && error.trim() !== "" ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    
  },

  containerError: {
    borderColor: "red",
  },

  button: {
    height: 56,
    borderWidth: 1,
    borderColor: "#d0d5dd",
    borderRadius: 4,
  },

  menu: {
    width: "90%",
  },

  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  buttonText: {
    fontSize: 15,
    color: "#111827",
  },

  placeholder: {
    color: "#999",
    fontSize: 15,
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },

  itemText: {
    fontSize: 14,
    color: "#111827",
  },

  errorText: {
    color: "red",
    marginTop: 6,
    fontSize: 12,
  },
});