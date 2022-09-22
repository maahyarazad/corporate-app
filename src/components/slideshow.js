import React, { useEffect, useRef, useState } from "react";
import { Dimensions, FlatList, Image, StyleSheet, View } from "react-native";
import { adminFileBaseURL } from "../utils/constants";
import { LoadingOverlay } from "./loading/loading.component";
import { Label } from "./typography/label.component";

const { width } = Dimensions.get("window");

export const Slideshow = ({ images }) => {
  const [loading, setLoading] = useState(true);

  const imageLoaded = () => {
    setLoading(false);
  };

  const renderContainer = ({ item, index }) => (
    <Image
      key={index}
      onLoad={imageLoaded}
      style={{ width: width, height: "100%", resizeMode: "cover" }}
      source={{
        uri: `${adminFileBaseURL}${item.image}`,
      }}
    />
  );

  const onViewableItemsChanged = ({ viewableItems, changed }) => {
    if (viewableItems != undefined && viewableItems.length > 0)
      setCurrentImageIndex(parseInt(viewableItems[0].key));
  };

  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: {
        itemVisiblePercentThreshold: 100,
      },
      onViewableItemsChanged: onViewableItemsChanged,
    },
  ]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  return (
    <View style={styles.container}>
      <LoadingOverlay display={loading} />
      <View style={{ position: "relative", height: "100%" }}>
        <FlatList
          contentContainerStyle={{ width: "auto", height: "100%" }}
          horizontal
          data={images}
          renderItem={renderContainer}
          keyExtractor={(_, index) => index.toString()}
          pagingEnabled
          bounces={false}
          viewabilityConfigCallbackPairs={
            viewabilityConfigCallbackPairs.current
          }
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            left: 0,
            top: 0,
            zIndex: 200,
            justifyContent: "flex-end",
            alignItems: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#33333366",
              height: 40,
              width: 80,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Label
              style={{ color: "white" }}
              weight={"medium"}
              size={"subtitle"}
            >
              {`${currentImageIndex + 1} / ${images.length}`}
            </Label>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: "100%",
  },
});
