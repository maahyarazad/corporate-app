import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Linking, StyleSheet, Text, View } from "react-native";
import { showToast } from "../../Toast";
import { adminFileBaseURL } from "../../utils/constants";
import { Label } from "../typography/label.component";

export const LocationInfo = ({
  location,
  distance,
  imageW = 100,
  imageH = 100,
  color = "#888",
  headerColor = "#000",
  showContact = true,
}) => {
  const phoneList =
    location?.phone && typeof location.phone === "string"
      ? location.phone.split("|").map((phone) => phone.trim()).filter(Boolean)
      : [];
    
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {!!location && (
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
            <Image
              source={{ uri: `${adminFileBaseURL}${location.logo}` }}
              style={{
                flex: 1,
                width: imageW - 12,
                height: imageH - 10,
                backgroundColor: "white",
              }}
              resizeMode="contain"
            />
          </View>
        )}

        <View style={styles.infoContainer}>
          <Text
            numberOfLines={1}
            style={{ color: headerColor, fontWeight: "bold", fontSize: 18 }}
          >
            {location?.name || ""}
          </Text>

          {location?.main !== undefined && location?.main !== null && (
            <Text
              numberOfLines={1}
              style={{ color, fontWeight: "bold", fontSize: 16 }}
            >
              {location.main}
            </Text>
          )}

          {location?.region && distance !== undefined && distance !== null && (
            <Text style={{ color, fontWeight: "500", fontSize: 14 }}>
              {`${location.region} • ${distance} km`}
            </Text>
          )}

          <Text style={{ color, fontWeight: "bold", fontSize: 14 }}>
            {location?.category || ""}
          </Text>

          {phoneList && phoneList.length > 0 && (
              <View style={{...styles.contactRow}}>
                
              <Ionicons
                name="call"
                size={17}
                color="#888"
                style={{ paddingRight: 4 }}
              />
              <View>
                {phoneList.map((phone, index) => (
                  <Text
                    key={`${phone}${index}`}
                    onPress={async () => {
                      try {
                        await Linking.openURL(
                          `tel:${encodeURIComponent(phone)}`
                        );
                      } catch (err) {
                        showToast("error", "Call Failed", "Unable to call this number");
                      }
                    }}
                    style={{ color: "#006EFF", fontWeight: "bold", fontSize: 12 }}
                  >
                    {phone}
                    {index < phoneList.length - 1 ? " | " : ""}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    
  },
  row: {
    flexDirection: "row",
  },
  infoContainer: {
    marginLeft: 16,
    paddingTop: 0,
    flex: 1,
    justifyContent: "center",
  },
  contactRow: {
    width: "100%",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    flexDirection: "row",
    
  },
});