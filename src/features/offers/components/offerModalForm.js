import React, { useContext, useState } from "react";
import {
  Alert,
  Linking,
  StyleSheet,
  TouchableHighlight,
  View,
} from "react-native";
import { Button } from "react-native-paper";
import WebView from "react-native-webview";
import { LoadingOverlay } from "../../../components/loading/loading.component";
import { LocationInfo } from "../../../components/location/LocationInfo.component";
import { CustomModal } from "../../../components/modal/customModal.component";
import { Spacer } from "../../../components/spacer/spacer.component";
import { Label } from "../../../components/typography/label.component";
import { navigate } from "../../../navigation/navigate";
import { AuthContext } from "../../../services/auth/auth.context";
import { OfferService } from "../../../services/offer/offer.service";
import { TranslationContext } from "../../../services/translation/translation.context";
import { Offer } from "./offer.component";

export const OfferModalInfo = ({
  onCloseModal,
  offerInfo,
  location,
  distance,
}) => {
  const [loading, setLoading] = useState(false);
  const { user, skip, setSkip } = useContext(AuthContext);
  const { i18n } = useContext(TranslationContext);
  const [showModal, setShowModal] = useState(false);

  const onAvailOffer = () => {
    if (skip) {
      setShowModal(true);
      return;
    }
    setLoading(true);
    const data = {
      user_id: user.user_id,
      offer_id: offerInfo.id,
      category: offerInfo.category,
    };
    OfferService.generateOfferCode(data)
      .then((response) => {
        setLoading(false);
        const _initials = response.initials;
        const _series = response.series;
        let _leadZeroes = "";
        for (let i = response.series.toString().length; i <= 6; i++) {
          _leadZeroes += "0";
        }
        const offerCode = `${_initials}${_leadZeroes}${_series}`;

        onCloseModal();
        navigate("AvailOffer", {
          state: { location, distance, offerInfo, offerCode },
        });
      })
      .catch((err) => {
        setLoading(false);
        console.log(err);
        alert("Could not generate offer code");
      });
  };

  const handleCall = () => {
    Linking.openURL(`tel:+971562050066`).catch((err) => {
      alert("Unable to call this number");
    });
  };

  const handleUpload = () => {
    setSkip(0);
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000000aa",
      }}
    >
      <CustomModal showModal={showModal}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#000000aa",
          }}
        >
          <View
            style={{
              width: "95%",
              maxHeight: 550,
              backgroundColor: "white",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <Label size={"heading"} weight={"bold"}>
              {i18n.t("offer-restriction.title")}
            </Label>
            <Spacer position={"top"} size={"medium"} />
            <Label>{i18n.t("offer-restriction.message")}</Label>
            <View style={{ flexDirection: "row", marginTop: 20 }}>
              <Button
                onPress={handleCall}
                labelStyle={{ fontSize: 12 }}
                contentStyle={{
                  width: "100%",
                }}
                style={{
                  flex: 1,
                  backgroundColor: "#1282FF",
                }}
                mode="contained"
              >
                {i18n.t("offer-restriction.order-now")}
              </Button>
              <Spacer position={"right"} size={"small"} />
              <Button
                onPress={handleUpload}
                labelStyle={{ fontSize: 12 }}
                contentStyle={{
                  width: "100%",
                }}
                style={{
                  flex: 1,
                  backgroundColor: "#1282FF",
                }}
                mode="contained"
              >
                {i18n.t("offer-restriction.upload-card")}
              </Button>
            </View>
          </View>
        </View>
      </CustomModal>
      <LoadingOverlay display={loading} />
      <View
        style={{
          width: "95%",
          height: "70%",
          maxHeight: 550,
          backgroundColor: "white",
          justifyContent: "space-between",
          alignItems: "center",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <View
          style={{
            // flex: 1,
            width: "100%",
            marginBottom: 14,
          }}
        >
          <LocationInfo
            location={location}
            distance={distance}
            headerSize={"title"}
            subheaderSize={"subtitle"}
            infoSize={"body"}
            imageH={80}
            imageW={80}
            showContact={false}
          />
        </View>
        <View style={{ width: "100%", height: 100 }}>
          <Offer offer={offerInfo} backgroundColor="white" />
        </View>

        <View
          style={{
            flex: 1,
            marginVertical: 16,
            width: "100%",
          }}
        >
          <WebView
            setBuiltInZoomControls={false}
            originWhitelist={["*"]}
            minimumFontSize={20}
            source={{
              html: `
              <div style="font-size: 40px; font-family: helvetica;">
              
                ${
                  offerInfo.highlights_en != "" &&
                  offerInfo.highlights_en != undefined
                    ? `<div style="margin-bottom: 90px"><strong>${i18n.t(
                        "redeem-offer.highlights"
                      )}</strong>
                ${offerInfo.highlights_en}</div>`
                    : ""
                }
                ${
                  offerInfo.fineprints_en != "" &&
                  offerInfo.fineprints_en != undefined
                    ? `<div style="margin-bottom: 90px"><strong>${i18n.t(
                        "redeem-offer.fine-prints"
                      )}</strong>
                ${offerInfo.fineprints_en}</div>`
                    : ""
                }
               
                
              </div>
            `,
            }}
          />
        </View>
      </View>
      <View
        style={{
          width: "100%",
          height: 50,
          flexDirection: "row",
          justifyContent: "space-around",
          margin: 16,
          paddingHorizontal: 16,
        }}
      >
        <Button
          onPress={onAvailOffer}
          labelStyle={{ fontSize: 12 }}
          contentStyle={{
            height: "100%",
            width: "100%",
          }}
          style={{
            flex: 1,
            backgroundColor: "#1282FF",
          }}
          mode="contained"
        >
          {i18n.t("redeem-offer.avail-offer")}
        </Button>
        <Spacer position={"left"} size={"medium"} />
        <Button
          onPress={onCloseModal}
          labelStyle={{ fontSize: 12 }}
          contentStyle={{
            height: "100%",
            width: "100%",
          }}
          style={{
            flex: 1,
            backgroundColor: "#1282FF",
          }}
          mode="contained"
        >
          {i18n.t("close")}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  button: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#006EFF",
    borderRadius: 6,
  },
});
