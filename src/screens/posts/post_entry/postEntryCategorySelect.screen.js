import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { goback, navigate } from "../../../navigation/navigate";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Label } from "../../../components/typography/label.component";
import { useNavigation, useRoute } from "@react-navigation/native";
import useRequest from "../../../../hooks/useRequest";
import { REMOVE_CLIPPED_SUBVIEWS } from "../../../utils/listPerf";

const PostEntryCategorySelect = () => {
  const keyExtractor = useCallback((item) => String(item.id), []);

  const renderCategoryItem = useCallback(
    ({ item }) => <CategoryButton category={item} />,
    []
  );

  const router = useRoute();
  const { type, list } = router.params;
  const navigation = useNavigation();

  const request = useRequest();

  useEffect(() => {
    return () => {};
  }, []);

  const onReturn = () => {
    goback();
  };

  const CategoryButton = ({ category }) => {
    const handleOnPress = () => {
      navigation.removeListener();
      navigate("post-entry", { type, category, editMode: false });
    };

    return (
      <TouchableOpacity onPress={handleOnPress}>
        <View style={{ paddingVertical: 20, paddingHorizontal: 20 }}>
          <Label>{category.category}</Label>
        </View>
      </TouchableOpacity>
    );
  };

  const RenderBody = () => {
    switch (type.id) {
      case 1:
        return (
          <View style={styles.bodyContainer}>
            <View style={styles.titleContainer}>
              <Label size={25} weight="bold">
                Forum-Kategorie
              </Label>
              <Label size="subtitle" weight="medium">
                What do you want to talk about?
              </Label>
            </View>
            <FlatList
              removeClippedSubviews={REMOVE_CLIPPED_SUBVIEWS}
              data={list}
              keyExtractor={keyExtractor}
              renderItem={renderCategoryItem}
              style={{ flex: 1, marginHorizontal: -20 }}
              overScrollMode="always"
              fadingEdgeLength={100}
              pagingEnabled
              snapToAlignment="start"
              snapToInterval={70}
              initialNumToRender={20}
              ItemSeparatorComponent={
                <View
                  style={{ backgroundColor: "#ddd", height: 1, width: "100%" }}
                ></View>
              }
            />
          </View>
        );
      case 2:
      case 3:
        return (
          <View style={styles.bodyContainer}>
            <View style={styles.titleContainer}>
              <Label size={25} weight="bold">
                Marktplatz-Kategorie
              </Label>
              <Label size="subtitle" weight="medium">
                {type.id === 2
                  ? "Was möchten Sie anbieten?"
                  : "Was möchten Sie suchen??"}
              </Label>
            </View>
            <FlatList
              removeClippedSubviews={REMOVE_CLIPPED_SUBVIEWS}
              data={list}
              keyExtractor={keyExtractor}
              renderItem={renderCategoryItem}
              style={{ flex: 1, marginHorizontal: -20 }}
              overScrollMode="always"
              fadingEdgeLength={100}
              pagingEnabled
              snapToAlignment="start"
              snapToInterval={70}
              initialNumToRender={20}
              ItemSeparatorComponent={
                <View
                  style={{ backgroundColor: "#ddd", height: 1, width: "100%" }}
                ></View>
              }
            />
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <View>
          <TouchableOpacity onPress={onReturn}>
            <View style={styles.backButton}>
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color="black"
              />
              <Label>Zurück</Label>
            </View>
          </TouchableOpacity>
        </View>
        <RenderBody />
      </View>
    </SafeAreaView>
  );
};

export default PostEntryCategorySelect;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  bodyContainer: {
    flex: 1,
    gap: 20,
    paddingTop: 30,
  },
  titleContainer: {
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
