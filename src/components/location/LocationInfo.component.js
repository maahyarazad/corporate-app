import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Linking, StyleSheet, View } from "react-native";
import { adminFileBaseURL } from "../../utils/constants";
import { CacheImage } from "../cacheImage";
import { Label } from "../typography/label.component";

export const LocationInfo = ({
  location,
  distance,
  headerSize,
  subheaderSize,
  infoSize,
  imageW = 100,
  imageH = 100,
  color = "#888",
  headerColor = "#000",
  showContact = true,
}) => {
  return (
    <View style={styles.container}>
      <View style={{ flexDirection: "row" }}>
        {location && (
          <View
            style={{
              backgroundColor: "white",
              width: imageW,
              height: imageH,
              borderWidth: 1,
              borderRadius: 4,
              borderColor: "#ccc",
              padding: 5,
            }}
          >
            <CacheImage
              style={{
                resizeMode: "contain",
                flex: 1,
                width: imageW - 12,
                height: imageH - 10,
                backgroundColor: "white",
              }}
              uri={`${adminFileBaseURL}${location.logo}`}
            />
          </View>
        )}
        <View
          style={{
            marginLeft: 16,
            flex: 1,
            justifyContent: "center",
          }}
        >
          <Label
            size={headerSize}
            weight={"bold"}
            numberOfLines={1}
            style={{ color: headerColor }}
          >
            {location?.name}
          </Label>
          {location != undefined && location.main != undefined && (
            <Label
              size={subheaderSize}
              weight={"bold"}
              numberOfLines={1}
              style={{ color: color }}
            >
              {location.main}
            </Label>
          )}
          {location && location.region && distance && (
            <Label style={{ color: color }} size={infoSize} weight={"medium"}>
              {`${location.region} ${
                distance != undefined ? `• ${distance} km` : ""
              }`}
            </Label>
          )}

          <Label style={{ color: color }} size={infoSize} weight={"bold"}>
            {location?.category}
          </Label>
          {showContact && (
            <View
              style={{
                width: "100%",
                justifyContent: "flex-start",
                alignItems: "flex-start",
                flexDirection: "row",
              }}
            >
              {location != undefined && location.phone != undefined && (
                <>
                  <Ionicons
                    name="call"
                    size={17}
                    color={"#888"}
                    style={{ paddingRight: 4 }}
                  />
                  <View>
                    {location != undefined &&
                      location.phone != undefined &&
                      location.phone.split("|").map((phone, index) => {
                        return (
                          <View key={`${phone}${index}`}>
                            <Label
                              onPress={async () => {
                                Linking.openURL(
                                  `tel:${encodeURIComponent(phone.trim())}`
                                ).catch((err) => {
                                  alert("Unable to call this number");
                                });
                              }}
                              style={{ color: "#006EFF" }}
                              size={"caption"}
                              weight={"bold"}
                            >
                              {phone.trim()}
                              {index < location.phone.split("|").length - 1 && (
                                <Label>{` | `}</Label>
                              )}
                            </Label>
                          </View>
                        );
                      })}
                  </View>
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
});
