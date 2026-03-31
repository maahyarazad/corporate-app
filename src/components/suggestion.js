import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";
import { keywordIcon, searchSource } from "../utils/constants";
import { Label } from "./typography/label.component";

export const Suggestion = ({ suggestedList, onPress }) => {
  const itemSeparatorSuggestion = () => (
    <View style={{ borderBottomWidth: 1, borderColor: "#ddd" }}></View>
  );

  return (
    <View style={styles.suggestedOverlay}>
      <View style={styles.suggestListContainer}>
        <FlatList
          data={suggestedList}
          scrollEnabled={false}
          keyExtractor={(_, index) => index}
          ItemSeparatorComponent={itemSeparatorSuggestion}
          renderItem={({ item }) => {
            return (
              <TouchableHighlight
                activeOpacity={0.9}
                underlayColor="#ddd"
                onPress={() => {
                  onPress(item.keyword, searchSource.suggestion);
                }}
              >
                <View
                  style={{
                    padding: 12,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <MaterialCommunityIcons
                    name={keywordIcon[item.keywordType]}
                    size={25}
                  />
                  <Label style={{ paddingLeft: 8 }}>{item.keyword}</Label>
                </View>
              </TouchableHighlight>
            );
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
