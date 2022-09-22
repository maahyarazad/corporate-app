import React, { useContext, useEffect, useState } from "react";
import { View, FlatList } from "react-native";
import { Label } from "../../../components/typography/label.component";
import { Spacer } from "../../../components/spacer/spacer.component";
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
import { PartnerService } from "../../../services/location/location.service";
import { AuthContext } from "../../../services/auth/auth.context";

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
              style={{ tintColor: "white" }}
              source={categorylogo[item.id]}
            />
          </CategoryImageContainer>
          <CategoryLabelContainer>
            <CategoryItemLabels size={"caption"} weight={"bold"}>
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
        variant={"square"}
        width={100}
        height={140}
        opacityMin={0.1}
        opacityMax={0.2}
        borderRadius={10}
        style={{ marginRight: 16 }}
      />
      <Skeleton
        variant={"square"}
        width={100}
        height={140}
        opacityMin={0.1}
        opacityMax={0.2}
        borderRadius={10}
        style={{ marginRight: 16 }}
      />
      <Skeleton
        variant={"square"}
        width={100}
        height={140}
        opacityMin={0.1}
        opacityMax={0.2}
        borderRadius={10}
        style={{ marginRight: 16 }}
      />
      <Skeleton
        variant={"square"}
        width={100}
        height={140}
        opacityMin={0.1}
        opacityMax={0.2}
        borderRadius={10}
        style={{ marginRight: 16 }}
      />
    </>
  );
};

export const HomeCategory = ({ size }) => {
  const navigation = useContext(NavigationContext);

  const { setSectionTitle } = useContext(SectionContext);
  const [categoryList, setCategoryList] = useState();
  const { isLogout } = useContext(AuthContext);

  useEffect(() => {
    let isMounted = true;

    const getCategories = async () => {
      console.log("category");
      const categories = await PartnerService.getAvailableCategories();
      if (isMounted && categories) {
        setCategoryList(categories);
      }
    };
    if (!isLogout.current) {
      getCategories();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <View
        style={{
          flex: 1,
          justifyContent: "flex-start",
          marginTop: -12,
        }}
      >
        <CategoryHeaderView>
          <Spacer position="left" size="medium">
            <Label style={{ marginTop: 8 }} size="heading" weight="bold">
              Categories
            </Label>
          </Spacer>
        </CategoryHeaderView>
        <CategoryContentView>
          {categoryList ? (
            <>
              <FlatList
                horizontal
                pagingEnabled
                data={categoryList}
                fadingEdgeLength={100}
                snapToAlignment="start"
                snapToInterval={100 + 16}
                decelerationRate={"fast"}
                overScrollMode={"always"}
                renderItem={({ item }) =>
                  renderCategory({
                    item,
                    navigation,
                    setSectionTitle,
                  })
                }
                keyExtractor={(item) => item.id}
                keyboardDismissMode={"interactive"}
                showsHorizontalScrollIndicator={false}
                ItemSeparatorComponent={itemSeparatorHM}
                contentContainerStyle={{
                  padding: 16,
                  paddingTop: 10,
                }}
              />
            </>
          ) : (
            <>
              <View
                style={{
                  flex: 1,
                  paddingLeft: 16,
                  paddingTop: 8,
                  marginBottom: 18,
                  flexDirection: "row",
                }}
              >
                <SkeletonCategoryHome />
              </View>
            </>
          )}
        </CategoryContentView>
      </View>
    </>
  );
};
