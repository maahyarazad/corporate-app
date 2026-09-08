import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { PlatformMap } from "./platformMap.component";

/**
 * Static location preview. Consumed by eventDetail.screen.js and
 * location-view.screen.js; the `{ lat, lng, zoom }` prop shape is deliberately
 * unchanged by the expo-maps migration so neither consumer had to move.
 */
export const Map = ({ lat, lng, zoom = 14 }) => {
  const markers = useMemo(
    () => [
      {
        id: "location",
        coordinates: { latitude: lat, longitude: lng },
      },
    ],
    [lat, lng]
  );

  const initialCamera = useMemo(
    () => ({ coordinates: { latitude: lat, longitude: lng }, zoom }),
    [lat, lng, zoom]
  );

  return (
    <View style={styles.container}>
      {/* interactive={false} is what keeps a drag that starts on this preview
          scrolling the parent screen instead of being swallowed by the map.
          The wrapper implements it with pointerEvents, because AppleMaps
          exposes no way to disable gestures declaratively. */}
      <PlatformMap
        style={styles.map}
        markers={markers}
        initialCamera={initialCamera}
        interactive={false}
        showsUserLocation
        showsMyLocationButton={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  map: {
    height: 250,
    borderRadius: 0,
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    overflow: "hidden",
  },
});
