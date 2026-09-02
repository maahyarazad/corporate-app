import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Image, ImageBackground, StyleSheet, TouchableOpacity, View } from "react-native";
import { Card, Chip } from "react-native-paper";
import { CARD_SIZE } from "../infrastructure/theme/sizes";
import { CacheImage } from "./cacheImage";
import { Label } from "./typography/label.component";

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

  return (
    <>
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
          <View style={{ marginBottom: CARD_SIZE[size].type === 1 ? 16 : 0 }}>
            <View
              style={styles.box}
            >
              <ImageBackground
                source={size === "partner" ? { uri: imgUrl } : {}}
                style={styles.imageBackground}
                blurRadius={10}
              >
                <CacheImage
                  style={[
                    styles.cacheImage,
                    {
                      width:
                        imgWidth != undefined
                          ? imgWidth
                          : CARD_SIZE[size].image.width,
                      height: imgHeight ?? CARD_SIZE[size].image.height,
                      opacity: press ? 0.7 : 1,
                    },
                  ]}
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
              style={[
                styles.base,
                {
                  flexDirection: CARD_SIZE[size].type === 1 ? "column" : "row",
                },
              ]}
            >
              <View style={styles.flexBox}>
                {CARD_SIZE[size].type === 2 && (
                  <>
                    <Label size="title" weight="bold" numberOfLines={2}>
                      {offer_name}
                    </Label>
                  </>
                )}
                <Label
                  size={CARD_SIZE[size].type === 2 ? "body" : "title"}
                  numberOfLines={1}
                  weight="bold"
                  style={{
                    color: CARD_SIZE[size].type === 1 ? "#000" : "#aaa",
                  }}
                >
                  {outlet_name}
                </Label>
                {CARD_SIZE[size].type === 1 && main_name != undefined && (
                  <Label style={styles.label} size="body" weight="bold">
                    {main_name}
                  </Label>
                )}
              </View>
              {stamp && CARD_SIZE[size].type === 2 && (
                <View style={{}}>
                  <Image
                    style={[styles.image, { opacity: press ? 0.7 : 1 }]}
                    source={stamp}
                  />
                </View>
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
            {CARD_SIZE[size].type === 1 && (
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
                    colors={["#ffffff00", "#fff", "#fff"]}
                    style={styles.linearGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  ></LinearGradient>
                </View>
              </Card.Content>
            )}
          </View>
        </TouchableOpacity>
      </Card>
      {/* </TouchableHighlight> */}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
