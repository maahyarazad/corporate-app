import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Linking, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Button, TouchableRipple } from "react-native-paper";
import styled from "styled-components";
import { CacheImage } from "../components/cacheImage";
import { LoadingOverlay } from "../components/loading/loading.component";
import { SafeArea } from "../components/safearea.component";
import { Spacer } from "../components/spacer/spacer.component";
import { Label } from "../components/typography/label.component";
import { LocationContext } from "../services/location/location.context";
import { TranslationContext } from "../services/translation/translation.context";
import { adminFileBaseURL } from "../utils/constants";
import useRequest from "../../hooks/useRequest";

export const StyledMap = styled(MapView)`
  flex: 1;
`;

export const MyLocationMarkerRange = styled(View)`
  width: 150px;
  height: 150px;
  background-color: #0e89ff33;
  border-radius: 150px;
  align-items: center;
  justify-content: center;
`;

export const MyLocationMarker = styled(View)`
  width: 25px;
  height: 25px;
  background-color: #0e89ff;
  border-radius: 25px;
  border-width: 3px;
  border-color: white;
`;

export const MapScreen = ({ navigation }) => {
  const { getUserLocation, getCoords, userLocation } =
    useContext(LocationContext);
  const [myLocation, setMyLocation] = useState(null);
  const [partnerLocations, setPartnerLocations] = useState();
  const [showImageload, setShowImageload] = useState(false);
  const [distance, setDistance] = useState(0);
  const [locationState, setLocationState] = useState({
    locationName: "",
    locationImage: "",
    lat: 0,
    lng: 0,
    locationId: 0,
  });
  const [showPartnerDetails, setShowPartnerDetails] = useState(false);
  const { i18n } = useContext(TranslationContext);
  const mapRef = useRef();
  const request = useRequest();

  useEffect(() => {
    let isMounted = true;

    // getCoords(100).then((response) => {
    // if (isMounted) setPartnerLocations(response);
    // });

    const getCoordinates = async (count) => {
      try {
        const response = await request(
          `/v2/partner/coordinates/${count}`,
          "get"
        );

        if (response) {
          console.log(getCoordinates);
          if (isMounted) setPartnerLocations(response);
        }
      } catch (error) {
        console.error("Failed to get coordinates:", error);
      }
    };

    getCoordinates(100);

    console.log("userLocation:", userLocation);

    getUserLocation()
      .then((response) => {
        console.log("getuserlocation response: ", response);
        if (isMounted) setMyLocation(response.coords);
      })
      .catch((err) => {
        console.log("error: ", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCenter = () => {
    mapRef != undefined &&
      mapRef.current.animateCamera(
        {
          center: {
            latitude: myLocation?.latitude,
            longitude: myLocation?.longitude,
          },
          altitude: 10000,
          zoom: 15,
          pitch: 1,
          heading: 1,
        },
        { duration: 500 }
      );
  };

  const degToRad = (degrees) => {
    return degrees * (Math.PI / 180);
  };

  const handlePartnerCentre = (lat, lng) => {
    if (!!myLocation && !!myLocation.latitude && !!myLocation.longitude) {
      const dLat = degToRad(Math.abs(lat - myLocation?.latitude));
      const dLong = degToRad(Math.abs(lng - myLocation?.longitude));
      const eRadius = 6378137;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(degToRad(lat)) *
          Math.cos(degToRad(myLocation?.latitude)) *
          Math.sin(dLong / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = eRadius * c;

      setDistance((d / 1000).toFixed(2));
    }

    mapRef != undefined &&
      mapRef.current.animateCamera(
        {
          center: {
            latitude: lat - 0.005,
            longitude: lng,
          },
          altitude: 10000,
          zoom: 15,
          pitch: 1,
          heading: 1,
        },
        { duration: 200 }
      );
  };

  const goLocation = (locationId) => {
    navigation.navigate("Location View", {
      locId: locationId,
    });
  };

  const getDirections = (lat, lng, place) => {
    const scheme = Platform.select({
      ios: "maps:0,0?q=",
      android: "geo:0,0?q=",
    });
    const latLng = `${lat},${lng}`;
    const label = place;
    const url = Platform.select({
      ios: `${scheme}${encodeURIComponent(label)}@${latLng}`,
      android: `${scheme}${latLng}(${encodeURIComponent(label)})`,
    });
    Linking.openURL(url);
  };

  const navigateBack = () => {
    navigation.goBack();
  };

  if (!userLocation) {
    return (
      <SafeArea
        style={{
          flex: 1,
          top: 0,
          width: "100%",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 16,
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <View>
            <TouchableRipple
              onPress={navigateBack}
              style={{ borderRadius: 25, padding: 10, overflow: "hidden" }}
              rippleColor={"#444"}
            >
              <Ionicons name={"arrow-back"} size={35} />
            </TouchableRipple>
          </View>
        </View>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 32,
          }}
        >
          <Label style={{ textAlign: "center" }}>
            You need to enable Location in your device settings.
          </Label>
        </View>
      </SafeArea>
    );
  }

  return (
    <>
      <View style={{ flex: 1 }}>
        {/* {myLocation && <Text>{myLocation.latitude}</Text>}*/}
        {/* <StyledMap></StyledMap>  */}
        {/* <MapView z></MapView> */}
        {partnerLocations != undefined && myLocation != undefined ? (
          <MapView
            style={{ flex: 1 }}
            provider={"google"}
            // minZoomLevel={14} // default => 0
            // maxZoomLevel={15} // default => 20
            ref={mapRef}
            // zoomEnabled={false}
            camera={{
              center: {
                latitude: myLocation?.latitude,
                longitude: myLocation?.longitude,
              },
              altitude: 10000,
              zoom: 15,
              pitch: 1,
              heading: 1,
            }}

            // region={{
            //   latitude: myLocation?.latitude,
            //   longitude: myLocation?.longitude,
            //   latitudeDelta: 0,
            //   longitudeDelta: 0,
            // }}
          >
            <Marker
              tracksViewChanges={false}
              coordinate={{
                longitude: myLocation?.longitude,
                latitude: myLocation?.latitude,
              }}
            >
              <MyLocationMarkerRange>
                <MyLocationMarker></MyLocationMarker>
              </MyLocationMarkerRange>
            </Marker>
            {partnerLocations.map((location, index) => (
              <Marker
                key={index}
                tracksViewChanges={false}
                coordinate={{
                  longitude: location.lng,
                  latitude: location.lat,
                }}
                onPress={() => {
                  setLocationState({
                    ...locationState,
                    locationName: location.title,
                    locationImage: location.file,
                    locationId: location.id,
                    lat: location.lat,
                    lng: location.lng,
                  });

                  handlePartnerCentre(location.lat, location.lng);
                  setShowPartnerDetails(true);
                }}
              ></Marker>
            ))}
          </MapView>
        ) : (
          <LoadingOverlay display={true} />
        )}
        <SafeArea
          style={{
            flex: 1,
            position: "absolute",
            top: 0,
            width: "100%",
            flexDirection: "column",
            height: "100%",
          }}
          pointerEvents="box-none"
        >
          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: 16,
              width: "100%",
              justifyContent: "space-between",
            }}
            pointerEvents="box-none"
          >
            <View>
              <TouchableRipple
                onPress={navigateBack}
                style={{ borderRadius: 25, padding: 10, overflow: "hidden" }}
                rippleColor={"#444"}
              >
                <Ionicons name={"arrow-back"} size={35} />
              </TouchableRipple>
            </View>
            <View
              style={{
                alignItems: "flex-end",
                alignSelf: "flex-end",
              }}
            >
              <TouchableRipple
                onPress={handleCenter}
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 70,
                  padding: 10,
                  backgroundColor: "white",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 30,
                  elevation: 15,
                  shadowColor: "black",
                  shadowOpacity: 0.4,
                  shadowRadius: 5,
                  shadowOffset: { width: 1, height: 1 },
                }}
                rippleColor={"#444"}
              >
                <MaterialIcons
                  name={"my-location"}
                  size={35}
                  color={"#0e89ff"}
                />
              </TouchableRipple>
            </View>
          </View>
          {showPartnerDetails ? (
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "flex-end",
              }}
              pointerEvents="box-none"
            >
              <View
                style={{
                  backgroundColor: "white",
                  height: "auto",
                  width: "90%",
                  padding: 20,
                  marginRight: 20,
                  marginLeft: 20,
                  borderRadius: 10,
                  shadowOpacity: 0.4,
                  shadowOffset: {
                    height: 5,
                    width: 5,
                  },
                  shadowRadius: 7,
                }}
              >
                <View>
                  <View>
                    {showImageload ? (
                      <View
                        style={{
                          width: "100%",
                          height: 150,
                          borderRadius: 10,
                          overflow: "hidden",
                          position: "absolute",
                          zIndex: 1,
                        }}
                      >
                        <LoadingOverlay display={true}></LoadingOverlay>
                      </View>
                    ) : (
                      <></>
                    )}

                    <CacheImage
                      onLoadStart={() => {
                        setShowImageload(true);
                        console.log("starting");
                        //alert(`${adminFileBaseURL}${locationState.locationImage}`)
                      }}
                      onLoad={() => {
                        setShowImageload(false);
                        console.log("complete");
                      }}
                      uri={`${adminFileBaseURL}${locationState.locationImage}`}
                      style={{
                        width: "100%",
                        height: 150,
                        resizeMode: "cover",
                        borderRadius: 10,
                      }}
                    />
                  </View>
                  <Spacer size={"medium"} position={"top"}></Spacer>
                  <Label size={"title"} weight={"bold"}>
                    {locationState.locationName}
                  </Label>
                  <Label
                    size={"subtitle"}
                    weight={"medium"}
                    style={{ color: "#aaa" }}
                  >
                    {distance} KM
                  </Label>
                  <Spacer size={"medium"} position={"top"}></Spacer>

                  <View
                    style={{
                      flexDirection: "row",
                      // flex: 1,
                    }}
                  >
                    <Button
                      style={{
                        borderRadius: 10,
                        flex: 1,
                        height: 40,
                      }}
                      labelStyle={{
                        fontSize: 12,
                        width: "100%",
                      }}
                      buttonColor="#0082FF"
                      mode="contained"
                      onPress={() =>
                        getDirections(
                          locationState.lat,
                          locationState.lng,
                          locationState.locationName
                        )
                      }
                    >
                      {i18n.t("offer-details.get-directions").toUpperCase()}
                    </Button>
                    <Spacer size={"small"} position={"left"}></Spacer>
                    <Button
                      style={{
                        borderRadius: 10,
                        flex: 1,
                        height: 40,
                      }}
                      labelStyle={{
                        fontSize: 12,
                        width: "100%",
                      }}
                      buttonColor="#0082FF"
                      mode="contained"
                      onPress={() => {
                        goLocation(locationState.locationId);
                      }}
                    >
                      {i18n.t("redeem-offer.view-offer").toUpperCase()}
                    </Button>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <></>
          )}
        </SafeArea>
      </View>
    </>
  );
};
