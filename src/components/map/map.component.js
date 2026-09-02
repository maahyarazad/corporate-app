import React from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

export const Map = ({ lat, lng, zoom = 14 }) => {
  return (
    <>
      <View style={styles.container}>
        <View style={styles.map}>
          <MapView
            pointerEvents="none"
            showsUserLocation
            provider="google"
            style={styles.map}
            camera={{
              center: {
                latitude: lat,
                longitude: lng,
              },
              pitch: 1,
              heading: 1,
              altitude: 2000,
              zoom: zoom,
            }}
            // loadingEnabled={true}
            scrollEnabled={false}
            loadingBackgroundColor="#00000088"
            loadingIndicatorColor="palegreen"
          >
            <Marker
              coordinate={{
                longitude: lng,
                latitude: lat,
              }}
            ></Marker>
          </MapView>
        </View>
      </View>
    </>
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
