import React, { memo, useCallback, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from "react-native";
import { Chip } from "react-native-paper";
import { Label } from "../../../components/typography/label.component";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { adminFileBaseURL, offerChipIcon } from "../../../utils/constants";
import { Skeleton } from "../../../components/skeleton";
import { itemSeparatorHS, itemSeparatorVS } from "../../../components/styles";
import { CacheImage } from "../../../components/cacheImage";
import { LinearGradient } from "expo-linear-gradient";
import { REMOVE_CLIPPED_SUBVIEWS } from "../../../utils/listPerf";

const { width, height } = Dimensions.get("window");

// Chip row for a location's offer_types. Module scope + memo so it is not
// rebuilt per render. See contracts/list-api.md C1.
const OfferTypeChip = memo(({ label }) => (
  <Chip textStyle={chipStyles.text} style={chipStyles.chip}>
    <Label size="mini">{label}</Label>
  </Chip>
));

const chipStyles = StyleSheet.create({
  text: {
    marginVertical: 0,
    marginHorizontal: 0,
    paddingHorizontal: 0,
    marginRight: 0,
    marginLeft: 0,
  },
  chip: {
    backgroundColor: "#FFD892",
    padding: 0,
    margin: 0,
    borderRadius: 50,
    paddingHorizontal: 8,
    height: 25,
    justifyContent: "center",
  },
  centerBox: {
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 32,
  },
  label: {
    color: "#aaa",
    marginTop: 8,
  },
  box: {
    elevation: 10,
  },
  bordered: {
    borderRadius: 10,
  },
  rowCenter: {
    flexDirection: "row",
    height: "100%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 8,
    shadowOffset: {
      height: 3,
      width: 3,
    },
    shadowColor: "black",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
    alignItems: "center",
    height: 120,
    position: "relative",
  },
  bordered2: {
    width: 100,
    height: 100,
    borderRadius: 6,
    overflow: "hidden",
  },
  skeleton: {
    position: "absolute",
    zIndex: -1,
  },
  cacheImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  box2: {
    marginLeft: 8,
    height: "auto",
    justifyContent: "space-between",
    width: "70%",
  },
  box3: {
    margin: 0,
    padding: 0,
  },
  label2: {
    color: "#888",
  },
  spacer: {
    marginBottom: 6,
    marginTop: 8,
  },
  linearGradient: {
    flex: 1,
    position: "absolute",
    width: 20,
    height: 20,
    right: 0,
  },
  pad: {
    paddingHorizontal: 10,
  },
  skeleton2: {
    marginVertical: 8,
  },
  skeleton3: {
    marginBottom: 8,
  },
  skeleton4: {
    marginTop: 16,
  },
  flatListContentContainer: {
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 10,
  },
});

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
        <View style={chipStyles.centerBox}>
          <MaterialCommunityIcons
            name="emoticon-sad-outline"
            size={100}
            color="#aaa"
          />
          
          <Label size="title" weight="medium" style={chipStyles.label}>
            No results found
          </Label>
        </View>
      </>
    );
  };

  const renderChip = (item) => {
    return <MaterialCommunityIcons size={55} name={offerChipIcon[item.id]} />;
  };

  // offer_types exposes no confirmed id field - prefer premium_id when present,
  // fall back to the label, never the index. See follow-ups.md F1.
  const offerTypeKeyExtractor = useCallback(
    (item) => String(item.premium_id ?? item.premium_en),
    []
  );

  const renderOfferTypeChip = useCallback(
    ({ item }) => <OfferTypeChip label={item.premium_en} />,
    []
  );

  const renderLocations = ({ item }) => {
    return (
      <View
        style={chipStyles.box}
      >
        <TouchableHighlight
          style={chipStyles.bordered}
          activeOpacity={0.95}
          underlayColor="black"
          onPress={() => selectHandle(item.id)}
        >
          <View style={chipStyles.rowCenter}>
            <View style={chipStyles.bordered2}>
              <Skeleton
                variant="square"
                opacityMax={0.2}
                opacityMin={0.1}
                style={chipStyles.skeleton}
              />
              <CacheImage
                style={chipStyles.cacheImage}
                uri={`${adminFileBaseURL}${item.file}`}
              />
            </View>

            

            <View style={chipStyles.box2}>
              <View style={chipStyles.box3}>
                <Label numberOfLines={1} size="subtitle" weight="bold">
                  {item.outlet_name}
                </Label>
                {item.main_name != undefined && (
                  <Label style={chipStyles.label2} size="caption" weight="medium">
                    {item.main_name}
                  </Label>
                )}
              </View>
              <View style={chipStyles.spacer}>
                <Text
                  style={{
                    width: width - 100 - 50,
                  }}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {item.tags.map(
                    ({ tag }, index) =>
                      `${tag}${index < item.tags.length - 1 ? " • " : ""}`
                  )}
                </Text>
              </View>
              <View>
                <FlatList
                  removeClippedSubviews={REMOVE_CLIPPED_SUBVIEWS}
                  data={item.offer_types}
                  horizontal
                  scrollEnabled={false}
                  keyExtractor={offerTypeKeyExtractor}
                  renderItem={renderOfferTypeChip}
                  ItemSeparatorComponent={itemSeparatorHS}
                />
                <LinearGradient
                  colors={["#ffffff00", "#fff"]}
                  style={chipStyles.linearGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                ></LinearGradient>
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
        <View style={chipStyles.pad}>
          <Skeleton
            height={120}
            width="100%"
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
            style={chipStyles.skeleton2}
          />
          <Skeleton
            height={120}
            width="100%"
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
            style={chipStyles.skeleton3}
          />
          <Skeleton
            height={120}
            width="100%"
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
            style={chipStyles.skeleton3}
          />
          <Skeleton
            height={120}
            width="100%"
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
            style={chipStyles.skeleton3}
          />
          <Skeleton
            height={120}
            width="100%"
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
            style={chipStyles.skeleton3}
          />
          <Skeleton
            height={120}
            width="100%"
            borderRadius={10}
            opacityMax={0.2}
            opacityMin={0.1}
            style={chipStyles.skeleton3}
          />
        </View>
      </>
    );
  };

  const renderLoading = () => {
    return isLoadingMore ? (
      <Skeleton
        height={120}
        width="100%"
        borderRadius={10}
        opacityMax={0.2}
        opacityMin={0.1}
        style={chipStyles.skeleton4}
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
          removeClippedSubviews={REMOVE_CLIPPED_SUBVIEWS}
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          removeClippedSubviews={true}
          keyboardShouldPersistTaps="always"
          onLayout={onLayout}
          load
          onMomentumScrollEnd={onMomentumEnd}
          contentContainerStyle={chipStyles.flatListContentContainer}
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
