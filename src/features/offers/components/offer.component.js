import moment from "moment";
import React, { memo, useContext } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from "react-native";
import RibbonSVG from "../../../components/ribbon.component";
import { width } from "../../../components/styles";
import { Label } from "../../../components/typography/label.component";
import { TranslationContext } from "../../../services/translation/translation.context";
import { offerStamps } from "../../../utils/constants";

// onPress receives the offer: `(offer) => void`. The parent must NOT build a
// per-item closure, or this memo can never hit. See contracts/list-api.md C1.
const OfferComponent = ({ offer, onPress, backgroundColor = "#efefef" }) => {
  const { i18n } = useContext(TranslationContext);

  return (
    <TouchableHighlight
      onPress={() => onPress?.(offer)}
      style={{ borderRadius: 10 }}
    >
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
            {offer && !!offer.isHotpick && (
              <View style={{ position: "absolute", zIndex: 2, top: 6 }}>
                <RibbonSVG fill="#FF9600" />
                <View
                  style={{
                    position: "absolute",
                    height: "100%",
                    // backgroundColor: "green",
                    width: "100%",
                    paddingRight: 16,
                    display: "flex",
                    // alignItems: "flex-start",
                    flexDirection: "row",
                  }}
                >
                  <View style={{ position: "relative", height: 30, width: 20 }}>
                    <Image
                      style={{
                        height: 30,
                        width: 20,
                        tintColor: "#FF5000",
                        position: "absolute",
                        top: -10,
                      }}
                      source={require("./../../../../assets/specials/Hot_Pick.png")}
                    />
                  </View>
                  <View
                    style={{
                      flex: 1,
                      justifyContent: "center",
                    }}
                  >
                    <Label
                      style={{
                        color: "white",
                        fontSize: 13,
                      }}
                      weight="bold"
                    >
                      Hot Pick
                    </Label>
                  </View>
                </View>
              </View>
            )}

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
                  <Label weight="medium" size={14}>
                    {`${offer.premium_en}${
                      offer.freebie_en ? ` ${offer.freebie_en}` : ""
                    } on`}
                  </Label>
                  <View style={styles.offerName}>
                    <Label
                      weight="bold"
                      size={16}
                      numberOfLines={3}
                      ellipsizeMode="tail"
                    >
                      {offer.prodname_en}
                    </Label>
                  </View>
                  <Label style={styles.expiryDate} size="caption">
                   
                    {`${i18n.t("offer-details.valid-until")} ${moment(
                      new Date(Date.parse(offer.date_end))
                    ).format("DD.MMM YYYY")}`}
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

export const Offer = memo(OfferComponent);

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
