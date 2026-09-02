import React, { useCallback, useContext } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Label } from "../../../components/typography/label.component";
import {
  CategoryContentView,
  CategoryHeaderView,
  CategoryImageContainer,
  CategoryItemContainer,
  CategoryItemImages,
  CategoryItemLabels,
  CategoryLabelContainer,
  Pressable,
} from "./category.styles";
import { NavigationContext } from "@react-navigation/native";
import { SectionContext } from "../../../services/section/section.context";
import { categorylogo, typeEnum } from "../../../utils/constants";
import { Skeleton } from "../../../components/skeleton";
import { itemSeparatorHM } from "../../../components/styles";
import { TranslationContext } from "../../../services/translation/translation.context";
import { REMOVE_CLIPPED_SUBVIEWS } from "../../../utils/listPerf";

const renderCategory = ({ item, navigation }) => {
  const handleOnPress = () => {
    navigation.navigate("LocationList", {
      type: typeEnum.category,
      search: item.id,
      page: 1,
      limit: 10,
      source: 2,
      headerTitle: item.pcategory_en,
    });
  };

  return (
    <>
      <Pressable activeOpacity={0.5} onPress={handleOnPress}>
        <CategoryItemContainer>
          <CategoryImageContainer //Linear Gradient
            // colors={[
            //   // item.color ? item.color : "#fff",
            //   item.color ? "black" : "#fff",
            //   item.color ? "black" : "#fff",
            //   // item.color ? "#FFF500" : "#fff",
            // ]}
            // start={{ x: Platform.OS === "ios" ? 0.9 : 0.7, y: 0 }}
            // locations={[0.0, 1.0]}
            resizeMode="cover"
            source={require("../../../../assets/ifza-login-bg.webp")}
          >
            <CategoryItemImages
              resizeMode="contain"
              style={styles.categoryItemImages}
              source={categorylogo[item.id]}
            />
          </CategoryImageContainer>
          <CategoryLabelContainer>
            <CategoryItemLabels size="caption" weight="bold">
              {item.pcategory_en}
            </CategoryItemLabels>
          </CategoryLabelContainer>
        </CategoryItemContainer>
      </Pressable>
    </>
  );
};

const SkeletonCategoryHome = () => {
  return (
    <>
      <Skeleton
        variant="square"
        width={100}
        height={140}
        opacityMin={0.1}
        opacityMax={0.2}
        borderRadius={10}
        style={styles.skeleton}
      />
      <Skeleton
        variant="square"
        width={100}
        height={140}
        opacityMin={0.1}
        opacityMax={0.2}
        borderRadius={10}
        style={styles.skeleton}
      />
      <Skeleton
        variant="square"
        width={100}
        height={140}
        opacityMin={0.1}
        opacityMax={0.2}
        borderRadius={10}
        style={styles.skeleton}
      />
      <Skeleton
        variant="square"
        width={100}
        height={140}
        opacityMin={0.1}
        opacityMax={0.2}
        borderRadius={10}
        style={styles.skeleton}
      />
    </>
  );
};

export const HomeCategory = ({ size, categoryData }) => {
  const navigation = useContext(NavigationContext);
  const { i18n, lang } = useContext(TranslationContext);
  const { setSectionTitle } = useContext(SectionContext);

  const renderItem = useCallback(
    ({ item }) => renderCategory({ item, navigation, setSectionTitle }),
    [navigation, setSectionTitle]
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  return (
    <>
      <View>
        <CategoryHeaderView>
          
            <Label size="heading" weight="bold" style={styles.label}>
              {i18n.t("categories")}
            </Label>
          
        </CategoryHeaderView>
        <CategoryContentView>
          {categoryData ? (
            <>
              <FlatList
                removeClippedSubviews={REMOVE_CLIPPED_SUBVIEWS}
                horizontal
                pagingEnabled
                data={categoryData}
                fadingEdgeLength={100}
                snapToAlignment="start"
                snapToInterval={100 + 16}
                decelerationRate="fast"
                overScrollMode="always"
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                keyboardDismissMode="interactive"
                showsHorizontalScrollIndicator={false}
                ItemSeparatorComponent={itemSeparatorHM}
                contentContainerStyle={styles.flatListContentContainer}
              />
            </>
          ) : (
            <>
              <View style={styles.row}>
                <SkeletonCategoryHome />
              </View>
            </>
          )}
        </CategoryContentView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  categoryItemImages: {
    tintColor: "white",
  },
  skeleton: {
    marginRight: 16,
  },
  label: {
    marginLeft: 16,
  },
  flatListContentContainer: {
    padding: 16,
    paddingTop: 10,
  },
  row: {
    flex: 1,
    paddingLeft: 16,
    paddingTop: 8,
    marginBottom: 18,
    flexDirection: "row",
  },
});
