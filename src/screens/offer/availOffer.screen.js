import { StatusBar } from "expo-status-bar";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Keyboard,
  Linking,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { showToast } from "../../Toast";
import { showConfirm } from "../../components/confirmDialog.component";
import Background from "../../components/background/background.component";
import { SafeArea } from "../../components/safearea.component";
import { Label } from "../../components/typography/label.component";
import { Button } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { CustomModal } from "../../components/modal/customModal.component";
import { OfferRedeemForm } from "../../features/offers/components/offerRedeemForm";
import { goback } from "../../navigation/navigate";
import { LocationInfo } from "../../components/location/LocationInfo.component";
import { TranslationContext } from "../../services/translation/translation.context";
import { TextInputCurrency } from "../../components/textInputCurrency/textInputCurrency.component";
import { CodeInputField } from "../../components/codeInputField";
import { useNavigation } from "@react-navigation/native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import useRequest from "../../../hooks/useRequest";
import { fontSizes } from "../../infrastructure/theme/fonts";

export const AvailOfferScreen = ({ route }) => {
  const { location, offerInfo, distance, offerCode } = route.params.state;

  const [showModal, setShowModal] = useState(false);
  const [merchantCode, setCode] = useState("");
  const [pinReady, setPinReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation();
  const { i18n } = useContext(TranslationContext);
  const request = useRequest();

  const minValue = useMemo(() => {
    const value = Number(offerInfo?.min_value);
    return Number.isFinite(value) ? value : 0;
  }, [offerInfo?.min_value]);

  const freebieValue = useMemo(() => {
    const value = Number(offerInfo?.freebie_value);
    return Number.isFinite(value) ? value : 0;
  }, [offerInfo?.freebie_value]);

  const percentageValue = useMemo(() => {
    const value = Number(offerInfo?.percentage);
    return Number.isFinite(value) ? value : 0;
  }, [offerInfo?.percentage]);

  const withFreebie = useMemo(() => {
    const value = Number(offerInfo?.with_freebie);
    return Number.isFinite(value) ? value : 0;
  }, [offerInfo?.with_freebie]);

  const [paidAmount, setPaidAmount] = useState(minValue.toFixed(2));
  const [discAmount, setDiscAmount] = useState(freebieValue.toFixed(2));
  const [totalAmount, setTotalAmount] = useState(
    (freebieValue + minValue).toFixed(2)
  );

  const normalizeNumberInput = (value) => {
    if (value === null || value === undefined) return "";
    return value.toString().replace(/,|٫/gm, ".").trim();
  };

  const parseAmount = (value, fallback = 0) => {
    const normalized = normalizeNumberInput(value);
    if (!normalized) return fallback;

    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const formatAmount = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00";
  };

  const calculate = (actualAmount = paidAmount) => {
    const paid = parseAmount(actualAmount, minValue);

    let total = 0;
    let disc = 0;

    if (freebieValue > 0) {
      total = paid + freebieValue;
      disc = freebieValue;
    } else if (percentageValue > 0) {
      total = paid * percentageValue;
      disc = total - paid;
    } else {
      total = paid;
      disc = 0;
    }

    setPaidAmount(formatAmount(paid));
    setDiscAmount(formatAmount(disc));
    setTotalAmount(formatAmount(total));
  };

  const calculateReverse = () => {
    const total = parseAmount(totalAmount, 0);

    if (freebieValue > 0) {
      const paid = total - freebieValue;
      const safePaid = paid < minValue ? minValue : paid;

      setPaidAmount(formatAmount(safePaid));
      setDiscAmount(formatAmount(freebieValue));
      setTotalAmount(formatAmount(safePaid + freebieValue));
      return;
    }

    if (!percentageValue || percentageValue <= 0) {
      const safePaid = total < minValue ? minValue : total;
      setPaidAmount(formatAmount(safePaid));
      setDiscAmount("0.00");
      setTotalAmount(formatAmount(safePaid));
      return;
    }

    const paid = total / percentageValue;
    const safePaid = paid < minValue ? minValue : paid;
    const recalculatedTotal = safePaid * percentageValue;
    const disc = recalculatedTotal - safePaid;

    setPaidAmount(formatAmount(safePaid));
    setDiscAmount(formatAmount(disc));
    setTotalAmount(formatAmount(recalculatedTotal));
  };

  useEffect(() => {
    calculate(minValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minValue, freebieValue, percentageValue]);

  const onCloseModal = () => {
    setShowModal(false);
  };

  const onConsume = async (discount, total, paid) => {
    try {
      const safeOfferCode = typeof offerCode === "string" ? offerCode : "";

      const data = {
        initials: safeOfferCode.slice(0, 3),
        series: safeOfferCode.slice(3),
        discount,
        total,
        paid,
      };

      const result = await request(`/v2/offer/consume`, "post", data);
 
     
      if (result.success) {
        navigation.reset({
          routes: [{ name: "TransactionSummary", params: result?.data }],
        });
      }
   
      
    } catch (e) {
       
        console.log(e?.data?.error?.sqlMessage);
         showToast(
        "error",
        "Transaction Failed",
       e?.data?.error?.sqlMessage || "Something went wrong while redeeming the offer."
      );
       
    } finally {
        setIsLoading(false);
    }
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

  const onBlurPaidAmount = () => {
    const parsedPaid = parseAmount(paidAmount, minValue);
    const safePaid = parsedPaid < minValue ? minValue : parsedPaid;
    calculate(safePaid);
  };

  const onBlurTotalBill = () => {
    const parsedTotal = parseAmount(totalAmount, 0);
    setTotalAmount(formatAmount(parsedTotal));
    calculateReverse();
  };

  const handleRedeem = async () => {
    

      const merchantPin = (location?.merchant_pin ?? "").toString().trim();

      const enteredPin = (merchantCode ?? "").toString().trim();

      // Validate the PIN before showing the loading state. Otherwise an early
      // return on a wrong PIN would leave the button stuck in loading/disabled.
      if (enteredPin !== merchantPin) {
        showToast(
          "error",
          i18n.t("redemption.error-header"),
          i18n.t("redemption.error-merchant-pin")
        );
        setCode("");
        setPinReady(false);
        return;
      }

      setIsLoading(true);

      await onConsume(discAmount, totalAmount, paidAmount);
  };

  const handleConfirm = () => {
    showConfirm({
      title: i18n.t("redemption.confirm"),
      message: i18n.t("redemption.message"),
      confirmText: i18n.t("proceed"),
      cancelText: i18n.t("cancel"),
      onConfirm: handleRedeem,
    });
  };

  // The redeem button is actionable only when the PIN is complete and no
  // request is in flight. Single source of truth for both the disabled state
  // and the styling so they can't drift apart.
  const canRedeem = pinReady && !isLoading;

  const handleCallNow = async () => {
    try {
      const phone = location?.phone?.split("|")?.[0]?.trim();

      if (!phone) {
        showToast("info", "Unavailable", "Phone number is not available.");
        return;
      }

      const url = `tel:${encodeURIComponent(phone)}`;
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        showToast("info", "Unavailable", "Calling is not supported on this device.");
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      showToast("error", "Unavailable", "Unable to open the dialer.");
    }
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
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAwareScrollView
              enableOnAndroid
              keyboardShouldPersistTaps="handled"
              extraScrollHeight={120}
              extraHeight={140}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              <View style={{ flexDirection: "row" }}>
                <TouchableOpacity
                  onPress={goback}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  activeOpacity={0.5}
                >
                  <Ionicons name="arrow-back" size={35} color="#eee" />
                  <Label
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

              <View
                style={{
                  width: "100%",
                  padding: 16,
                  paddingVertical: 8,
                }}
              >
                <LocationInfo
                  distance={distance}
                  location={location}
                  headerSize="title"
                  subheaderSize="body"
                  infoSize="subheading"
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
                  size="h5"
                  weight="bold"
                >
                  {`${offerInfo.premium_en || ""}${
                    offerInfo.freebie_en !== undefined &&
                    offerInfo.freebie_en !== ""
                      ? ` ${offerInfo.freebie_en}`
                      : ""
                  }`}
                </Label>
              </View>

              <View style={{ alignItems: "center", paddingVertical: 12 }}>
                <Label
                  style={{ color: "white", textAlign: "center" }}
                  size="title"
                  weight="medium"
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
                  style={{
                    color: "#FFDC00",
                    fontSize: 16,
                    textAlign: "center",
                  }}
                  weight="bold"
                >
                  {i18n.t("redeem-offer.instruction", {
                    locationName: location.name,
                  })}
                </Label>
              </View>

              <View style={{ width: "100%", paddingHorizontal: 16 }}>
                <View
                  style={{
                    borderWidth: 1,
                    marginVertical: 8,
                    borderRadius: 8,
                    paddingBottom: 20,
                    paddingTop: 10,
                    borderColor: "#aaa",
                    paddingHorizontal: 12,
                    backgroundColor: "white",
                  }}
                >
                  <TextInputCurrency
                    onBlur={onBlurTotalBill}
                    onFocus={onFocusTotal}
                    onChangeText={onChangeTotalBill}
                    disabled={withFreebie === 1}
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
                    disabled={withFreebie === 2}
                    minValue={minValue}
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
                    disabled={!canRedeem}
                    onPress={handleConfirm}
                    contentStyle={{ padding: 10 }}
                    labelStyle={{ fontSize: fontSizes.subtitle }}
                    style={{
                      flex: 1,
                      backgroundColor: canRedeem ? "#1282FF" : "gray",
                      borderRadius: 12,
                    }}
                    mode="contained"
                    loading={isLoading}
                  >
                    {i18n.t("redeem-offer.redeem")}
                  </Button>

                  <View style={{ marginLeft: 6 }} />

                  <Button
                    onPress={handleCallNow}
                    disabled={isLoading}
                    labelStyle={{ fontSize: fontSizes.subtitle, color: 'white' }}
                    contentStyle={{ padding: 10 }}
                    style={{
                      flex: 1,
                      backgroundColor: "#1282FF",
                      borderRadius: 12,
                    }}
                    mode="contained"
                    icon={() => (
                      <Ionicons name="call" color="white" size={20} />
                    )}
                  >
                    {i18n.t("redeem-offer.call-now")}
                  </Button>
                </View>
              </View>
            </KeyboardAwareScrollView>
          </TouchableWithoutFeedback>
        </SafeArea>
      </Background>

      <StatusBar style="light" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
