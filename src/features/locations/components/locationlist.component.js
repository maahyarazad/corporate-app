import React, { useContext, useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  Text,
  TouchableHighlight,
  View,
} from "react-native";
import { Chip } from "react-native-paper";
import { Label } from "../../../components/typography/label.component";
import { Spacer } from "../../../components/spacer/spacer.component";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { adminFileBaseURL, offerChipIcon } from "../../../utils/constants";
import { Skeleton } from "../../../components/skeleton";
import { KeyboardAwareFlatList } from "react-native-keyboard-aware-scroll-view";
import { itemSeparatorHS, itemSeparatorVS } from "../../../components/styles";
import { CacheImage } from "../../../components/cacheImage";

const { width, height } = Dimensions.get("window");

export const LocationList = ({
  navigation,
  locations,
  isLoading,
  isLoadingMore,
  loadMore,
  onLayout,
  onScroll,
  onMomentumScrollEnd,
}) => {
  const [isEndReached, setIsEndReached] = useState(false);

  const selectHandle = (id) => {
    navigation.navigate("Location View", {
      locId: id,
    });
  };

  const renderEmpty = () => {
    return (
      <>
        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
            marginVertical: 32,
          }}
        >
          <MaterialCommunityIcons
            name="emoticon-sad-outline"
            size={100}
            color="#aaa"
          />
          <Spacer position={"top"} size="medium" />
          <Label size={"title"} weight="medium" style={{ color: "#aaa" }}>
            No results found
          </Label>
        </View>
      </>
    );
  };

  const renderChip = (item) => {
    return <MaterialCommunityIcons size={55} name={offerChipIcon[item.id]} />;
  };

  const renderLocations = ({ item }) => {
    return (
      <View
        style={{
          // flex: 1,
          elevation: 10,
        }}
      >
        <TouchableHighlight
          style={{ borderRadius: 10 }}
          activeOpacity={0.95}
          underlayColor={"black"}
          onPress={() => selectHandle(item.id)}
        >
          <View
            style={{
              flexDirection: "row",
              height: "100%",
              backgroundColor: "white",
              borderRadius: 10,
              padding: 8,
              shadowOffset: { height: 3, width: 3 },
              shadowColor: "black",
              shadowOpacity: 0.2,
              shadowRadius: 5,
              elevation: 10,
              alignItems: "center",
              height: 120,
              position: "relative",
            }}
          >
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <Skeleton
                variant={"square"}
                opacityMax={0.2}
                opacityMin={0.1}
                style={{ position: "absolute", zIndex: -1 }}
              />
              <CacheImage
                style={{
                  width: "100%",
                  height: "100%",
                  resizeMode: "cover",
                }}
                uri={`${adminFileBaseURL}${item.file}`}
              />
            </View>
            <Spacer position={"left"} size={"small"} />
            <View
              style={{
                height: "auto",
                justifyContent: "space-between",
                width: "70%",
              }}
            >
              <View style={{ margin: 0, padding: 0 }}>
                <Label numberOfLines={1} size={"subtitle"} weight={"bold"}>
                  {item.outlet_name}
                </Label>
                {item.main_name != undefined && (
                  <Label
                    style={{ color: "#888" }}
                    size={"caption"}
                    weight={"medium"}
                  >
                    {item.main_name}
                  </Label>
                )}
              </View>
              <View style={{ marginBottom: 6, marginTop: 8 }}>
                <Text
                  style={{
                    width: width - 100 - 50,
                  }}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {item.tags.map(
                    ({ tag }, index) =>
                      `${tag}${index < item.tags.length ? " • " : ""}`
                  )}
                </Text>
              </View>
              <View style={{ height: 20 }}>
                <FlatList
                  data={item.offer_types}
                  horizontal
                  scrollEnabled={false}
                  renderItem={({ item }) => {
                    return (
                      <Chip
                        icon={() => renderChip(item)}
                        textStyle={{ marginLeft: 0 }}
                        style={{
                          backgroundColor: "#FFD892",
                          padding: 0,
                          height: 20,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Label size={"mini"}>{item.premium_en}</Label>
                      </Chip>
                    );
                  }}
                  ItemSeparatorComponent={itemSeparatorHS}
                />
              </View>
            </View>
          </View>
        </TouchableHighlight>
      </View>
    );
  };

  const SkeletonLocations = () => {
    return (
      <>
        <View style={{ paddingHorizontal: 10 }}>
          <Skeleton
            height={120}
            width={"100%"}
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
            style={{ marginVertical: 8 }}
          />
          <Skeleton
            height={120}
            width={"100%"}
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
            style={{ marginBottom: 8 }}
          />
          <Skeleton
            height={120}
            width={"100%"}
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
            style={{ marginBottom: 8 }}
          />
          <Skeleton
            height={120}
            width={"100%"}
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
            style={{ marginBottom: 8 }}
          />
          <Skeleton
            height={120}
            width={"100%"}
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
            style={{ marginBottom: 8 }}
          />
          <Skeleton
            height={120}
            width={"100%"}
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
            style={{ marginBottom: 8 }}
          />
        </View>
      </>
    );
  };

  const renderLoading = () => {
    return isLoadingMore ? (
      <Skeleton
        height={120}
        width={"100%"}
        borderRadius={10}
        opacityMax={0.2}
        opacityMin={0.1}
        style={{ marginTop: 16 }}
      />
    ) : null;
  };

  const onMomentumEnd = () => {
    if (isEndReached) {
      onMomentumScrollEnd();
      setIsEndReached(false);
    }
  };

  const handleEndReached = () => setIsEndReached(true);

  return (
    <View style={{ flex: 1, width: width }}>
      {!isLoading ? (
        <FlatList
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          removeClippedSubviews={true}
          keyboardShouldPersistTaps="always"
          onLayout={onLayout}
          load
          onMomentumScrollEnd={onMomentumEnd}
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: 16,
            paddingHorizontal: 10,
          }}
          ListEmptyComponent={renderEmpty}
          data={locations}
          extraData={locations}
          renderItem={renderLocations}
          keyExtractor={(item) => item.id}
          onEndReached={handleEndReached}
          onEndReachedThreshold={Platform.OS === "ios" ? 0.1 : 0.5}
          // onEndReachedThreshold={0.1}
          initialNumToRender={5}
          windowSize={Platform.OS === "ios" ? 5 : 10}
          maxToRenderPerBatch={Platform.OS === "ios" ? 1 : 4}
          persistentScrollbar={true}
          ListFooterComponent={renderLoading}
          onMomentumScrollBegin={onScroll}
          automaticallyAdjustsScrollIndicatorInsets={false}
          automaticallyAdjustKeyboardInsets={true}
          ItemSeparatorComponent={itemSeparatorVS}
        />
      ) : (
        <SkeletonLocations />
      )}
    </View>
  );
};
