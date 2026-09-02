import { getPreciseDistance } from "geolib";
import React, { useCallback, useContext } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { navigate } from "../navigation/navigate";
import { LocationContext } from "../services/location/location.context";
import { TranslationContext } from "../services/translation/translation.context";
import { adminFileBaseURL, typeEnum } from "../utils/constants";
import { MyCard } from "./myCard.component";
import { Skeleton } from "./skeleton";
import { itemSeparatorHM } from "./styles";
import { Label } from "./typography/label.component";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { REMOVE_CLIPPED_SUBVIEWS } from "../utils/listPerf";

export const LocationCards = ({ label, locationList }) => {
  const keyExtractor = useCallback((item) => String(item.id), []);

  const renderLocation = useCallback(
    ({ item }) => <RenderLocation item={item} />,
    []
  );

  const { width } = Dimensions.get("window");
  const { userLocation } = useContext(LocationContext);
  const { i18n } = useContext(TranslationContext);

  const handlePress = (id) => {
    navigate("Location View", {
      locId: id,
    });
  };

  const handleSeeAll = (id) => {
    // setSectionTitle(label)
    navigate("LocationList", {
      type: typeEnum.category,
      search: id,
      page: 1,
      limit: 10,
      source: 2,
      headerTitle: label,
    });
  };

  const getDistanceInKM = (lat, lng) => {
    if (userLocation != undefined && lat != undefined && lng != undefined) {
      const _distance = getPreciseDistance(
        {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        },
        { latitude: lat, longitude: lng }
      );
      return (_distance / 1000).toFixed(2); //Unit: Kilometer
    }
  };

  class RenderLocation extends React.PureComponent {
    render() {
      const { item } = this.props;

      return (
        <>
          {/* <TouchableOpacity
            activeOpacity={0.4}
            onPress={() => handlePress(item.id)}
            style={{
              shadowOpacity: 0.3,
              shadowOffset: { width: 4, height: 4 },
              shadowRadius: 4,
              elevation: 10,
            }}
          > */}
          <View
            needsOffscreenAlphaCompositing={true}
            style={[styles.cardWrapper, { width: width - 32 }]}
            key={`${item}`}
          >
            <MyCard
              onPress={() => {
                handlePress(item.id);
              }}
              distance={
                !!item.lat && !!item.lng
                  ? `${getDistanceInKM(item.lat, item.lng)} km`
                  : undefined
              }
              imgUrl={`${adminFileBaseURL}${item.file}`}
              main_name={item.main_name}
              outlet_name={item.outlet_name}
              offer_types={item.offer_types}
              tags={item.tags}
              userLocation={userLocation}
              size="partner"
            />
            {/* <Card style={{ borderRadius: 10 }}>
                <View
                  style={{
                    position: "relative",
                    // backgroundColor: "#ccc",
                  }}
                >
                  <CacheImage
                    style={{
                      borderTopLeftRadius: 10,
                      borderTopRightRadius: 10,
                      backgroundColor: "#aaa",
                      width: "100%",
                      height: 250,
                    }}
                    uri={`${adminFileBaseURL}${item.file}`}
                  />
                  {userLocation && (
                    <View
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        zIndex: 100,
                        borderRadius: 20,
                        padding: 8,
                        backgroundColor: "#eee",
                        margin: 8,
                      }}
                    >
                      <Label size="mini" weight="bold">
                        {`${getDistanceInKM(item.lat, item.lng)} km`}
                      </Label>
                    </View>
                  )}
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.titleSlot}>
                    <Label size="title" weight="bold">
                      {item.outlet_name}
                    </Label>
                    {item.main_name != undefined && (
                      <Label
                        style={styles.subtleText}
                        size="body"
                        weight="bold"
                      >
                        {item.main_name}
                      </Label>
                    )}
                  </View>
                  <View style={styles.tagsSlot}>
                    <Label
                      numberOfLines={2}
                      size="body"
                      weight="regular"
                      style={styles.subtleText}
                    >
                      {item.tags.map(
                        ({ tag }, index) =>
                          `${tag}${index < item.tags.length - 1 ? " • " : ""`
                      )}
                    </Label>
                  </View>
                </View>
                <Card.Content style={styles.chipRow}>
                  {item.offer_types.map((type, index) => {
                    return (
                      <Chip
                        // textStyle={{ marginLeft: 0 }}
                        key={`${type}${index}`}
                        style={styles.chip}
                      >
                        {type.premium_en}
                      </Chip>
                    );
                  })}
                </Card.Content>
              </Card> */}
          </View>
          {/* </TouchableOpacity> */}
        </>
      );
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Label size="heading" weight="bold">
          {label}
        </Label>
        <TouchableOpacity
          onPress={() => {
            handleSeeAll(locationList[0].catid);
          }}
          style={styles.seeAll}
        >
          <Label
            // style={{ textDecorationLine: "underline", color: "#006EFF" }}
            size="body"
            weight="bold"
            style={styles.seeAllLabel}
          >
            {i18n.t("see-all")}
          </Label>
          <MaterialCommunityIcons size={25} name="arrow-right" />
        </TouchableOpacity>
      </View>
      <View style={styles.carousel}>
        {locationList != undefined ? (
          <FlatList
            removeClippedSubviews={REMOVE_CLIPPED_SUBVIEWS}
            style={styles.list}
            horizontal
            data={locationList}
            showsHorizontalScrollIndicator={false}
            renderItem={renderLocation}
            pagingEnabled={true}
            fadingEdgeLength={100}
            snapToAlignment="start"
            snapToInterval={width - 16}
            decelerationRate="fast"
            overScrollMode="always"
            keyExtractor={keyExtractor}
            keyboardDismissMode="interactive"
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={itemSeparatorHM}
          />
        ) : (
          <>
            <View style={styles.skeletonRow}>
              <Skeleton
                borderRadius={10}
                height={312}
                width={width - 32}
                opacityMax={0.2}
                opacityMin={0.1}
              />
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  seeAll: { display: "flex", flexDirection: "row", alignItems: "center" },
  seeAllLabel: { marginRight: 4 },
  carousel: { marginBottom: 8 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16 },

  // one card in the horizontal carousel. `width` comes from Dimensions inside
  // the component, so it CANNOT live here - a module-scope StyleSheet.create
  // runs before that const exists. It is applied inline at the call site.
  cardWrapper: { borderRadius: 10, marginBottom: 16 },
  cardBody: { flex: 1, paddingHorizontal: 16, paddingVertical: 8 },
  titleSlot: { height: 40, justifyContent: "center" },
  tagsSlot: { paddingTop: 8, paddingBottom: 2 },
  subtleText: { color: "#aaa" },
  chipRow: { flexDirection: "row", padding: 0, margin: 0 },
  chip: {
    backgroundColor: "#FFD892",
    padding: 0,
    height: 20,
    alignItems: "flex-start",
    justifyContent: "center",
    marginRight: 8,
  },

  skeletonRow: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  container: {},
});
