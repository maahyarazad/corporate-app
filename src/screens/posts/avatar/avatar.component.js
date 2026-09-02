import { StyleSheet, View } from "react-native";
import React from "react";
import { CacheImage } from "../../../components/cacheImage";

export default function Avatar({ onError, image, size = 50 }) {
  return (
    <View style={styles.avatarContainer}>
      <View
        style={[
          styles.avatarCircleMask,
          {
            borderRadius: size,
            width: size,
            height: size,
            flex: 0,
            flexGrow: 0,
            borderColor: "#ddd",
            borderWidth: 1,
          },
        ]}
      >
        <CacheImage
          style={{
            width: "100%",
            height: "100%",
          }}
          uri={image}
          onError={onError}
        ></CacheImage>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    marginRight: 8,
  },
  avatarCircleMask: {
    backgroundColor: "#ddd",
    flex: 1,
    overflow: "hidden",
  },
});
