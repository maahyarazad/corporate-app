import {
  Dimensions,
  StyleSheet,
  Text,
  Touchable,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, { useState } from "react";
import { CacheImage } from "./cacheImage";
import Carousel from "react-native-reanimated-carousel";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import GalleryView from "react-native-image-viewing";
import { theme } from "../infrastructure/theme";

const SCREEN_WIDTH = Dimensions.get("window").width;

const PaginationItem = ({
  animValue,
  index,
  length,
  backgroundColor,
  isRotate,
}) => {
  const width = 8;
  const inputRange = [index - 1, index, index + 1];
  const outputRange = [-width, 0, width];

  const animStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            animValue?.value,
            inputRange,
            outputRange,
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  }, [animValue, index, length]);

  return (
    <View
      style={{
        backgroundColor: "white",
        width,
        height: width,
        borderRadius: 50,
        overflow: "hidden",
        transform: [
          {
            rotateZ: isRotate ? "90deg" : "0deg",
          },
        ],
      }}
    >
      <Animated.View
        style={[
          {
            borderRadius: 50,
            backgroundColor,
            flex: 1,
          },
          animStyle,
        ]}
      />
    </View>
  );
};

const SlideshowV2 = ({ images }) => {
  const progressValue = useSharedValue(0);
  const [openGallery, setOpenGallery] = useState(false);

  const galleryOpen = () => {
    setOpenGallery(true);
  };
  const galleryClose = () => {
    setOpenGallery(false);
  };

  const renderImage = ({ item }) => {
    return (
      <TouchableWithoutFeedback onPress={galleryOpen}>
        <View>
          <CacheImage
            uri={item.uri}
            style={{
              width: SCREEN_WIDTH,
              aspectRatio: 1.33,
            }}
            resizeMode={"cover"}
          />
        </View>
      </TouchableWithoutFeedback>
    );
  };
  return (
    <View>
      <Carousel
        renderItem={renderImage}
        data={images}
        width={SCREEN_WIDTH}
        height={SCREEN_WIDTH / 1.33}
        loop={false}
        onProgressChange={(_, absoluteProgress) => {
          progressValue.value = absoluteProgress;
        }}
      />
      <View style={styles.floatPagination}>
        {images.map((_, index) => {
          return (
            <PaginationItem
              backgroundColor={theme.colors.icons.active}
              animValue={progressValue}
              index={index}
              key={index}
              isRotate={false}
              length={images.length}
            />
          );
        })}
      </View>
      <GalleryView
        images={images}
        onRequestClose={galleryClose}
        visible={openGallery}
      />
    </View>
  );
};

export default SlideshowV2;

const styles = StyleSheet.create({
  floatPagination: {
    position: "absolute",
    alignSelf: "center",
    bottom: 8,
    flexDirection: "row",
    backgroundColor: "#dddddd55",
    paddingVertical: 6,
    borderRadius: 30,
    gap: 4,
    justifyContent: "space-evenly",
    paddingHorizontal: 8,
    // right: 0,
    // left: 0,
  },
});
