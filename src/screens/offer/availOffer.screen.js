import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Background from "../../components/background/background.component";
import { SafeArea } from "../../components/safearea.component";
import { Label } from "../../components/typography/label.component";
import QRCode from "react-native-qrcode-svg";
import { Button } from "react-native-paper";
import { Spacer } from "../../components/spacer/spacer.component";
import { Ionicons } from "@expo/vector-icons";
import { CustomModal } from "../../components/modal/customModal.component";
import { OfferRedeemForm } from "../../features/offers/components/offerRedeemForm";
import { OfferService } from "../../services/offer/offer.service";
import { goback } from "../../navigation/navigate";
import { LocationInfo } from "../../components/location/LocationInfo.component";

export const AvailOfferScreen = ({ route }) => {
  const { location, offerInfo, distance, offerCode } = route.params.state;
  const [showModal, setShowModal] = useState(false);

  const onCloseModal = () => {
    setShowModal(false);
  };

  const { height, width } = Dimensions.get("window");

  const onConsume = async (discount, total, paid) => {
    const data = {
      initials: offerCode.substr(0, 3),
      series: offerCode.substr(3, offerCode.length),
      discount: discount,
      total: total,
      paid: paid,
    };

    const response = await OfferService.consumeOfferCode(data);
    console.log(response);
    return response;
  };

  const displayModal = () => {
    setShowModal(true);
  };

  return (
    <View style={styles.container}>
      <CustomModal showModal={showModal}>
        <OfferRedeemForm
          offerInfo={offerInfo}
          onCloseModal={onCloseModal}
          location={location}
          distance={distance}
          onConsume={onConsume}
        />
      </CustomModal>
      <Background style={{ flex: 1 }}>
        <SafeArea style={{ flex: 1, width: "100%" }}>
          <View
            style={{
              flexDirection: "row",
            }}
          >
            <TouchableOpacity
              onPress={goback}
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
              activeOpacity={0.5}
            >
              <Ionicons name="arrow-back" size={35} color={"#eee"} />
              <Label
                // size={"title"}
                weight="bold"
                style={{
                  fontSize: 16,
                  color: "white",
                  justifyContent: "center",
                }}
              >
                Return
              </Label>
            </TouchableOpacity>
          </View>
          {/* <ScrollView indicatorStyle="white"> */}
          <View style={{ width: "100%", padding: 16, paddingVertical: 8 }}>
            <LocationInfo
              distance={distance}
              location={location}
              headerSize={"title"}
              subheaderSize={"body"}
              infoSize={"subheading"}
              headerColor="white"
              color="white"
              showContact={false}
              imageH={80}
              imageW={80}
            />
          </View>
          <View style={{ alignItems: "center", paddingTop: 12 }}>
            <Label
              style={{ color: "white", textAlign: "center" }}
              size={"h5"}
              weight={"bold"}
            >
              {`${offerInfo.premium_en}${
                offerInfo.freebie_en != undefined && offerInfo.freebie_en != ""
                  ? ` ${offerInfo.freebie_en}`
                  : ""
              }`}
            </Label>
          </View>
          <View style={{ alignItems: "center", paddingVertical: 12 }}>
            <Label
              style={{ color: "white", textAlign: "center" }}
              size={"title"}
              weight={"medium"}
            >
              {offerInfo.prodname_en}
            </Label>
          </View>
          <View
            style={{
              paddingHorizontal: 32,
              paddingVertical: 16,
              backgroundColor: "#00000088",
              marginBottom: 12,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Label
              style={{ color: "#FFDC00", fontSize: 16, textAlign: "center" }}
              weight={"bold"}
            >
              Please present this Offer Code onsite to {location.name}'s cashier
              to avail the offer.
            </Label>
          </View>
          <View
            style={{
              width: "100%",
              justifyContent: "space-evenly",
              alignItems: "center",
              flex: 1,
              paddingBottom: 16,
            }}
          >
            <View style={{ width: (height - 300) * 0.5 }}>
              <QRCode
                size={(height - 300) * 0.5}
                quietZone={20}
                value={offerCode}
              />
              <View
                style={{
                  backgroundColor: "black",
                  width: "100%",
                  height: height * 0.07,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Label
                  style={{ color: "white" }}
                  size={"title"}
                  weight={"bold"}
                >
                  {offerCode}
                </Label>
              </View>
            </View>
            <View
              style={{
                paddingHorizontal: 32,
                paddingVertical: 24,
                width: "100%",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  width: "100%",
                }}
              >
                <Button
                  onPress={displayModal}
                  contentStyle={{ padding: 10 }}
                  labelStyle={{ fontSize: 12 }}
                  style={{ flex: 1, backgroundColor: "#1282FF" }}
                  mode="contained"
                >
                  Use Code
                </Button>
                <Spacer position={"left"} size={"small"} />
                <Button
                  onPress={() => {
                    Linking.openURL(`tel:${location.phone}`);
                  }}
                  labelStyle={{ fontSize: 12 }}
                  contentStyle={{ padding: 10 }}
                  style={{ flex: 1, backgroundColor: "#1282FF" }}
                  mode="contained"
                  icon={() => {
                    return <Ionicons name="call" color={"white"} size={20} />;
                  }}
                >
                  Call Now
                </Button>
              </View>
            </View>
          </View>
          {/* </ScrollView> */}
        </SafeArea>
      </Background>
      <StatusBar style="light" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
});
