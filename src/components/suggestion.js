import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { memo, useCallback } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";
import { keywordIcon, searchSource } from "../utils/constants";
import { Label } from "./typography/label.component";

const itemSeparatorSuggestion = () => (
  <View style={{ borderBottomWidth: 1, borderColor: "#ddd" }}></View>
);

// onPress receives the item: `(item) => void`. Keeps the row memo-comparable.
const SuggestionRow = memo(({ item, onPress }) => (
  <TouchableHighlight
    activeOpacity={0.9}
    underlayColor="#ddd"
    onPress={() => onPress(item)}
  >
    <View style={styles.row}>
      <MaterialCommunityIcons name={keywordIcon[item.keywordType]} size={25} />
      <Label style={styles.rowLabel}>{item.keyword}</Label>
    </View>
  </TouchableHighlight>
));

export const Suggestion = ({ suggestedList, onPress }) => {
  // Was keyExtractor={(_, index) => index} - an index key, returned as a number.
  // `keyword` is the stable domain value and is what the row displays.
  const keyExtractor = useCallback((item) => String(item.keyword), []);

  const handlePress = useCallback(
    (item) => onPress(item.keyword, searchSource.suggestion),
    [onPress]
  );

  const renderSuggestion = useCallback(
    ({ item }) => <SuggestionRow item={item} onPress={handlePress} />,
    [handlePress]
  );

  return (
    <View style={styles.suggestedOverlay}>
      <View style={styles.suggestListContainer}>
        <FlatList
          data={suggestedList}
          scrollEnabled={false}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={itemSeparatorSuggestion}
          renderItem={renderSuggestion}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  rowLabel: {
    paddingLeft: 8,
  },

  suggestedOverlay: {
    position: "absolute",
    width: "100%",
    top: 53,
    paddingHorizontal: 14,
    shadowOpacity: 0.4,
    shadowOffset: {
      height: 5,
    },
    shadowRadius: 10,
    elevation: 10,
  },
  suggestListContainer: {
    flex: 1,
    backgroundColor: "white",
  },
});
