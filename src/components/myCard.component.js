import React, { useContext, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  TouchableHighlight,
  View,
} from "react-native";
import { Card, Chip } from "react-native-paper";
import { CARD_SIZE } from "../infrastructure/theme/sizes";
import { LocationContext } from "../services/location/location.context";
import { offerStamps } from "../utils/constants";
import { CacheImage } from "./cacheImage";
import { width } from "./styles";
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
  stamp,
  onPress,
}) => {
  const [press, setPress] = useState(false);

  return (
    <View
      style={[
        styles.container,
        {
          width: CARD_SIZE[size].card.width,
          //   height: CARD_SIZE[size].card.height,
          //   backgroundColor: "red",
          shadowOpacity: 0.4,
          shadowRadius: 10,
          elevation: 10,
        },
      ]}
    >
      {/* <TouchableHighlight> */}
      <Card style={{ borderRadius: 10, overflow: "hidden" }}>
        <TouchableHighlight
          underlayColor={"#00000022"}
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
              }}
            >
              <CacheImage
                style={{
                  //   backgroundColor: "green",
                  borderTopLeftRadius: 10,
                  borderTopRightRadius: 10,
                  backgroundColor: "#aaa",
                  width: CARD_SIZE[size].image.width,
                  height: CARD_SIZE[size].image.height,
                  opacity: press ? 0.7 : 1,
                  zIndex: 1,
                }}
                uri={imgUrl}
              />
              {userLocation && (
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
                  <Label size={"mini"} weight={"bold"}>
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
                    <Label size={"title"} weight="bold" numberOfLines={2}>
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
                  <Label style={{ color: "#aaa" }} size={"body"} weight="bold">
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
                    size={"body"}
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
              <Card.Content
                style={{ flexDirection: "row", padding: 0, margin: 0 }}
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
                          height: 20,
                          alignItems: "flex-start",
                          justifyContent: "center",
                          marginRight: 8,
                        }}
                      >
                        {type.premium_en}
                      </Chip>
                    );
                  })}
              </Card.Content>
            )}
          </View>
        </TouchableHighlight>
      </Card>
      {/* </TouchableHighlight> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
