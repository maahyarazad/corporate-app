import {
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, { useState } from "react";
import { CacheImage } from "./cacheImage";
import Carousel from "react-native-reanimated-carousel";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import GalleryView from "react-native-image-viewing";
import { companyLogo } from "../utils/constants";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Label } from "./typography/label.component";
import VideoPlayerModal from "./videoPlayerModal/videoPlayerModal.component";

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
            Extrapolation.CLAMP
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
  const [imageIndex, setImageIndex] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const galleryClose = () => {
    setOpenGallery(false);
  };

  const onVideoModalClose = () => {
    setSelectedVideo(null);
  };

  const renderImage = ({ item, index }) => {
    const galleryOpen = () => {
      setOpenGallery(true);
    };

    const handlePress = () => {
      if (item.type === "video") {
        setSelectedVideo(item.uri + ".mp4");
      } else {
        setOpenGallery(true);
      }
    };

    return (
      <TouchableWithoutFeedback onPress={handlePress}>
        <View>
          <CacheImage
            uri={item.uri + "_s1.jpg"}
            style={{
              width: SCREEN_WIDTH,
              aspectRatio: 1.33,
            }}
            resizeMode="cover"
          />
          {item.type === "video" && (
            <View
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MaterialCommunityIcons
                size={80}
                name="play-circle-outline"
                color="white"
              />
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    );
  };
  return (
    <View>
      <VideoPlayerModal video={selectedVideo} onClose={onVideoModalClose} />
      <Carousel
        renderItem={renderImage}
        data={images}
        width={SCREEN_WIDTH}
        height={SCREEN_WIDTH / 1.33}
        loop={false}
        onProgressChange={(_, absoluteProgress) => {
          progressValue.value = absoluteProgress;
          setImageIndex(Math.round(absoluteProgress));
        }}
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
          <Label style={{ color: "white" }} weight="medium" size="subtitle">
            {`${imageIndex + 1} / ${images.length}`}
          </Label>
        </View>
      </View>
      {/* <View style={styles.floatPagination}>
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
      </View> */}
      <GalleryView
        images={images.map((item) => {
          return {
            uri: item.uri + "_s1.jpg",
          };
        })}
        onRequestClose={galleryClose}
        visible={openGallery}
        imageIndex={imageIndex}
        HeaderComponent={(e) => {
          return (
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
                <TouchableOpacity activeOpacity={0.7} onPress={galleryClose}>
                  <View style={{ padding: 10 }}>
                    <MaterialCommunityIcons
                      name="close"
                      size={30}
                      color="#ddd"
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
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
