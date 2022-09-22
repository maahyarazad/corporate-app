import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from "react-native";
import { width } from "../../../components/styles";
import { Label } from "../../../components/typography/label.component";
import { offerStamps } from "../../../utils/constants";

export const Offer = ({ offer, onPress, backgroundColor = "#efefef" }) => {
  return (
    <TouchableHighlight onPress={onPress} style={{ borderRadius: 10 }}>
      <View style={styles.container}>
        <View style={styles.ticketContainer}>
          <View
            style={[
              styles.bottomNotch,
              styles.topNotch,
              styles.outerBottomNotch,
              { backgroundColor },
            ]}
          />
          <View
            style={[
              styles.bottomNotch,
              styles.outerBottomNotch,
              { backgroundColor },
            ]}
          />
          <View style={[styles.offerTicket, { backgroundColor: offer.color }]}>
            <View style={styles.bottomNotch}></View>
            <View style={[styles.bottomNotch, styles.topNotch]}></View>

            <View style={{ flexDirection: "row" }}>
              <View style={styles.cutLine}>
                <Image
                  style={{ width: 90, height: 90 }}
                  source={offerStamps[offer.premium_id - 1]}
                />
              </View>
              <View style={styles.textContent}>
                <View style={{ flex: 1 }}>
                  <Label weight={"medium"} size={"subtitle"}>
                    {`${offer.premium_en}${
                      offer.freebie_en ? ` ${offer.freebie_en}` : ""
                    } on`}
                  </Label>
                  <View style={styles.offerName}>
                    <Label
                      weight={"bold"}
                      size={"title"}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {offer.prodname_en}
                    </Label>
                  </View>
                  <Label style={styles.expiryDate}>
                    {/* {console.log(
                    new Date(Date.parse(offer.date_end)).toLocaleDateString()
                  )} */}
                    valid until{" "}
                    {new Date(Date.parse(offer.date_end)).toLocaleDateString()}
                  </Label>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableHighlight>
  );
};

const styles = StyleSheet.create({
  container: {},
  ticketContainer: {
    backgroundColor: "white",
    height: 110,
    // marginHorizontal: 16,
    // marginVertical: 8,
    borderRadius: 8,
    padding: 4,
    // shadowOpacity: 0.4,
    // shadowOffset: { width: 3, height: 3 },
  },
  offerTicket: {
    flex: 1,
    borderRadius: 8,
    position: "relative",
  },
  bottomNotch: {
    backgroundColor: "white",
    height: 15,
    width: 30,
    borderRadius: 30,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: "hidden",
    position: "absolute",
    bottom: 0,
    left: 90,
  },
  topNotch: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    top: 0,
  },
  cutLine: {
    width: 108,
    height: 106,
    marginLeft: -2,
    marginTop: -2,
    borderWidth: 2,
    borderColor: "white",
    borderStyle: "dashed",
    borderRadius: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  textContent: {
    padding: 8,
    paddingLeft: 20,
    flex: 1,
  },
  offerName: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
  },
  expiryDate: {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  outerBottomNotch: {
    zIndex: 200,
    width: 20,
    height: 14,
    left: 99,
  },
});
