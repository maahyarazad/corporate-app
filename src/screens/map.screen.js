// Import required libraries and components
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  Linking,
  Platform,
  View,
  StyleSheet,
  useWindowDimensions
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Button, TouchableRipple } from "react-native-paper";
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


const EARTH_RADIUS_M = 6378137;
const ICON_SIZE = 30;


const degToRad = (degrees) => degrees * (Math.PI / 180);


const PartnerMarker = React.memo(({ location, onSelect }) => (
  <Marker
    tracksViewChanges={false}
    coordinate={{ longitude: location.lng, latitude: location.lat }}
    onPress={() => onSelect(location)}
  />
));

PartnerMarker.displayName = "PartnerMarker";


// Main component for the map screen
export const MapScreen = () => {
  // Static-config screens receive only `route` - the navigator renders them
  // through a render callback, so `navigation` never arrives as a prop.
  const navigation = useNavigation();
  // `Dimensions.get("window")` read during render is a snapshot, not a
  // subscription: it returns whatever the last measurement was and never
  // re-renders on its own, so the value only refreshed when something else
  // happened to re-render this screen. On rotation, a foldable unfolding or
  // split-screen resize, the map kept its old padding until an unrelated state
  // change knocked it loose. useWindowDimensions subscribes to the same change
  // events and re-renders when they fire.
  const { height: screenHeight } = useWindowDimensions();

  // The object is memoized, not the arithmetic. `screenHeight - 80` is one
  // subtraction and memoizing it would cost more than it saves; the object
  // literal is the part that mattered - a fresh identity every render, handed
  // to a native-backed component, so the prop was re-sent across on every
  // single render. Keyed on screenHeight so a resize still rebuilds it.
  const mapPadding = useMemo(
    () => ({ top: screenHeight - 80, right: 0, bottom: 0, left: 0 }),
    [screenHeight]
  );

  // Contexts to access location and translation services
  const { getUserLocation, userLocation } = useContext(LocationContext);
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
  //

  const handleCenter = useCallback(() => {
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
  }, [myLocation]);

  // Function to center the map on a partner's location and calculate the distance
  //

  const handlePartnerCentre = useCallback(
    (lat, lng) => {
      // Calculate distance if the user's location is known
      if (myLocation && myLocation.latitude && myLocation.longitude) {
        const dLat = degToRad(Math.abs(lat - myLocation.latitude));
        const dLong = degToRad(Math.abs(lng - myLocation.longitude));
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(degToRad(lat)) *
            Math.cos(degToRad(myLocation.latitude)) *
            Math.sin(dLong / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = EARTH_RADIUS_M * c;

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
    },
    [myLocation]
  );

  
  const handleSelectPartner = useCallback(
    (location) => {
      setLocationState((prev) => ({
        ...prev,
        locationName: location.title,
        locationImage: location.file,
        locationId: location.id,
        lat: location.lat,
        lng: location.lng,
      }));

      handlePartnerCentre(location.lat, location.lng);
      setShowPartnerDetails(true);
    },
    [handlePartnerCentre]
  );

  // Function to navigate to the location view

  const goLocation = useCallback(() => {
    navigation.navigate("Location View", { locId: locationState.locationId });
  }, [navigation, locationState.locationId]);

  // Function to open the native map for directions

  const getDirections = useCallback(() => {
    // Platform-specific URL scheme
    const scheme = Platform.select({
      ios: "maps:0,0?q=",
      android: "geo:0,0?q=",
    });
    const latLng = `${locationState.lat},${locationState.lng}`;
    const label = locationState.locationName;
    const url = Platform.select({
      ios: `${scheme}${encodeURIComponent(label)}@${latLng}`,
      android: `${scheme}${latLng}(${encodeURIComponent(label)})`,
    });

    Linking.openURL(url);
  }, [locationState.lat, locationState.lng, locationState.locationName]);

  
  const camera = useMemo(
    () => ({
      center: {
        latitude: myLocation?.latitude,
        longitude: myLocation?.longitude,
      },
      altitude: 10000,
      zoom: 15,
      pitch: 1,
      heading: 1,
    }),
    [myLocation]
  );

  
  const handleImageLoadStart = useCallback(() => setShowImageload(true), []);
  const handleImageLoaded = useCallback(() => setShowImageload(false), []);

  
  const handleChangePermission = () => {
    Linking.openSettings();
  };

  // Function to navigate back in the navigation stack
  const navigateBack = () => {
    navigation.goBack();
  };

  // Render loading view if user location is not yet available
  //
  // Every hook above this line runs unconditionally, which is the rule: hooks
  // must be called in the same order on every render. See FIX 10 at the bottom
  // of this file for the hook that was placed below this return.
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
              <Ionicons name="arrow-back" size={ICON_SIZE} />
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
  //
  // OPT 5 - the outer fragment wrapped a single <View>, so it was a wrapper
  // around nothing. Removed; the View is the root now.
  return (
    <View style={styles.fill}>
      {partnerLocations && myLocation ? (
        <MapView
          style={styles.map}
          provider="google"
          ref={mapRef}
          camera={camera}
                  showsUserLocation={true}    
        followsUserLocation={true}  
        showsMyLocationButton={true} 
          mapPadding={mapPadding}
        >
          
          {partnerLocations.map((location) => (
            <PartnerMarker
              key={location.id}
              location={location}
              onSelect={handleSelectPartner}
            />
          ))}
        </MapView>
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
              <Ionicons name="arrow-back" size={ICON_SIZE} />
            </TouchableRipple>
          </View>
         
        </View>

        {/* Partner details view */}
        {showPartnerDetails ? (
          <View style={styles.row} pointerEvents="box-none">
            <View style={styles.bordered}>
              <View>
               
                {showImageload ? imageLoadingOverlay : null}

               
                <CacheImage
                  onLoadStart={handleImageLoadStart}
                  onLoad={handleImageLoaded}
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
                    onPress={getDirections}
                  >
                    {i18n.t("offer-details.get-directions").toUpperCase()}
                  </Button>
                  <View style={styles.spacer} />
                  <Button
                    style={styles.button2}
                    labelStyle={styles.buttonLabel}
                    buttonColor="#0082FF"
                    mode="contained"
                    onPress={goLocation}
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
  );
};

const styles = StyleSheet.create({
  // OPT 1 - these three replace the former styled-components. Same rules,
  // resolved once at module load instead of through styled-components'
  // runtime on every render.
  map: {
    flex: 1,
    height: '90%'
  },
  myLocationRange: {
    width: 150,
    height: 150,
    backgroundColor: "#0E89FF",
    borderRadius: 150,
    alignItems: "center",
    justifyContent: "center",
  },
  myLocationDot: {
    width: 25,
    height: 25,
    backgroundColor: "#0e89ff",
    borderRadius: 25,
    borderWidth: 3,
    borderColor: "white",
  },
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
    width: 50,
    height: 50,
    borderRadius: 50,
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

// FIX 10 - this was `const showImageItem = useMemo(...)` placed INSIDE the
// component, below the `if (!userLocation) return ...` early return.
//
// Hooks must run in the same order on every render. A hook underneath a
// conditional return does not run when that branch is taken, so React throws
// "Rendered more hooks than during the previous render" the moment
// `userLocation` flips from falsy to truthy - which is exactly what happens
// once the permission resolves. That is the same class of bug your own
// specs/005 spec calls out for the headerTitle useContext.
//
// It also needed no hook: the element is completely static - no props, no
// state - so a single module-scope constant beats a memo slot per component
// instance. It sits below `styles` because it reads `styles.overlay` when the
// module is evaluated, and `styles` has to exist by then.
const imageLoadingOverlay = (
  <View style={styles.overlay}>
    <LoadingOverlay display={true} />
  </View>
);
