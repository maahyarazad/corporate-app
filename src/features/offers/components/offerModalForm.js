import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useContext, useState } from "react";
import {
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from "react-native";
import { Button, IconButton } from "react-native-paper";
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
import useRequest from "../../../../hooks/useRequest";
import useUser from "../../../../hooks/useUser";
import useAuth from "../../../../hooks/useAuth";

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
  const request = useRequest();
  const { userData } = useUser();
  const { isSkip } = useAuth();

  const onAvailOffer = async () => {
    try {
      if (isSkip) {
        setShowModal(true);
        return;
      }
      setLoading(true);
      const data = {
        user_id: userData.user_id,
        offer_id: offerInfo.id,
        category: offerInfo.category,
      };

      const response = await request(`/v2/offer/generate`, "post", data);

      if (response && response.result) {
        setLoading(false);
        const _initials = response.result.initials;
        const _series = response.result.series;
        let _leadZeroes = "";
        for (let i = response.result.series.toString().length; i <= 6; i++) {
          _leadZeroes += "0";
        }
        const offerCode = `${_initials}${_leadZeroes}${_series}`;

        onCloseModal();
        navigate("AvailOffer", {
          state: { location, distance, offerInfo, offerCode },
        });
      }
    } catch (error) {
      setLoading(false);
      console.log("Failed to generate offer:", error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
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
        <OrderCardModal onClose={closeModal} />
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
          gap: 12,
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
            borderRadius: 10,
          }}
          mode="contained"
        >
          <Text allowFontScaling={false}>
            {i18n.t("redeem-offer.avail-offer")}
          </Text>
        </Button>
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
            borderRadius: 10,
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

export const OrderCardModal = ({ onClose }) => {
  const { i18n } = useContext(TranslationContext);
  const { goToVerification } = useAuth();
  const handleCall = () => {
    Linking.openURL(`tel:${encodeURIComponent("+971562050066")}`).catch(
      (err) => {
        alert("Unable to call this number");
      }
    );
  };

  const handleUpload = () => {
    goToVerification();
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
        <View style={{ position: "absolute", right: 12, top: 12 }}>
          <IconButton
            icon={() => (
              <MaterialCommunityIcons name="close" style={{ fontSize: 25 }} />
            )}
            onPress={onClose}
            style={{ margin: 0, padding: 0 }}
            rippleColor="#ccc"
          ></IconButton>
        </View>
        <Label size={"heading"} weight={"bold"}>
          {i18n.t("offer-restriction.title")}
        </Label>
        <View style={{marginTop: 8}} />
        <View style={{marginTop: 8}} />
        <Label>{i18n.t("offer-restriction.message")}</Label>
        <View style={{ flexDirection: "row", marginTop: 20, gap: 12 }}>
          <Button
            onPress={handleCall}
            labelStyle={{ fontSize: 12 }}
            contentStyle={{
              width: "100%",
            }}
            style={{
              flex: 1,
              backgroundColor: "#1282FF",
              borderRadius: 10,
            }}
            mode="contained"
          >
            {i18n.t("offer-restriction.order-now")}
          </Button>
          <Button
            onPress={handleUpload}
            labelStyle={{ fontSize: 12 }}
            contentStyle={{}}
            style={{
              flex: 1,
              backgroundColor: "#1282FF",
              borderRadius: 10,
            }}
            mode="contained"
          >
            {i18n.t("offer-restriction.upload-card")}
          </Button>
        </View>
      </View>
    </View>
  );
};
