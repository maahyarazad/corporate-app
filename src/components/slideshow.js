import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { adminFileBaseURL, companyLogo } from "../utils/constants";
import { CacheImage } from "./cacheImage";
import { LoadingOverlay } from "./loading/loading.component";
import { Label } from "./typography/label.component";
import GalleryView from "react-native-image-viewing";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export const Slideshow = ({ images }) => {
  const [loading, setLoading] = useState(true);

  const imageLoaded = () => {
    setLoading(false);
  };

  const [galleryImages, setGalleryImages] = useState(
    images.map((item) => {
      return {
        uri: `${adminFileBaseURL}${item.image}`,
      };
    })
  );

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const handleCloseGallery = () => {
    setGalleryOpen(false);
  };

  const renderContainer = ({ item, index }) => {
    const handleOpenGallery = () => {
      setGalleryOpen(true);
      setImageIndex(index);
      console.log("Opening image:" + item.image);
    };
    return (
      <TouchableWithoutFeedback key={index} onPress={handleOpenGallery}>
        <View>
          <ImageBackground
            // source={{ uri: adminFileBaseURL + item.image }}
            style={{ backgroundColor: "white" }}
            blurRadius={10}
          >
            <CacheImage
              imgKey={index}
              onLoad={imageLoaded}
              style={{
                width: width,
                aspectRatio: 1.77,
                resizeMode: "contain",
              }}
              uri={`${adminFileBaseURL}${item.image}`}
            />
          </ImageBackground>
        </View>
      </TouchableWithoutFeedback>
    );
  };
  const onViewableItemsChanged = ({ viewableItems, changed }) => {
    if (viewableItems != undefined && viewableItems.length > 0)
      setCurrentImageIndex(
        parseInt(viewableItems[viewableItems.length - 1].key)
      );
  };

  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: {
        itemVisiblePercentThreshold: 50,
      },
      onViewableItemsChanged: onViewableItemsChanged,
    },
  ]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  return (
    <View style={styles.container}>
      <GalleryView
        images={galleryImages}
        imageIndex={imageIndex}
        visible={galleryOpen}
        onRequestClose={handleCloseGallery}
        HeaderComponent={() => (
          <View
            style={{
              width: "100%",
              marginTop: 40,
              flexDirection: "row",
              justifyContent: "space-between",
              paddingHorizontal: 10,
            }}
          >
            <Image
              width={100}
              height={100}
              source={companyLogo}
              resizeMode="contain"
              style={{ width: 100, height: 100 }}
            ></Image>

            <View style={{ top: 20 }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleCloseGallery}
              >
                <View style={{ padding: 10 }}>
                  <MaterialCommunityIcons
                    name={"close"}
                    size={30}
                    color={"#ddd"}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
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
