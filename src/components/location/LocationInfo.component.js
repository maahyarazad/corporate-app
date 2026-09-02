import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Linking, StyleSheet, Text, View } from "react-native";
import { showToast } from "../../Toast";
import { adminFileBaseURL } from "../../utils/constants";

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
          <View style={[styles.bordered, { width: imageW, height: imageH }]}>
            <Image
              source={{ uri: `${adminFileBaseURL}${location.logo}` }}
              style={[styles.image, { width: imageW - 12, height: imageH - 10 }]}
              resizeMode="contain"
            />
          </View>
        )}

        <View style={styles.infoContainer}>
          <Text numberOfLines={1} style={[styles.text2, { color: headerColor }]}>
            {location?.name || ""}
          </Text>

          {location?.main !== undefined && location?.main !== null && (
            <Text numberOfLines={1} style={[styles.text3, { color }]}>
              {location.main}
            </Text>
          )}

          {location?.region && distance !== undefined && distance !== null && (
            <Text style={[styles.text4, { color }]}>
              {`${location.region} • ${distance} km`}
            </Text>
          )}

          <Text style={[styles.text5, { color }]}>
            {location?.category || ""}
          </Text>

          {phoneList && phoneList.length > 0 && (
              <View style={{...styles.contactRow}}>
                
              <Ionicons name="call" size={17} color="#888" style={styles.ionicons} />
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
                    style={styles.text}
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
  ionicons: {
    paddingRight: 4,
  },
  text: {
    color: "#006EFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  bordered: {
    backgroundColor: "white",
    borderWidth: 1,
    borderRadius: 4,
    borderColor: "#ccc",
    padding: 5,
  },
  image: {
    flex: 1,
    backgroundColor: "white",
  },
  text2: {
    fontWeight: "bold",
    fontSize: 18,
  },
  text3: {
    fontWeight: "bold",
    fontSize: 16,
  },
  text4: {
    fontWeight: "500",
    fontSize: 14,
  },
  text5: {
    fontWeight: "bold",
    fontSize: 14,
  },
});