import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import { Image, ImageBackground, StyleSheet, TouchableOpacity, View } from "react-native";
import { Card, Chip } from "react-native-paper";
import { CARD_SIZE } from "../infrastructure/theme/sizes";
import { CacheImage } from "./cacheImage";
import { Label } from "./typography/label.component";

// Static object/array literals hoisted out of the render. Each of these was
// being reallocated on every render and handed to a native-backed component.
const EMPTY_IMAGE_SOURCE = {};
const GRADIENT_COLORS = ["#ffffff00", "#fff", "#fff"];
const GRADIENT_START = { x: 0, y: 0 };
const GRADIENT_END = { x: 1, y: 0 };

export const MyCard = ({
  imgUrl,
  distance,
  outlet_name,
  main_name,
  tags,
  offer_types,
  userLocation,
  offer_name,
  size = "partner",
  width,
  imgWidth,
  imgHeight,
  stamp,
  onPress,
  style,
}) => {
  const [press, setPress] = useState(false);

  // Read once instead of six times through the JSX below.
  const isStacked = CARD_SIZE[size].type === 1;

  // The only genuinely dynamic style left: width and height come from props
  // that vary per call site. Memoized because CacheImage is React.memo'd
  // (cacheImage.js), so a fresh style object every render would defeat it.
  const imageSize = useMemo(
    () => ({
      width: imgWidth ?? CARD_SIZE[size].image.width,
      height: imgHeight ?? CARD_SIZE[size].image.height,
    }),
    [imgWidth, imgHeight, size]
  );

  const imageSource = useMemo(
    () => (size === "partner" ? { uri: imgUrl } : EMPTY_IMAGE_SOURCE),
    [size, imgUrl]
  );

  return (
    <View>
      {/* <TouchableHighlight> */}
      <Card style={styles.card}>
        <TouchableOpacity
          style={styles.bordered}
          activeOpacity={0.6}
          underlayColor="#00000022"
          onPress={onPress}
          onPressOut={() => {
            setPress(false);
          }}
          onPressIn={() => {
            setPress(true);
          }}
        >
          <View style={isStacked ? styles.contentSpaced : null}>
            <View style={styles.box}>
              <ImageBackground
                source={imageSource}
                style={styles.imageBackground}
                blurRadius={10}
              >
                <CacheImage
                  style={[styles.cacheImage, imageSize, press && styles.pressed]}
                  uri={imgUrl}
                  resizeMode={size === "partner" ? "contain" : "cover"}
                />
              </ImageBackground>
              {userLocation && !!distance && (
                <View style={styles.overlay}>
                  <Label size="mini" weight="bold">
                    {distance}
                  </Label>
                </View>
              )}
            </View>

            <View
              style={[styles.base, isStacked ? styles.column : styles.rowFlow]}
            >
              <View style={styles.flexBox}>
                {!isStacked && (
                  <>
                    <Label size="title" weight="bold" numberOfLines={2}>
                      {offer_name}
                    </Label>
                  </>
                )}
                <Label
                  size={isStacked ? "title" : "body"}
                  numberOfLines={1}
                  weight="bold"
                  style={isStacked ? styles.labelDark : styles.label}
                >
                  {outlet_name}
                </Label>
                {isStacked && main_name != undefined && (
                  <Label style={styles.label} size="body" weight="bold">
                    {main_name}
                  </Label>
                )}
              </View>
              {stamp && !isStacked && (
                <Image
                  style={[styles.image, press && styles.pressed]}
                  source={stamp}
                />
              )}

              {tags && (
                <View style={styles.pad}>
                  <Label
                    numberOfLines={2}
                    size="body"
                    weight="regular"
                    style={styles.label}
                  >
                    {tags.map(
                      ({ tag }, index) =>
                        `${tag}${index < tags.length - 1 ? " • " : ""}`
                    )}
                  </Label>
                </View>
              )}
            </View>
            {isStacked && (
              <Card.Content>
                <View style={styles.row}>
                  {offer_types &&
                    offer_types.map((type, index) => {
                      return (
                        <Chip
                          // textStyle={{ marginLeft: 0 }}
                          key={`${type}${index}`}
                          style={styles.chip}
                        >
                          {type.premium_en}
                        </Chip>
                      );
                    })}
                  <LinearGradient
                    colors={GRADIENT_COLORS}
                    style={styles.linearGradient}
                    start={GRADIENT_START}
                    end={GRADIENT_END}
                  />
                </View>
              </Card.Content>
            )}
          </View>
        </TouchableOpacity>
      </Card>
      {/* </TouchableHighlight> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Paper's Card renders a Surface, and a Surface draws its shadow outside its
  // own bounds. `overflow: "hidden"` here clipped that shadow away and is what
  // Paper warns about; the clip lives on `bordered` below instead, which wraps
  // all of the content and carries the same radius.
  card: {
    borderRadius: 10,
    marginTop: 10,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 10,
    backgroundColor: "white",
  },
  bordered: {
    borderRadius: 10,
    overflow: "hidden",
  },
  box: {
    position: "relative",
    overflow: "hidden",
  },
  imageBackground: {
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    zIndex: 100,
    borderRadius: 20,
    padding: 8,
    backgroundColor: "#eee",
    margin: 8,
  },
  flexBox: {
    flex: 1,
    height: 50,
    justifyContent: "center",
  },
  label: {
    color: "#aaa",
  },
  pad: {
    paddingTop: 8,
    paddingBottom: 2,
  },
  row: {
    flexDirection: "row",
    padding: 0,
    margin: 0,
    overflow: "hidden",
  },
  chip: {
    backgroundColor: "#FFD892",
    padding: 0,
    alignItems: "flex-start",
    justifyContent: "center",
    marginRight: 8,
    borderRadius: 50,
  },
  linearGradient: {
    flex: 1,
    position: "absolute",
    width: "20%",
    height: "100%",
    right: 0,
  },
  cacheImage: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    zIndex: 1,
  },
  // marginBottom 16 vs 0: the 0 case is the default, so it needs no entry.
  contentSpaced: {
    marginBottom: 16,
  },
  // Was an inline `{ flexDirection }` ternary; both branches are static.
  column: {
    flexDirection: "column",
  },
  rowFlow: {
    flexDirection: "row",
  },
  labelDark: {
    color: "#000",
  },
  // Press feedback. `press && styles.pressed` leaves the default opacity of 1
  // in place when false - RN ignores `false` in a style array.
  pressed: {
    opacity: 0.7,
  },
  base: {
    flex: 0,
    paddingHorizontal: 16,
    paddingRight: 8,
    paddingVertical: 8,
    justifyContent: "space-between",
  },
  image: {
    width: 55,
    height: 55,
  },
});
