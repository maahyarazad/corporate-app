import React, {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef
} from "react";
import { Platform, StyleSheet, View } from "react-native";
import { AppleMaps, GoogleMaps } from "expo-maps";

/**
 * The app's only map component. See specs/010-expo-maps/contracts/platform-map.md.
 *
 * expo-maps does not ship one cross-platform map the way the library it
 * replaced did: `AppleMaps.View` and `GoogleMaps.View` are separate components
 * with non-identical prop types. This file is the single place that knows that,
 * and the single place permitted to import `expo-maps` - so a breaking upgrade
 * of an alpha library ("will frequently experience breaking changes", per the
 * Expo docs) is a one-file diff.
 */

const isIOS = Platform.OS === "ios";

// Markers are handed to native as one serialised array, not as 100 child
// views. A single malformed record risks the whole batch, so coordinates are
// checked here rather than trusted from the API.
const hasValidCoordinates = (marker) =>
  Number.isFinite(marker?.coordinates?.latitude) &&
  Number.isFinite(marker?.coordinates?.longitude);

// Android-only. Every one of these defaults to `true` upstream
// (expo-maps/android/.../Records.kt:161-177), so each is a deliberate opt-out:
//
//   mapToolbarEnabled        Google's own toolbar slides up on marker tap with
//                            "directions" and "open in Maps" buttons. This app
//                            has its own partner card carrying Get Directions,
//                            and the toolbar renders on top of it.
//   zoomControlsEnabled      +/- buttons pinned bottom-right, directly under
//                            the partner card. Pinch already works.
//   indoorLevelPickerEnabled A floor picker for indoor maps, which are off
//                            anyway (isIndoorEnabled defaults false).
const ANDROID_CHROME_OFF = {
  mapToolbarEnabled: false,
  zoomControlsEnabled: false,
  indoorLevelPickerEnabled: false,
};

// `contentPadding` (Android only) is the supported way to move the native map
// controls. Google's my-location button sits top-right on Android, so `top`
// pushes it down and `end` pushes it inward (the record is RTL-aware:
// start/end, not left/right).
//
// This is the same family of prop as the `mapPadding` that made the button
// untappable on iOS, so the distinction matters. That bug was
// `top: screenHeight - 80` - a value that collapsed the visible region to an
// 80pt sliver and inverted the control rect once safe-area insets were added.
// Two things keep this safe: it is Android-only (expo-maps exposes no
// equivalent on Apple, so the iOS hit-testing failure cannot recur), and it is
// meant for small inset-sized values. Anything derived from screen height is
// still the bug, not the fix.

// Android can genuinely disable gestures; iOS cannot (see `interactive` below).
const ANDROID_GESTURES_OFF = {
  scrollGesturesEnabled: false,
  zoomGesturesEnabled: false,
  rotationGesturesEnabled: false,
  tiltGesturesEnabled: false,
  scrollGesturesEnabledDuringRotateOrZoom: false,
};

// Buildings, indoor and traffic already default to false upstream
// (Records.kt:220-226). Pinned explicitly rather than assumed: this is an alpha
// library and a default flip is a plausible upgrade surprise. Not a saving
// today - a guard against becoming one.
const ANDROID_PROPERTIES = {
  isBuildingEnabled: false,
  isIndoorEnabled: false,
  isTrafficEnabled: false,
};

const PlatformMapComponent = forwardRef(
  (
    {
      markers,
      initialCamera,
      onMarkerPress,
      showsUserLocation = true,
      showsMyLocationButton = true,
      interactive = true,
      contentPadding,
      style,
    },
    ref
  ) => {
    const viewRef = useRef(null);

    // The camera is uncontrolled after mount: `initialCamera` seeds the opening
    // frame and everything after that goes through here or the user's own
    // gestures. The previous screen passed a controlled `camera` prop *and*
    // called animateCamera imperatively, and the two competed.
    useImperativeHandle(
      ref,
      () => ({
        setCamera: (position, durationMs) => {
          if (!viewRef.current || !position) return;

          // `duration` exists only on the Google config. Apple's
          // setCameraPosition takes a bare CameraPosition and moves instantly -
          // documented upstream as "Animation duration is not supported on
          // iOS". The asymmetry is passed through rather than shimmed.
          viewRef.current.setCameraPosition(
            isIOS || durationMs == null
              ? position
              : { ...position, duration: durationMs }
          );
        },
      }),
      []
    );

    const validMarkers = useMemo(
      () => (markers ?? []).filter(hasValidCoordinates),
      [markers]
    );

    // Both platforms type marker `id` as a string and echo the whole record
    // back through onMarkerClick. Only the id is forwarded on: callers resolve
    // it against their own data rather than depending on the native record's
    // shape, which differs per platform.
    const handleMarkerClick = useCallback(
      (marker) => {
        if (onMarkerPress && marker?.id != null) onMarkerPress(marker.id);
      },
      [onMarkerPress]
    );

    // Settings are built per platform rather than sharing one object. The
    // Android keys below do not exist on AppleMapsUISettings, and handing an
    // alpha native component props it does not declare is not worth the risk.
    const properties = useMemo(
      () => ({
        isMyLocationEnabled: showsUserLocation,
        ...(isIOS ? null : ANDROID_PROPERTIES),
      }),
      [showsUserLocation]
    );

    const uiSettings = useMemo(() => {
      const shared = {
        myLocationButtonEnabled: showsMyLocationButton,
        compassEnabled: false,
        scaleBarEnabled: false,
      };

      if (isIOS) return shared;

      return {
        ...shared,
        ...ANDROID_CHROME_OFF,
        ...(interactive ? null : ANDROID_GESTURES_OFF),
      };
    }, [showsMyLocationButton, interactive]);

    // `interactive={false}` is implemented with pointerEvents, not with
    // uiSettings. AppleMapsUISettings exposes only compass, my-location
    // button, scale bar and pitch toggle - there is no scrollEnabled or
    // zoomEnabled on the Apple side at all, so gestures cannot be turned off
    // there declaratively. pointerEvents also guarantees the requirement that
    // actually matters for the static preview: a drag starting on the map must
    // reach the parent scroll view, not be swallowed by the map. Android gets
    // the gesture flags as well, which is belt and braces.
    const MapComponent = isIOS ? AppleMaps.View : GoogleMaps.View;

    return (
      <View style={style} pointerEvents={interactive ? "auto" : "none"}>
        <MapComponent
          ref={viewRef}
          style={styles.fill}
          cameraPosition={initialCamera}
          markers={validMarkers}
          properties={properties}
          uiSettings={uiSettings}
          onMarkerClick={handleMarkerClick}
          {...(isIOS ? null : { contentPadding })}
        />
      </View>
    );
  }
);

PlatformMapComponent.displayName = "PlatformMap";

// Every prop this component takes is either a primitive or memoized by its
// caller, so the memo actually holds: a re-render of the map screen for an
// unrelated reason (showPartnerDetails, showImageload, distance) stops here
// instead of reconciling the map subtree.
export const PlatformMap = memo(PlatformMapComponent);

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
