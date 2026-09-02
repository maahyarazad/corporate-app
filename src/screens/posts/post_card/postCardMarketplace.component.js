import { StyleSheet, TouchableWithoutFeedback, View } from "react-native";
import React, { useEffect, useState } from "react";
import { Label } from "../../../components/typography/label.component";
import useTime from "../../../../hooks/useTime";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../../../infrastructure/theme";
import { navigate } from "../../../navigation/navigate";
import { CacheImage } from "../../../components/cacheImage";
import PostCardHeader from "./postCardHeader.component";

const PostCardMarketplace = ({ item }) => {
  const { timeDiffString } = useTime();

  const handlePress = () => {
    navigate("marketplace-details", {
      post: item,
    });
  };

  const [images, setImages] = useState(null);
  const [imageCount, setImageCount] = useState(0);
  const [videoCount, setVideoCount] = useState(0);

  useEffect(() => {
    if (item.images) {
      const media_types = item.type.split(",");
      const getImages = async () => {
        let _imageCount = 0;
        let _videoCount = 0;
        const imagePromises =
          item.images &&
          item.images.split(",").map(async (image, index) => {
            if (media_types[index] === "video") {
              _videoCount++;
            } else {
              _imageCount++;
            }
            return {
              uri: `${image}_s1.jpg`,
              type: media_types[index],
            };
          });

        const newImages = await new Promise.all(imagePromises);
        setImageCount(_imageCount);
        setVideoCount(_videoCount);
        setImages(newImages);
      };

      getImages();
    }
    // console.log("PostCardMarketplace", item.id);
    return () => {};
  }, []);

  const ModeChip = () => {
    const [mode, setMode] = useState(item.mode);

    switch (mode) {
      case "offer":
        return (
          <View
            style={[
              styles.chip,
              { backgroundColor: "#f0932b", paddingHorizontal: 12 },
            ]}
          >
            <Label color="white" weight="bold">
              Angebote
            </Label>
          </View>
        );
      case "search":
        return (
          <View
            style={[
              styles.chip,
              { backgroundColor: "#436885", paddingHorizontal: 12 },
            ]}
          >
            <Label color="white" weight="bold">
              Gesuche
            </Label>
          </View>
        );
      default:
        return <></>;
    }
  };

  return (
    <View style={{ backgroundColor: "white" }}>
      <TouchableWithoutFeedback onPress={handlePress}>
        <View>
          {/* Title */}
          <PostCardHeader item={item} />
          {images && item.mode === "offer" && (
            <View style={styles.container}>
              <View
                style={{
                  backgroundColor: "#ddd",
                  width: "100%",
                  aspectRatio: 1.77,
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <CacheImage
                  uri={images[0].uri}
                  style={{ width: "100%", aspectRatio: 1.77 }}
                  resizeMode="cover"
                />
                <View
                  style={{
                    position: "absolute",
                    bottom: 4,
                    left: 4,
                    flexDirection: "row",
                    gap: 4,
                  }}
                >
                  {!!imageCount && (
                    <View style={styles.mediaCounter}>
                      <MaterialCommunityIcons
                        name="image"
                        size={15}
                        color="#777"
                      />
                      <Label
                        size={12}
                        weight="bold"
                        style={{ color: "#777" }}
                      >
                        {`${imageCount}`}
                      </Label>
                    </View>
                  )}
                  {!!videoCount && (
                    <View style={styles.mediaCounter}>
                      <MaterialCommunityIcons
                        name="video"
                        size={15}
                        color="#777"
                      />
                      <Label
                        size={12}
                        weight="bold"
                        style={{ color: "#777" }}
                      >
                        {`${videoCount}`}
                      </Label>
                    </View>
                  )}
                </View>
                {images[0].type === "video" && (
                  <View
                    style={{
                      flex: 1,
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <MaterialCommunityIcons
                      name="play-circle-outline"
                      size={50}
                      color="white"
                    />
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={[styles.container, styles.row, { paddingBottom: 0 }]}>
            <ModeChip />
          </View>
          <View style={[styles.row, styles.container, { gap: 8 }]}>
            <View
              style={{
                justifyContent: "space-between",
                flex: 1,
                gap: 8,
              }}
            >
              <View
                style={{
                  gap: 6,
                  justifyContent: "space-between",
                  flex: 1,
                }}
              >
                <View style={{ gap: 8 }}>
                  <Label
                    size="title"
                    weight="bold"
                    numberOfLinei={images ? 1 : 2}
                  >
                    {item.title}
                  </Label>
                  <Label numberOfLines={2}>{item.content}</Label>
                </View>
                <Label style={{ alignContent: "flex-end" }}>
                  Kategorie: <Label weight="bold">{item.category}</Label>
                </Label>
              </View>
              {item.price_from ? (
                <Label
                  size={18}
                  weight="bold"
                  color={theme.colors.icons.active}
                  style={{ alignSelf: "flex-start" }}
                  // style={{ color: theme.colors.icons.active }}
                >
                  {item.mode === "offer"
                    ? `${Intl.NumberFormat("de-DE").format(
                        item.price_from
                      )} AED`
                    : `${Intl.NumberFormat("de-DE").format(
                        item.price_from
                      )} - ${Intl.NumberFormat("de-DE").format(
                        item.price_to
                      )} AED`}
                </Label>
              ) : (
                <></>
              )}
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default PostCardMarketplace;

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  optionsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  row: {
    flexDirection: "row",
  },
  authorContainer: {
    justifyContent: "center",
    flex: 1,
  },
  title: {
    // backgroundColor: "red",
    flexDirection: "row",
    paddingBottom: 0,
  },
  chip: {
    backgroundColor: "#ddd",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 50,
    opacity: 0.6,
  },
  mediaCounter: {
    flexDirection: "row",
    paddingHorizontal: 2,
    paddingVertical: 2,
    borderRadius: 6,
    paddingRight: 4,
    gap: 2,

    backgroundColor: "#eee",
  },
});
