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
import { Linking, Platform, View, StyleSheet } from "react-native";
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

// OPT 1 - the map and the two user-location marker rings were three
// styled-components (`styled(MapView)`, `styled(View)` x2). Each one is an
// extra wrapper component that reads styled-components' ThemeContext and
// resolves a CSS string through its runtime on every render, and all three sit
// on the map's render path. They are plain static styles with no props and no
// theme, so StyleSheet entries below do the same job with no wrapper, no
// context read, and no runtime CSS - which is also what the rest of this file
// (and the no-inline-styling pass in commit 2ce9948) already uses.
//
// They were exported, but nothing outside this file ever imported them.

// Earth's radius in meters, used by the haversine distance in handlePartnerCentre.
const EARTH_RADIUS_M = 6378137;

// FIX 1 - was `useMemo((degrees) => ..., [degrees])` inside the component.
// Three separate problems lived in that one line:
//   a) `[degrees]` is evaluated as ordinary code in the component body, and no
//      `degrees` variable exists there. That is a ReferenceError on every
//      single render - it took the whole screen down.
//   b) useMemo never passes arguments to its factory, so `degrees` would have
//      been undefined and this would have evaluated to NaN, not a function.
//   c) Even written correctly it needed no hook at all. The result depends
//      only on the argument - never on props or state - so module scope is the
//      right "memo": allocated once for the module instead of once per render.
const degToRad = (degrees) => degrees * (Math.PI / 180);

// FIX 2 - was `const Marker = React.memo(...)` declared *inside* MapScreen.
// That version was broken five ways at once:
//   a) It shadowed the `Marker` imported from react-native-maps above, so
//      every marker on the screen - including the user's own - resolved to it.
//   b) Its body had no `return`, so it rendered undefined.
//   c) It took positional arguments; a component receives one props object.
//   d) It rendered `<Marker>` - itself - which would recurse forever.
//   e) It was never actually used: the JSX still inlined the real Marker.
//
// The reason it has to live at module scope: a component defined during render
// is a brand-new type on every render, so React unmounts and remounts the
// entire subtree and React.memo can never hit. memo only works on a stable
// component type. This is what ESLint's react/no-unstable-nested-components
// rule is about.
const PartnerMarker = React.memo(({ location, onSelect }) => (
  <Marker
    tracksViewChanges={false}
    coordinate={{ longitude: location.lng, latitude: location.lat }}
    onPress={() => onSelect(location)}
  />
));

PartnerMarker.displayName = "PartnerMarker";

// OPT 2 - the user's own marker was inline in the JSX, so its Marker plus two
// nested Views were rebuilt on every render of this screen - including every
// `showImageload` toggle while the partner photo loads, and every marker tap.
// `myLocation` is written exactly once (see the mount effect), so as a memoized
// component with a single prop this subtree renders once and is skipped from
// then on.
const UserLocationMarker = React.memo(({ location }) => (
  <Marker
    tracksViewChanges={false}
    coordinate={{ longitude: location.longitude, latitude: location.latitude }}
  >
    <View style={styles.myLocationRange}>
      <View style={styles.myLocationDot} />
    </View>
  </Marker>
));

UserLocationMarker.displayName = "UserLocationMarker";

// Main component for the map screen
export const MapScreen = () => {
  // Static-config screens receive only `route` - the navigator renders them
  // through a render callback, so `navigation` never arrives as a prop.
  const navigation = useNavigation();

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

    // FIX 3 - this was hoisted out of the effect into a useCallback, which
    // broke it without ever producing a visible crash. It reads
    // `controller.signal`, and `controller` is created here, inside the effect
    // - so out there it was an undefined reference. The ReferenceError was
    // thrown inside the `try`, swallowed by the `catch`, and logged as
    // "Failed to get coordinates". `partnerLocations` stayed undefined, so the
    // map rendered its loading overlay forever with only a console line to
    // show for it. Silent failures like this are the expensive kind.
    //
    // Hoisting could not have helped anyway: useRequest() returns a fresh
    // httpRequest on every render (hooks/useRequest.js:233), so a useCallback
    // depending on `request` would change identity every render - and adding
    // it to this effect's dependency array would refetch in an infinite loop.
    // A function used by exactly one mount-time effect belongs inside it.
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
    // This empty array is the one deliberate exception in the file, and it
    // predates your changes. exhaustive-deps wants `request` and
    // `getUserLocation` here, but both are recreated on every render by
    // useRequest()/useContext, so listing them would re-run this effect - and
    // refetch every partner coordinate - on every single render. A mount-only
    // fetch is the intent, so the rule is silenced explicitly rather than
    // left as a silent warning.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to center the map on the user's location
  //
  // FIX 4 - this was useMemo. The distinction that matters:
  //
  //   useCallback(fn, deps)   memoizes THE FUNCTION      -> gives you fn
  //   useMemo(factory, deps)  CALLS factory, memoizes ITS RETURN VALUE
  //   useCallback(fn, deps) === useMemo(() => fn, deps)   <- note the () =>
  //
  // So useMemo ran the camera animation during render (a side effect in
  // render, which is illegal), and stored the return value - undefined. That
  // made `onPress={handleCenter}` below `onPress={undefined}`, so the
  // my-location button silently did nothing.
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
  // FIX 5 - the same useMemo/useCallback mix-up, so this was undefined and
  // tapping any marker threw "handlePartnerCentre is not a function". It also
  // carried a second bug underneath: the dependency array was `[]` while the
  // body reads `myLocation`. Even once it is a real function, `[]` freezes it
  // against the location captured at mount, so the distance would never
  // update. Anything the body reads from props or state has to be a dep.
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

  // FIX 6 - the marker tap handler, lifted out of the JSX.
  //
  // This is the memoization that was actually worth doing and was missed. The
  // old code built a fresh arrow function and a fresh `coordinate` object for
  // each of up to 100 markers on every render of this screen. Hoisting it here
  // gives every PartnerMarker the same `onSelect` reference, which is what
  // lets React.memo skip them.
  //
  // Note the functional update form: the old inline version spread
  // `locationState` straight out of the closure, which is the same stale-value
  // trap as goLocation below. `prev => ...` always sees current state.
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
  //
  // FIX 7 - the dependency array was `[]` while the body reads
  // `locationState.locationId`, so the closure kept the value from the very
  // first render - `locationId: 0` - and every "view offer" tap navigated to
  // location 0. The original version took the id as an argument, which had no
  // stale-closure problem at all; if you close over state instead, the state
  // you read must be in the deps.
  const goLocation = useCallback(() => {
    navigation.navigate("Location View", { locId: locationState.locationId });
  }, [navigation, locationState.locationId]);

  // Function to open the native map for directions
  //
  // FIX 8 - three bugs here:
  //   a) The call site became `onPress={getDirections}`, so the first argument
  //      was the press event, not a location: `.lat`, `.lng` and `.place` were
  //      all undefined. It now reads state directly and takes no arguments, so
  //      the bare `onPress={getDirections}` is correct.
  //   b) The comma between latitude and longitude was dropped, turning
  //      "25.204,55.271" into "25.20455.271". That bug would have survived
  //      fixing the other two.
  //   c) `locationState.place` does not exist - the field is `locationName`.
  //      The parameter was also named `locationState`, shadowing the state of
  //      the same name, which is exactly what hid the mismatch.
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

  // OPT 3 - the `camera` prop was an object literal built inline in the JSX, so
  // a brand-new object was handed to MapView on every render. MapView spreads
  // its props straight onto the native component
  // (node_modules/react-native-maps/lib/MapView.js:317), so that object is
  // diffed against the native view every time any unrelated state changes here
  // - `distance`, `showImageload`, `showPartnerDetails`. `myLocation` is
  // written once, so memoizing makes this reference stable for the life of the
  // screen and the camera prop stops participating in re-renders entirely.
  //
  // This also keeps the declarative `camera` prop from competing with the
  // imperative `animateCamera` calls in handleCenter/handlePartnerCentre.
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

  // OPT 4 - these two were inline arrows on <CacheImage />. CacheImage is
  // wrapped in React.memo (src/components/cacheImage.js:265) specifically so a
  // parent re-render can skip it - its own comment says "without this, the
  // useCallbacks above buy nothing". A fresh arrow on every render defeats that
  // memo every single time, so the image component re-rendered on every state
  // change on this screen. Stable references let the memo actually hold.
  //
  // Note the contrast with FIX 9 below: memoizing a callback is worth it here
  // precisely because the consumer IS memoized.
  const handleImageLoadStart = useCallback(() => setShowImageload(true), []);
  const handleImageLoaded = useCallback(() => setShowImageload(false), []);

  // FIX 9 (the other direction) - these two are deliberately NOT wrapped in
  // useCallback. They are handed to TouchableRipple and Button, neither of
  // which is React.memo'd, so a stable reference saves exactly zero re-renders
  // - it only costs an allocation plus a dependency comparison every render.
  // useCallback pays off when the consumer is memoized, or when the function
  // is itself a dependency of another hook. Otherwise it is pure overhead.
  // Memoizing everything is not the goal; memoizing what a memo boundary can
  // actually use is.
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
        >
          {/* User location marker */}
          <UserLocationMarker location={myLocation} />

          {/* Partner location markers.
              `key` belongs on the element here at the call site, not inside
              PartnerMarker - and it is the stable location id rather than the
              array index, so the list keeps its identity if it ever reorders. */}
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
              <Ionicons name="arrow-back" size={35} />
            </TouchableRipple>
          </View>
          <View style={styles.box}>
            <TouchableRipple
              onPress={handleCenter}
              style={styles.touchableRipple2}
              rippleColor="#444"
            >
              <MaterialIcons name="my-location" size={35} color="#0e89ff" />
            </TouchableRipple>
          </View>
        </View>

        {/* Partner details view */}
        {showPartnerDetails ? (
          <View style={styles.row} pointerEvents="box-none">
            <View style={styles.bordered}>
              <View>
                {/* Image loading overlay.
                    FIX 11 - this read `{showImageItem}`. Inside a JSX
                    expression you are already in JavaScript, so those braces
                    built an object literal - { showImageItem: element } - and
                    React throws "Objects are not valid as a React child".
                    The bare identifier is what you want. */}
                {showImageload ? imageLoadingOverlay : null}

                {/* Cached image of the location.
                    OPT 4 - onLoadStart/onLoad are the hoisted useCallbacks
                    rather than inline arrows, so CacheImage's React.memo can
                    actually skip this subtree. */}
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
  },
  myLocationRange: {
    width: 150,
    height: 150,
    backgroundColor: "#0e89ff33",
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
