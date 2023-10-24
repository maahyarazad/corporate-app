import React, { useContext, useEffect, useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { SpecialTags } from "../features/home/components/specialtags";
import { navigate } from "../navigation/navigate";
import { PartnerService } from "../services/location/location.service";
import { config, typeEnum } from "../utils/constants";
import { Skeleton } from "../components/skeleton";
import { width } from "../components/styles";
import { Label } from "../components/typography/label.component";
import { createStackNavigator } from "@react-navigation/stack";
import { UserContext } from "../services/user/user.context";
import { SearchButton } from "../components/searchbutton";
import { TranslationContext } from "../services/translation/translation.context";
import useRequest from "../../hooks/useRequest";

const OffersStack = createStackNavigator();

export const SpecialsScreen = ({ navigation }) => {
  const [specialTagList, setSpecialTagList] = useState([]);
  const { i18n, lang } = useContext(TranslationContext);
  const request = useRequest();

  useEffect(() => {
    let isMounted = true;

    const getAvailableTags = async () => {
      try {
        const response = await request(
          `/v2/partner/tags-available?app_id=${config.APP_ID}&lang=${lang}`,
          "get"
        );
        if (response && isMounted) {
          setSpecialTagList(response.result);
        }
      } catch (error) {
        console.error("Failed to get available tags: ", error);
      }
    };

    getAvailableTags();

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePress = (item) => {
    navigate("LocationList", {
      type: typeEnum.specialtags,
      search: item.id,
      page: 1,
      limit: 10,
      source: 2,
      headerTitle: item.specialtags_en,
    });
  };

  const handleSearch = () => {
    navigate("LocationList", {
      type: typeEnum.category,
      search: 0,
      page: 1,
      limit: 10,
      source: 2,
      headerTitle: i18n.t("search-all"),
    });
  };

  const cellSize = (width - 60) / 4;

  const renderSpecials = () => (
    <>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          height: 80,
        }}
      >
        <SearchButton onPress={handleSearch} />
      </View>
      {/* {false ? ( */}
      {specialTagList.length > 0 ? (
        <SpecialTags handlePress={handlePress} data={specialTagList} />
      ) : (
        <>
          <SkeletonTags cellSize={cellSize} />
        </>
      )}
    </>
  );

  const OffersScreen = () => {
    return (
      <View style={styles.centeredView}>
        <FlatList ListFooterComponent={renderSpecials} />
      </View>
    );
  };

  return (
    <>
      <OffersStack.Navigator>
        <OffersStack.Screen
          name="Offers1"
          component={OffersScreen}
          options={{
            headerShown: false,
          }}
        />
      </OffersStack.Navigator>
    </>
  );
};

const SkeletonTags = ({ cellSize }) => {
  return (
    <View style={{ paddingHorizontal: 16 }}>
      <Skeleton
        variant={"square"}
        height={30}
        width={200}
        borderRadius={10}
        opacityMax={0.2}
        opacityMin={0.1}
      />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingVertical: 16,
        }}
      >
        <View style={{ alignItems: "center" }}>
          <Skeleton
            width={cellSize}
            height={cellSize}
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
          />
          <Skeleton
            width={cellSize - 20}
            height={20}
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
            style={{ marginTop: 16 }}
          />
        </View>
        <View style={{ alignItems: "center" }}>
          <Skeleton
            width={cellSize}
            height={cellSize}
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
          />
          <Skeleton
            width={cellSize - 20}
            height={20}
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
            style={{ marginTop: 16 }}
          />
        </View>
        <View style={{ alignItems: "center" }}>
          <Skeleton
            width={cellSize}
            height={cellSize}
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
          />
          <Skeleton
            width={cellSize - 20}
            height={20}
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
            style={{ marginTop: 16 }}
          />
        </View>
        <View style={{ alignItems: "center" }}>
          <Skeleton
            width={cellSize}
            height={cellSize}
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
          />
          <Skeleton
            width={cellSize - 20}
            height={20}
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
            style={{ marginTop: 16 }}
          />
        </View>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingVertical: 16,
        }}
      >
        <View style={{ alignItems: "center" }}>
          <Skeleton
            width={cellSize}
            height={cellSize}
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
          />
          <Skeleton
            width={cellSize - 20}
            height={20}
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
            style={{ marginTop: 16 }}
          />
        </View>
        <View style={{ alignItems: "center" }}>
          <Skeleton
            width={cellSize}
            height={cellSize}
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
          />
          <Skeleton
            width={cellSize - 20}
            height={20}
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
            style={{ marginTop: 16 }}
          />
        </View>
        <View style={{ alignItems: "center" }}>
          <Skeleton
            width={cellSize}
            height={cellSize}
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
          />
          <Skeleton
            width={cellSize - 20}
            height={20}
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
            style={{ marginTop: 16 }}
          />
        </View>
        <View style={{ alignItems: "center" }}>
          <Skeleton
            width={cellSize}
            height={cellSize}
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
          />
          <Skeleton
            width={cellSize - 20}
            height={20}
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
            style={{ marginTop: 16 }}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "flex-start",
  },
});
