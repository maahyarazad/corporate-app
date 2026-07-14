import { CommonActions, useNavigation } from "@react-navigation/native";
import React, { useContext, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { showToast } from "../../../Toast";
import { showConfirm } from "../../../components/confirmDialog.component";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Button } from "react-native-paper";
import { CodeInputField } from "../../../components/codeInputField";
import { LoadingOverlay } from "../../../components/loading/loading.component";
import { Spacer } from "../../../components/spacer/spacer.component";
import { TextInputCurrency } from "../../../components/textInputCurrency/textInputCurrency.component";
import { Label } from "../../../components/typography/label.component";
import { navigate } from "../../../navigation/navigate";
import { TranslationContext } from "../../../services/translation/translation.context";
import { Offer } from "./offer.component";

export const OfferRedeemForm = ({
  location,
  offerInfo,
  onCloseModal,
  onConsume,
}) => {
  const [merchantCode, setCode] = useState("");
  const [pinReady, setPinReady] = useState(false);
  const [paidAmount, setPaidAmount] = useState(offerInfo.min_value);
  const [discAmount, setDiscAmount] = useState(offerInfo.freebie_value);
  const [totalAmount, setTotalAmount] = useState(
    offerInfo.freebie_value + offerInfo.min_value
  );
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const { i18n } = useContext(TranslationContext);

  useEffect(() => {
    calculate();
  }, []);

  const calculate = () => {
    const correctedPaid = paidAmount.toString().split(/,|٫/gm).join(".");
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

  const onBlurPaidAmount = () => {
    setPaidAmount(
      paidAmount
        ? paidAmount < offerInfo.min_value
          ? offerInfo.min_value
          : parseFloat(paidAmount.toString().split(/,|٫/gm).join("."))
        : "0.00"
    );
    calculate();
  };

  const onBlurTotalBill = () => {
    // setPaidAmount(
    //   paidAmount < offerInfo.min_value ? offerInfo.min_value : paidAmount
    // );
    setTotalAmount(
      totalAmount
        ? parseFloat(totalAmount.toString().split(/,|٫/gm).join("."))
        : "0.00"
    );
    // setPaidAmount(
    //   parseFloat(paidAmount.toString().split(/,|٫/gm).join(".")) ?? 0.00
    // );
    calculateReverse();
  };

  const handleRedeem = async () => {
    setIsLoading(true);
    if (parseInt(merchantCode) === parseInt(location.merchant_pin)) {
      const consumed = await onConsume(discAmount, totalAmount, paidAmount);
      setIsLoading(false);
      if (consumed.success) {
        onCloseModal();
        navigation.reset({
          routes: [{ name: "TransactionSummary", params: consumed.data }],
        });
      } else {
        Alert("Transaction Failed", consumed.message);
      }

      
    } else {
      setIsLoading(false);

      showToast(
        "error",
        i18n.t("redemption.error-header"),
        i18n.t("redemption.error-merchant-pin")
      );
    }
  };

  const handleConfirm = () => {
    showConfirm({
      title: i18n.t("redemption.confirm"),
      message: i18n.t("redemption.message"),
      confirmText: i18n.t("proceed"),
      cancelText: i18n.t("cancel"),
      onConfirm: () => {
        handleRedeem();
      },
    });
  };

  return (
    <KeyboardAwareScrollView
      behavior="padding"
      style={{
        flex: 1,
        backgroundColor: "#000000cc",
      }}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <LoadingOverlay display={isLoading} />
      <View
        style={{
          width: "95%",
          height: "70%",
          backgroundColor: "white",
          borderRadius: 12,
          maxHeight: 530,
        }}
      >
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ScrollView
            centerContent={true}
            indicatorStyle="black"
            contentContainerStyle={{}}
          >
            <View style={{ padding: 16, height: "100%" }}>
              <View style={{ marginVertical: 8 }}>
                <Offer offer={offerInfo} backgroundColor="white" />
              </View>
              <View
                style={{
                  borderWidth: 1,
                  marginVertical: 8,
                  borderRadius: 8,
                  borderColor: "#aaa",
                  paddingHorizontal: 12,
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
                  disabled={false}
                  // disabled={offerInfo.with_freebie === 1}
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
                      borderRadius: 20,
                      width: 40,
                      height: 40,
                      borderColor: "#aaa",
                    }}
                    containerStyle={{
                      marginTop: 4,
                    }}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
      <View style={{ flexDirection: "row", padding: 16 }}>
        <Button
          style={{ flex: 1, backgroundColor: "#006EFF" }}
          contentStyle={{ padding: 8 }}
          mode="contained"
          onPress={onCloseModal}
        >
          {i18n.t("close")}
        </Button>
        <View style={{marginLeft: 6}} />
        
        <Button
          disabled={!pinReady}
          style={{
            flex: 1,
            backgroundColor: pinReady ? "#006EFF" : "#999999",
          }}
          labelStyle={{
            color: pinReady ? "white" : "#ddd",
          }}
          contentStyle={{ padding: 8 }}
          mode="contained"
          onPress={handleConfirm}
        >
          {i18n.t("redeem-offer.redeem")}
        </Button>
      </View>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  container: {},
});
