import React, { useContext, useState } from "react";
import { StyleSheet, TouchableHighlight, View } from "react-native";
import { Button } from "react-native-paper";
import WebView from "react-native-webview";
import { LoadingOverlay } from "../../../components/loading/loading.component";
import { LocationInfo } from "../../../components/location/LocationInfo.component";
import { Spacer } from "../../../components/spacer/spacer.component";
import { Label } from "../../../components/typography/label.component";
import { navigate } from "../../../navigation/navigate";
import { AuthContext } from "../../../services/auth/auth.context";
import { OfferService } from "../../../services/offer/offer.service";
import { Offer } from "./offer.component";

export const OfferModalInfo = ({
  onCloseModal,
  offerInfo,
  location,
  distance,
}) => {
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);

  const onAvailOffer = () => {
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

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000000aa",
      }}
    >
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
                    ? `<div style="margin-bottom: 90px"><strong>Highlights</strong>
                ${offerInfo.highlights_en}</div>`
                    : ""
                }
                ${
                  offerInfo.fineprints_en != "" &&
                  offerInfo.fineprints_en != undefined
                    ? `<div style="margin-bottom: 90px"><strong>Fine Prints</strong>
                ${offerInfo.fineprints_en}</div>`
                    : ""
                }
                ${
                  offerInfo.tnc_en != "" && offerInfo.tnc_en != undefined
                    ? `<div style="margin-bottom: 90px;"><strong>Terms & Conditions</strong>
                ${offerInfo.tnc_en}</div>`
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
          Avail Offer
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
          Close
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
