import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View, Platform
} from "react-native";
import { SafeArea } from "../../components/safearea.component";
import { Label } from "../../components/typography/label.component";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Button, TouchableRipple } from "react-native-paper";
import { LocationContext } from "../../services/location/location.context";
import { Map } from "../../components/map/map.component";
import * as WebBrowser from "expo-web-browser";
import { getPreciseDistance } from "geolib";
import { Slideshow } from "../../components/slideshow";
import { SkeletonLocation } from "../../components/skeletonLocation";
import { itemSeparatorHS } from "../../components/styles";
import { OfferList } from "../../components/offerList";
import { LocationInfo } from "../../components/location/LocationInfo.component";
import { TranslationContext } from "../../services/translation/translation.context";
import useRequest from "../../../hooks/useRequest";
import { config } from "../../utils/constants";

const { width, height } = Dimensions.get("window");

export const LocationViewScreen = ({ route, navigation }) => {
  const locationId = route.params.locId;
  const { getOneLocation, userLocation } = useContext(LocationContext);
  const [location, setLocation] = useState(null);
  const { i18n, lang } = useContext(TranslationContext);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [distance, setDistance] = useState();
  const isMounted = useRef(true);
  const request = useRequest();

  useEffect(() => {
    isMounted.current = true;
    if (location != undefined && userLocation != undefined) {
      if (isMounted.current) setLoading(false);
    }

    return () => {
      isMounted.current = false;
    };
  }, [location, userLocation]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    isMounted.current = true;

    onRefresh(signal);

    return () => {
      // controller.abort();
      isMounted.current = false;
    };
  }, [userLocation]);

  const onRefresh = (signal) => {
    setLoading(true);
    getLocation(signal);
  };

  const getLocation = async (signal) => {
    try {
      const response = await request(
        `/v2/partner/${locationId}?app=${config.APP_ID}&lang=${lang}`,
        "get",
        undefined,
        undefined,
        signal
      );

      if (isMounted.current && response) {
        setLocation(response);
        setLoading(false);

        if (
          response.lat != undefined &&
          response.lng != undefined &&
          userLocation != undefined
        ) {
          setDistance(() => {
            const _distance = getPreciseDistance(
              {
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
              },
              { latitude: response.lat, longitude: response.lng }
            );
            return (_distance / 1000).toFixed(2); //Unit: Kilometer
          });
        }
      }
    } catch (error) {
      console.log("Failed to get location:", error);
    }
  };

  const openWebsite = async (url) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      console.log(error);
    }
  };

  const getDirections = () => {
    const scheme = Platform.select({
      ios: "maps:0,0?q=",
      android: "geo:0,0?q=",
    });
    const latLng = `${location?.lat},${location?.lng}`;
    const label = location?.name;
    const url = Platform.select({
      ios: `${scheme}${encodeURIComponent(label)}@${latLng}`,
      android: `${scheme}${latLng}(${encodeURIComponent(label)})`,
    });
    Linking.openURL(url);
  };

  const navigateBack = () => {
    navigation.goBack();
  };
const SLIDESHOW_HEIGHT = Math.floor(width * 9 / 16);
  const renderPartner = () => {
    return (
      <>
        <View style={{ backgroundColor: "#efefef" }}>
             
          <View>
            <View style={{ height: SLIDESHOW_HEIGHT }}>
              {width != undefined && location != undefined && (
                <>
                  <Slideshow images={location.images} />
                </>
              )}
            </View>

            <View>
               
              <View style={{ padding: 16 }}>
              
                <LocationInfo
                  location={location}
                  distance={distance}
                  headerSize={"title"}
                  subheaderSize={"subtitle"}
                  infoSize={"subtitle"}
                />
              </View>
              <View style={{ padding: 16, paddingTop: 6 }}>
                <Label numberOfLines={3} weight={"medium"}>
                  {location != undefined &&
                    location.tags != undefined &&
                    location.tags.map(
                      ({ tag }, index) =>
                        `${tag}${index < location.tags.length - 1 ? " • " : ""}`
                    )}
                </Label>
              </View>

              {location != undefined && location.offers != undefined && (
                <OfferList
                  location={location}
                  distance={distance}
                  minItems={3}
                  offers={location.offers}
                />
              )}

              {location != undefined &&
                location.lat != undefined &&
                location.lng != undefined &&
                location.zoom != undefined && (
                  <View
                    style={{
                      paddingHorizontal: 16,
                    }}
                  >
                    <Label size={"heading"} weight={"bold"}>
                      {i18n.t("offer-details.location")}
                    </Label>
                    <View style={{ marginVertical: 8 }}>
                      <Label weight={"medium"}>
                        {location != undefined &&
                        location?.contact_addition != undefined
                          ? location?.contact_addition
                              .split(`\n`)
                              .join(",")
                              .split(`,,`)
                              .join(",")
                              .split(",")
                              .map((text) => text.trim())
                              .join(", ")
                              .split(`, ,`)
                              .join(",")
                          : ""}
                      </Label>
                    </View>
                    <Map
                      lat={location.lat}
                      lng={location.lng}
                      zoom={location.zoom}
                    />

                    <View
                      style={{
                        flexDirection: "row",
                        flex: 1,
                      }}
                    >
                      <Button
                        mode="contained"
                        labelStyle={{
                          color: "#1282FF",
                          fontWeight: "bold",
                        }}
                        contentStyle={{ height: 50 }}
                        style={[
                          style.mapButtons,
                          { borderBottomLeftRadius: 12 },
                        ]}
                        onPress={getDirections}
                      >
                        {`${i18n.t("offer-details.get-directions")}`}
                      </Button>
                      {location != undefined && location.web != undefined && (
                        <Button
                          mode="contained"
                          labelStyle={{
                            color: "#1282FF",
                            fontWeight: "bold",
                          }}
                          contentStyle={{ height: 50 }}
                          style={[
                            style.mapButtons,
                            {
                              borderBottomRightRadius: 12,
                              borderLeftWidth: 1,
                              borderColor: "#bbb",
                            },
                          ]}
                          onPress={() => openWebsite(location.web)}
                        >
                          {`${i18n.t("offer-details.visit-website")}`}
                        </Button>
                      )}
                    </View>
                  </View>
                )}
              {location && location.name && location.about_en && (
                <View
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    gap: 8,
                  }}
                >
                  <Label size={"heading"} weight={"bold"}>
                    {`${i18n.t("offer-details.about", {
                      partner: location.name,
                    })}`}
                  </Label>
                  <Label size={"body"} weight={"regular"}>
                    {location.about_en}
                  </Label>
                </View>
              )}
            </View>
          </View>
          <SafeArea style={{ position: "absolute", top: 0 }}>
            <View style={{ paddingHorizontal: 16 }}>
              <TouchableRipple
                onPress={navigateBack}
                style={{
                  borderRadius: 50,
                  // padding: 8,
                  height: 50,
                  width: 50,
                  overflow: "hidden",
                }}
                rippleColor={"#444"}
              >
                <View
                  style={{
                    height: "100%",
                    width: "100%",
                    backgroundColor: "#33333377",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name={"arrow-back"} color="white" size={35} />
                </View>
              </TouchableRipple>
            </View>
          </SafeArea>
        </View>
      </>
    );
  };

  const animatedValue = useRef(new Animated.Value(0)).current;

  const headerInterpolated = animatedValue.interpolate({
    inputRange: [100, 270],
    outputRange: [-200, 0],
    extrapolate: "clamp",
  });

  const callNumber = (phoneNumber) => {
    Linking.openURL(`tel:${encodeURIComponent(phoneNumber.trim())}`).catch(
      (err) => {
        alert("Unable to call this number");
      }
    );
  };

  useEffect(() => {
    if (animatedValue > 2) {
    //   console.log("yey");
    }
  }, [animatedValue]);

  return (
    <>
      <SkeletonLocation display={loading} />
      {/* <LoadingOverlay display={loading} /> */}
      <Animated.View
        style={{
          backgroundColor: "white",
          alignSelf: "stretch",
          position: "absolute",
          top: 0,
          width: "100%",
          zIndex: 999,
          transform: [
            {
              translateY: headerInterpolated,
            },
          ],
        }}
      >
        <SafeArea>
          <View
            style={{
              paddingVertical: 13,
              paddingHorizontal: 6,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity onPress={navigateBack}>
                <MaterialIcons
                  name="arrow-back-ios"
                  size={25}
                  style={{ fontWeight: "bold" }}
                />
              </TouchableOpacity>
              {itemSeparatorHS()}
              <Label size={"title"} weight={"bold"}>
                {location != undefined ? location.name : ""}
              </Label>
            </View>
            <View style={{ paddingHorizontal: 16, alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => {
                  callNumber(
                    location != undefined ? location.phone.split("|")[0] : ""
                  );
                }}
              >
                <MaterialIcons
                  name="call"
                  size={25}
                  style={{ fontWeight: "bold" }}
                />
              </TouchableOpacity>
            </View>
          </View>
        </SafeArea>
      </Animated.View>
      <Animated.FlatList
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: animatedValue } } }],
          { useNativeDriver: true }
        )}
        // ListHeaderComponent={renderPartnerHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListFooterComponent={renderPartner}
      />
    </>
  );
};

const style = StyleSheet.create({
  offerItems: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    shadowOffset: { width: 4, height: 4 },
    shadowRadius: 5,
    shadowOpacity: 0.3,
    elevation: 10,
  },
  offerContentContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  offerIconContainer: {
    width: 60,
    height: 60,
    borderWidth: 5,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  mapButtons: {
    flex: 1,
    backgroundColor: "#ddd",
    borderRadius: 0,
  },
});
