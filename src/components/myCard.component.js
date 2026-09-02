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
      <Card
        style={{
          borderRadius: 10,
          marginTop: 10,
          shadowOpacity: 0.4,
          shadowRadius: 6,
          elevation: 10,
          backgroundColor: "white",
        }}
      >
        <TouchableOpacity
          style={{ borderRadius: 10 }}
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
              style={{
                position: "relative",
                // backgroundColor: "#ccc",
                overflow: "hidden",
              }}
            >
              <ImageBackground
                source={size === "partner" ? { uri: imgUrl } : {}}
                style={{
                  backgroundColor: "#ccc",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                blurRadius={10}
              >
                <CacheImage
                  style={{
                    //   backgroundColor: "green",
                    borderTopLeftRadius: 10,
                    borderTopRightRadius: 10,
                    width:
                      imgWidth != undefined
                        ? imgWidth
                        : CARD_SIZE[size].image.width,
                    height: imgHeight ?? CARD_SIZE[size].image.height,
                    opacity: press ? 0.7 : 1,
                    zIndex: 1,
                  }}
                  uri={imgUrl}
                  resizeMode={size === "partner" ? "contain" : "cover"}
                />
              </ImageBackground>
              {userLocation && !!distance && (
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    zIndex: 100,
                    borderRadius: 20,
                    padding: 8,
                    backgroundColor: "#eee",
                    margin: 8,
                  }}
                >
                  <Label size="mini" weight="bold">
                    {distance}
                  </Label>
                </View>
              )}
            </View>

            <View
              style={{
                flex: 0,
                paddingHorizontal: 16,
                paddingRight: 8,
                paddingVertical: 8,
                flexDirection: CARD_SIZE[size].type === 1 ? "column" : "row",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: 50,
                  justifyContent: "center",
                }}
              >
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
                  <Label style={{ color: "#aaa" }} size="body" weight="bold">
                    {main_name}
                  </Label>
                )}
              </View>
              {stamp && CARD_SIZE[size].type === 2 && (
                <View style={{}}>
                  <Image
                    style={{
                      width: 55,
                      height: 55,
                      opacity: press ? 0.7 : 1,
                    }}
                    source={stamp}
                  />
                </View>
              )}

              {tags && (
                <View style={{ paddingTop: 8, paddingBottom: 2 }}>
                  <Label
                    numberOfLines={2}
                    size="body"
                    weight="regular"
                    style={{ color: "#aaa" }}
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
                <View
                  style={{
                    flexDirection: "row",
                    padding: 0,
                    margin: 0,
                    overflow: "hidden",
                  }}
                >
                  {offer_types &&
                    offer_types.map((type, index) => {
                      return (
                        <Chip
                          // textStyle={{ marginLeft: 0 }}
                          key={`${type}${index}`}
                          style={{
                            backgroundColor: "#FFD892",
                            padding: 0,
                            alignItems: "flex-start",
                            justifyContent: "center",
                            marginRight: 8,
                            borderRadius: 50,
                          }}
                        >
                          {type.premium_en}
                        </Chip>
                      );
                    })}
                  <LinearGradient
                    colors={["#ffffff00", "#fff", "#fff"]}
                    style={{
                      flex: 1,
                      position: "absolute",
                      width: "20%",
                      height: "100%",
                      right: 0,
                    }}
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
});
