// Import required libraries and components
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Linking, Platform, View, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Button, TouchableRipple } from "react-native-paper";
import styled from "styled-components/native";
import { CacheImage } from "../components/cacheImage";
import { LoadingOverlay } from "../components/loading/loading.component";
import { SafeArea } from "../components/safearea.component";
import { Label } from "../components/typography/label.component";
import { LocationContext } from "../services/location/location.context";
import { TranslationContext } from "../services/translation/translation.context";
import { adminFileBaseURL } from "../utils/constants";
import useRequest from "../../hooks/useRequest";
import { theme } from "../infrastructure/theme";
import { isCancel } from "../utils/cancellation";

// Styled components for the map and markers
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

// Main component for the map screen
export const MapScreen = () => {
  // Static-config screens receive only `route` - the navigator renders them
  // through a render callback, so `navigation` never arrives as a prop.
  const navigation = useNavigation();

  // Contexts to access location and translation services
  const { getUserLocation, userLocation, getLocationPermission } =
    useContext(LocationContext);
  const { i18n } = useContext(TranslationContext);

  // Component state for managing location data, loading states, etc.
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

  // Reference to the map component for programmatic control
  const mapRef = useRef();
  // Custom hook for API requests
  const request = useRequest();

  // Fetch partner locations and user location on component mount
  useEffect(() => {
    const controller = new AbortController();
    // expo-location has no abort support, so the position lookup runs to
    // completion regardless; this just stops it writing state afterwards.
    let cancelled = false;

    // Function to fetch partner coordinates
    const getCoordinates = async (count) => {
      try {
        const response = await request(
          `/v2/partner/coordinates/${count}`,
          "get",
          undefined,
          undefined,
          controller.signal
        );
        if (response) {
          setPartnerLocations(response);
        }
      } catch (error) {
        if (isCancel(error)) return;
        console.log("Failed to get coordinates:", error);
      }
    };

    getCoordinates(100);

    // Fetch the user's current location
    getUserLocation()
      .then((response) => {
        if (!cancelled) setMyLocation(response.coords);
      })
      .catch((err) => {
        console.log("error: ", err);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  // Function to center the map on the user's location
  const handleCenter = () => {
    if (mapRef.current && myLocation) {
      mapRef.current.animateCamera(
        {
          center: {
            latitude: myLocation.latitude,
            longitude: myLocation.longitude,
          },
          altitude: 10000,
          zoom: 15,
          pitch: 1,
          heading: 1,
        },
        { duration: 500 }
      );
    }
  };

  // Function to convert degrees to radians
  const degToRad = (degrees) => {
    return degrees * (Math.PI / 180);
  };

  // Function to center the map on a partner's location and calculate the distance
  const handlePartnerCentre = (lat, lng) => {
    // Calculate distance if the user's location is known
    if (myLocation && myLocation.latitude && myLocation.longitude) {
      const dLat = degToRad(Math.abs(lat - myLocation.latitude));
      const dLong = degToRad(Math.abs(lng - myLocation.longitude));
      // Earth's radius in meters
      const eRadius = 6378137;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(degToRad(lat)) *
          Math.cos(degToRad(myLocation.latitude)) *
          Math.sin(dLong / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = eRadius * c;
      setDistance((d / 1000).toFixed(2)); // Convert distance to kilometers and set state
    }

    // Center the map on the partner's location
    if (mapRef.current) {
      mapRef.current.animateCamera(
        {
          center: {
            latitude: lat - 0.005, // Offset for better visibility
            longitude: lng,
          },
          altitude: 10000,
          zoom: 15,
          pitch: 1,
          heading: 1,
        },
        { duration: 200 }
      );
    }
  };

  // Function to navigate to the location view
  const goLocation = (locationId) => {
    navigation.navigate("Location View", { locId: locationId });
  };

  // Function to open the device settings to change permissions
  const handleChangePermission = () => {
    Linking.openSettings();
  };

  // Function to open the native map for directions
  const getDirections = (lat, lng, place) => {
    // Platform-specific URL scheme
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

  // Function to navigate back in the navigation stack
  const navigateBack = () => {
    navigation.goBack();
  };

  // Render loading view if user location is not yet available
  if (!userLocation) {
    return (
      <SafeArea style={styles.safeArea}>
        {/* Instructions to enable location permissions */}
        <View style={styles.rowBetween}>
          <View>
            <TouchableRipple
              onPress={navigateBack}
              style={styles.touchableRipple}
              rippleColor="#444"
            >
              <Ionicons name="arrow-back" size={35} />
            </TouchableRipple>
          </View>
        </View>
        <View style={styles.centerBox}>
          <Label style={styles.label}>
            You need to enable Location in your device settings.
          </Label>
          <Button
            style={styles.button}
            buttonColor={theme.colors.icons.active}
            mode="contained"
            onPress={handleChangePermission}
          >
            Change Permission
          </Button>
        </View>
      </SafeArea>
    );
  }

  // Main render method for the map and markers
  return (
    <>
      <View style={styles.fill}>
        {partnerLocations && myLocation ? (
          <StyledMap
            provider="google"
            ref={mapRef}
            camera={{
              center: {
                latitude: myLocation.latitude,
                longitude: myLocation.longitude,
              },
              altitude: 10000,
              zoom: 15,
              pitch: 1,
              heading: 1,
            }}
          >
            {/* User location marker */}
            <Marker
              tracksViewChanges={false}
              coordinate={{
                longitude: myLocation.longitude,
                latitude: myLocation.latitude,
              }}
            >
              <MyLocationMarkerRange>
                <MyLocationMarker></MyLocationMarker>
              </MyLocationMarkerRange>
            </Marker>
            {/* Partner location markers */}
            {partnerLocations.map((location, index) => (
              <Marker
                key={index}
                tracksViewChanges={false}
                coordinate={{
                  longitude: location.lng,
                  latitude: location.lat,
                }}
                onPress={() => {
                  // Set location details and show partner details
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
          </StyledMap>
        ) : (
          <LoadingOverlay display={true} />
        )}
        {/* Overlay for back button and partner details */}
        <SafeArea style={styles.safeArea2} pointerEvents="box-none">
          {/* Navigation and action buttons */}
          <View style={styles.rowBetween} pointerEvents="box-none">
            <View>
              <TouchableRipple
                onPress={navigateBack}
                style={styles.touchableRipple}
                rippleColor="#444"
              >
                <Ionicons name="arrow-back" size={35} />
              </TouchableRipple>
            </View>
            <View style={styles.box}>
              <TouchableRipple
                onPress={handleCenter}
                style={styles.touchableRipple2}
                rippleColor="#444"
              >
                <MaterialIcons
                  name="my-location"
                  size={35}
                  color="#0e89ff"
                />
              </TouchableRipple>
            </View>
          </View>
          {/* Partner details view */}
          {showPartnerDetails ? (
            <View style={styles.row} pointerEvents="box-none">
              <View style={styles.bordered}>
                <View>
                  {/* Image loading overlay */}
                  {showImageload ? (
                    <View style={styles.overlay}>
                      <LoadingOverlay display={true}></LoadingOverlay>
                    </View>
                  ) : null}

                  {/* Cached image of the location */}
                  <CacheImage
                    onLoadStart={() => setShowImageload(true)}
                    onLoad={() => setShowImageload(false)}
                    uri={`${adminFileBaseURL}${locationState.locationImage}`}
                    style={styles.cacheImage}
                  />
                 
                  {/* Location name and distance */}
                  <Label size="title" weight="bold" style={styles.label2}>
                    {locationState.locationName}
                  </Label>
                  <Label size="subtitle" weight="medium" style={styles.label3}>
                    {distance} KM
                  </Label>
                  <View style={styles.label2} />

                  {/* Action buttons */}
                  <View style={styles.row2}>
                    <Button
                      style={styles.button2}
                      labelStyle={styles.buttonLabel}
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
                      <View style={styles.spacer} />
                    <Button
                      style={styles.button2}
                      labelStyle={styles.buttonLabel}
                      buttonColor="#0082FF"
                      mode="contained"
                      onPress={() => goLocation(locationState.locationId)}
                    >
                      {i18n.t("redeem-offer.view-offer").toUpperCase()}
                    </Button>
                  </View>
                </View>
              </View>
            </View>
          ) : null}
        </SafeArea>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    top: 0,
    width: "100%",
  },
  rowBetween: {
    flexDirection: "row",
    paddingHorizontal: 16,
    width: "100%",
    justifyContent: "space-between",
  },
  touchableRipple: {
    borderRadius: 25,
    padding: 10,
    overflow: "hidden",
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  label: {
    textAlign: "center",
  },
  button: {
    borderRadius: 8,
  },
  fill: {
    flex: 1,
  },
  safeArea2: {
    flex: 1,
    position: "absolute",
    top: 0,
    width: "100%",
    flexDirection: "column",
    height: "100%",
  },
  box: {
    alignItems: "flex-end",
    alignSelf: "flex-end",
  },
  touchableRipple2: {
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
    shadowOffset: {
      width: 1,
      height: 1,
    },
  },
  row: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
  },
  bordered: {
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
  },
  overlay: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    overflow: "hidden",
    position: "absolute",
    zIndex: 1,
  },
  cacheImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
    borderRadius: 10,
  },
  label2: {
    marginTop: 10,
  },
  label3: {
    color: "#aaa",
  },
  row2: {
    flexDirection: "row",
  },
  button2: {
    borderRadius: 10,
    flex: 1,
    height: 40,
  },
  buttonLabel: {
    fontSize: 12,
    width: "100%",
  },
  spacer: {
    marginLeft: 6,
  },
});
