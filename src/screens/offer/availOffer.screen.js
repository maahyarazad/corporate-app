import { StatusBar } from "expo-status-bar";
import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
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
import { TranslationContext } from "../../services/translation/translation.context";
import { TextInputCurrency } from "../../components/textInputCurrency/textInputCurrency.component";
import { CodeInputField } from "../../components/codeInputField";
import { useNavigation } from "@react-navigation/native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import useRequest from "../../../hooks/useRequest";

export const AvailOfferScreen = ({ route }) => {
  const { location, offerInfo, distance, offerCode } = route.params.state;
  const [showModal, setShowModal] = useState(false);
  const [merchantCode, setCode] = useState("");
  const [pinReady, setPinReady] = useState(false);
  const [paidAmount, setPaidAmount] = useState(
    !!offerInfo.min_value ? offerInfo.min_value.toFixed(2) : "0.00"
  );
  const [discAmount, setDiscAmount] = useState(offerInfo.freebie_value);
  const [totalAmount, setTotalAmount] = useState(
    offerInfo.freebie_value + offerInfo.min_value
  );
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const { height, width } = Dimensions.get("window");
  const { i18n } = useContext(TranslationContext);
  const request = useRequest();

  useEffect(() => {
    let isMounted = true;

    calculate();

    return () => {
      isMounted = false;
    };
  }, []);

  const onCloseModal = () => {
    setShowModal(false);
  };

  const onConsume = async (discount, total, paid) => {
    const data = {
      initials: offerCode.substr(0, 3),
      series: offerCode.substr(3, offerCode.length),
      discount: discount,
      total: total,
      paid: paid,
    };

    const response = await request(`/v2/offer/consume`, "post", data);
    return response;
  };

  const displayModal = () => {
    setShowModal(true);
  };

  const calculate = (actualAmount = paidAmount) => {
    const correctedPaid = actualAmount.toString().split(/,|٫/gm).join(".");
    const total =
      offerInfo.freebie_value > 0
        ? parseFloat(correctedPaid) + offerInfo.freebie_value
        : correctedPaid * offerInfo.percentage;
    const disc =
      offerInfo.freebie_value > 0
        ? offerInfo.freebie_value
        : correctedPaid * offerInfo.percentage - correctedPaid;

    setDiscAmount(disc.toFixed(2));
    setTotalAmount(total.toFixed(2));
  };

  const calculateReverse = () => {
    const correctedTotal = totalAmount
      ? totalAmount.toString().split(/,|٫/gm).join(".")
      : 0;
    const paid = parseFloat(correctedTotal) / offerInfo.percentage;
    if (paid < offerInfo.min_value) {
      calculate(offerInfo.min_value);
      return;
    }

    const disc = parseFloat(correctedTotal) - paid;

    setDiscAmount(disc.toFixed(2));
    setPaidAmount(paid.toFixed(2));
  };

  const onChangePaidAmount = (amount) => {
    setPaidAmount(amount);
  };

  const onChangeTotalBill = (amount) => {
    setTotalAmount(amount);
  };

  const onFocusPaid = () => {
    setPaidAmount("");
  };

  const onFocusTotal = () => {
    setTotalAmount("");
  };

  const onBlurPaidAmount = async () => {
    const _paidAmount = paidAmount
      ? paidAmount < offerInfo.min_value
        ? offerInfo.min_value.toFixed(2)
        : parseFloat(paidAmount.toString().split(/,|٫/gm).join(".")).toFixed(2)
      : offerInfo.min_value.toFixed(2);
    setPaidAmount(_paidAmount);
    calculate(_paidAmount);
  };

  const onBlurTotalBill = () => {
    // setPaidAmount(
    //   paidAmount < offerInfo.min_value ? offerInfo.min_value : paidAmount
    // );
    setTotalAmount(
      totalAmount
        ? parseFloat(totalAmount.toString().split(/,|٫/gm).join(".")).toFixed(2)
        : "0.00"
    );
    // setPaidAmount(
    //   parseFloat(paidAmount.toString().split(/,|٫/gm).join(".")) ?? 0.00
    // );
    calculateReverse();
  };

  const handleRedeem = async () => {
    setIsLoading(true);
    console.log("Merchant Pin: ", merchantCode);
    if (parseInt(merchantCode) === parseInt(location.merchant_pin)) {
      const consumed = await onConsume(discAmount, totalAmount, paidAmount);
      setIsLoading(false);
      if (consumed.success) {
        // onCloseModal();
        navigation.reset({
          routes: [{ name: "TransactionSummary", params: consumed.data }],
        });
      } else {
        Alert.alert("Transaction Failed", consumed.message);
      }

      // console.log(te);
    } else {
      setIsLoading(false);

      Alert.alert(
        i18n.t("redemption.error-header"),
        i18n.t("redemption.error-merchant-pin")
      );
      setCode("");
    }
  };

  const handleConfirm = () => {
    Alert.alert(i18n.t("redemption.confirm"), i18n.t("redemption.message"), [
      {
        text: i18n.t("cancel"),
        onPress: () => {},
      },
      {
        text: i18n.t("proceed"),
        onPress: () => {
          handleRedeem();
        },
      },
    ]);
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
                {i18n.t("return")}
              </Label>
            </TouchableOpacity>
          </View>
          {/* <ScrollView indicatorStyle="white"> */}
          <KeyboardAwareScrollView
            centerContent={true}
            indicatorStyle="black"
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View
              style={{
                width: "100%",
                padding: 16,
                paddingVertical: 8,
                flexGrow: 1,
              }}
            >
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
                  offerInfo.freebie_en != undefined &&
                  offerInfo.freebie_en != ""
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
                {i18n.t("redeem-offer.instruction", {
                  locationName: location.name,
                })}
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
              {/* <View style={{ width: (height - 300) * 0.5 }}>
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
            </View> */}
              <View style={{ padding: 16 }}>
                {/* <View style={{ marginVertical: 8 }}>
                <Offer offer={offerInfo} backgroundColor="white" />
              </View> */}
                <View
                  style={{
                    borderWidth: 1,
                    marginVertical: 8,
                    borderRadius: 8,
                    borderColor: "#aaa",
                    paddingHorizontal: 12,
                    backgroundColor: "white",
                  }}
                >
                  <TextInputCurrency
                    onBlur={onBlurTotalBill}
                    onFocus={onFocusTotal}
                    onChangeText={onChangeTotalBill}
                    disabled={offerInfo.with_freebie == 1}
                    value={totalAmount.toString()}
                    style={{ marginVertical: 6 }}
                    label={i18n.t("redeem-offer.total-bill")}
                  />
                  <TextInputCurrency
                    disabled={true}
                    value={discAmount.toString()}
                    style={{ marginVertical: 6 }}
                    label={i18n.t("redeem-offer.discount")}
                  />
                  <TextInputCurrency
                    onBlur={onBlurPaidAmount}
                    onFocus={onFocusPaid}
                    onChangeText={onChangePaidAmount}
                    disabled={offerInfo.with_freebie === 2}
                    minValue={offerInfo.min_value}
                    value={paidAmount.toString()}
                    style={{ marginVertical: 6 }}
                    label={i18n.t("redeem-offer.actual-paid")}
                  />
                  <View style={{ marginTop: 8 }}>
                    <Label>{i18n.t("redeem-offer.merchant-pin")}</Label>
                    <CodeInputField
                      code={merchantCode}
                      setCode={setCode}
                      setPinReady={setPinReady}
                      maxLength={6}
                      hidden={true}
                      inputBoxStyle={{
                        borderRadius: 6,
                        width: 40,
                        height: 40,
                      }}
                      containerStyle={{
                        marginTop: 4,
                      }}
                    />
                  </View>
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
                    disabled={!pinReady}
                    onPress={handleConfirm}
                    contentStyle={{ padding: 10 }}
                    labelStyle={{ fontSize: 12 }}
                    style={{
                      flex: 1,
                      backgroundColor: pinReady ? "#1282FF" : "gray",
                      borderRadius: 12,
                    }}
                    mode="contained"
                  >
                    {i18n.t("redeem-offer.redeem")}
                  </Button>
                  <View style={{marginLeft: 6}} />
                  <Button
                    onPress={() => {
                      Linking.openURL(
                        `tel:${encodeURIComponent(
                          location.phone.split("|")[0]
                        )}`
                      );
                    }}
                    labelStyle={{ fontSize: 12 }}
                    contentStyle={{ padding: 10 }}
                    style={{
                      flex: 1,
                      backgroundColor: "#1282FF",
                      borderRadius: 12,
                    }}
                    mode="contained"
                    icon={() => {
                      return <Ionicons name="call" color={"white"} size={20} />;
                    }}
                  >
                    {i18n.t("redeem-offer.call-now")}
                  </Button>
                </View>
              </View>
            </View>
          </KeyboardAwareScrollView>
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
