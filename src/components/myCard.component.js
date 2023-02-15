import React, { useContext } from "react";
import { StyleSheet, View } from "react-native";
import { Card, Chip } from "react-native-paper";
import { CARD_SIZE } from "../infrastructure/theme/sizes";
import { LocationContext } from "../services/location/location.context";
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
  size = "partner",
}) => {
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
      <Card style={{ borderRadius: 10 }}>
        <View
          style={{
            position: "relative",
            // backgroundColor: "#ccc",
          }}
        >
          <CacheImage
            style={{
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              backgroundColor: "#aaa",
              width: CARD_SIZE[size].image.width,
              height: CARD_SIZE[size].image.height,
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

        <View style={{ flex: 0, paddingHorizontal: 16, paddingVertical: 8 }}>
          <View style={{ height: 40, justifyContent: "center" }}>
            <Label size={"title"} weight="bold">
              {outlet_name}
            </Label>
            {main_name != undefined && (
              <Label style={{ color: "#aaa" }} size={"body"} weight="bold">
                {main_name}
              </Label>
            )}
          </View>
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
        <Card.Content style={{ flexDirection: "row", padding: 0, margin: 0 }}>
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
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
