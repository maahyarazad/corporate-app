import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useContext, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { showToast } from "../../../Toast";
import { Button, IconButton } from "react-native-paper";
import WebView from "react-native-webview";
import { LoadingOverlay } from "../../../components/loading/loading.component";
import { LocationInfo } from "../../../components/location/LocationInfo.component";
import { CustomModal } from "../../../components/modal/customModal.component";
import { Label } from "../../../components/typography/label.component";
import { navigate } from "../../../navigation/navigate";
import { AuthContext } from "../../../services/auth/auth.context";
import { TranslationContext } from "../../../services/translation/translation.context";
import { Offer } from "./offer.component";
import useRequest from "../../../../hooks/useRequest";
import useUser from "../../../../hooks/useUser";
import useAuth from "../../../../hooks/useAuth";
import { fontSizes } from "../../../infrastructure/theme/fonts";

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
        return;
      }
    } catch (error) {
      setLoading(false);
      console.log("Failed to generate offer:", error);
    }finally{
        setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <View style={styles.centerBox}>
      <CustomModal showModal={showModal}>
        <OrderCardModal onClose={closeModal} />
      </CustomModal>
      <LoadingOverlay display={loading} />
      <View style={styles.bordered}>
        <View
          style={styles.box}
        >
          <LocationInfo
            location={location}
            distance={distance}
            headerSize="title"
            subheaderSize="subtitle"
            infoSize="body"
            imageH={80}
            imageW={80}
            showContact={false}
          />
        </View>
        <View style={styles.sizeBox}>
          <Offer offer={offerInfo} backgroundColor="white" />
        </View>

        <View style={styles.flexBox}>
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
      <View style={styles.row}>
        <Button
          onPress={onAvailOffer}
          labelStyle={styles.buttonLabel}
          contentStyle={styles.buttonContent}
          style={styles.button2}
          mode="contained"
        >
          <Text allowFontScaling={false} style={{fontSize: fontSizes.subtitle}}>
            {i18n.t("redeem-offer.avail-offer")}
          </Text>
        </Button>
        <Button
          onPress={onCloseModal}
          labelStyle={styles.buttonLabel}
          contentStyle={styles.buttonContent}
          style={styles.button2}
          mode="contained"
        >
             <Text allowFontScaling={false} style={{fontSize: fontSizes.subtitle}}>
         
          {i18n.t("close")}
          </Text>
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
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000aa",
  },
  bordered: {
    width: "95%",
    height: "70%",
    maxHeight: 550,
    backgroundColor: "white",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
  },
  box: {
    width: "100%",
    marginBottom: 14,
  },
  sizeBox: {
    width: "100%",
    height: 100,
  },
  flexBox: {
    flex: 1,
    marginVertical: 16,
    width: "100%",
  },
  row: {
    width: "100%",
    height: 50,
    flexDirection: "row",
    justifyContent: "space-around",
    margin: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  buttonLabel: {
    fontSize: 12,
  },
  buttonContent: {
    height: "100%",
    width: "100%",
  },
  button2: {
    flex: 1,
    backgroundColor: "#1282FF",
    borderRadius: 10,
  },
  bordered2: {
    width: "95%",
    maxHeight: 550,
    backgroundColor: "white",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderRadius: 12,
    padding: 16,
  },
  overlay: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  materialCommunityIcons: {
    fontSize: 25,
  },
  iconButton: {
    margin: 0,
    padding: 0,
  },
  spacer: {
    marginTop: 8,
  },
  row2: {
    flexDirection: "row",
    marginTop: 20,
    gap: 12,
  },
  buttonContent2: {
    width: "100%",
  },
});

export const OrderCardModal = ({ onClose }) => {
  const { i18n } = useContext(TranslationContext);
  const { goToVerification } = useAuth();
  const handleCall = () => {
    Linking.openURL(`tel:${encodeURIComponent("+971562050066")}`).catch(
      (err) => {
        showToast("error", "Call Failed", "Unable to call this number");
      }
    );
  };

  const handleUpload = () => {
    goToVerification();
  };

  return (
    <View style={styles.centerBox}>
      <View style={styles.bordered2}>
        <View style={styles.overlay}>
          <IconButton
            icon={() => (
              <MaterialCommunityIcons name="close" style={styles.materialCommunityIcons} />
            )}
            onPress={onClose}
            style={styles.iconButton}
            rippleColor="#ccc"
          ></IconButton>
        </View>
        <Label size="heading" weight="bold">
          {i18n.t("offer-restriction.title")}
        </Label>
        <View style={styles.spacer} />
        <View style={styles.spacer} />
        <Label>{i18n.t("offer-restriction.message")}</Label>
        <View style={styles.row2}>
          <Button
            onPress={handleCall}
            labelStyle={styles.buttonLabel}
            contentStyle={styles.buttonContent2}
            style={styles.button2}
            mode="contained"
          >
            {i18n.t("offer-restriction.order-now")}
          </Button>
          <Button
            onPress={handleUpload}
            labelStyle={styles.buttonLabel}
            contentStyle={{}}
            style={styles.button2}
            mode="contained"
          >
            {i18n.t("offer-restriction.upload-card")}
          </Button>
        </View>
      </View>
    </View>
  );
};
