import { CommonActions, useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Button } from "react-native-paper";
import { CodeInputField } from "../../../components/codeInputField";
import { LoadingOverlay } from "../../../components/loading/loading.component";
import { Spacer } from "../../../components/spacer/spacer.component";
import { TextInputCurrency } from "../../../components/textInputCurrency/textInputCurrency.component";
import { Label } from "../../../components/typography/label.component";
import { navigate } from "../../../navigation/navigate";
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

  useEffect(() => {
    let isMounted = true;

    calculate();

    return () => {
      isMounted = false;
    };
  }, []);

  const calculate = () => {
    const total =
      offerInfo.freebie_value > 0
        ? parseFloat(paidAmount) + offerInfo.freebie_value
        : paidAmount * offerInfo.percentage;
    const disc =
      offerInfo.freebie_value > 0
        ? offerInfo.freebie_value
        : paidAmount * offerInfo.percentage - paidAmount;

    setDiscAmount(disc.toFixed(2));
    setTotalAmount(total.toFixed(2));
  };

  const onChangePaidAmount = (amount) => {
    setPaidAmount(amount);
  };

  const onFocusPaid = () => {
    setPaidAmount("");
  };

  const onBlurPaidAmount = () => {
    setPaidAmount(
      paidAmount < offerInfo.min_value ? offerInfo.min_value : paidAmount
    );
    calculate();
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

      // console.log(te);
    } else {
      setIsLoading(false);

      alert("Wrong Merchant Pin");
    }
  };

  const handleConfirm = () => {
    Alert.alert(
      "Confirm Redemption",
      "Are you sure you want to use this offer?",
      [
        {
          text: "Cancel",
          onPress: () => {},
        },
        {
          text: "Proceed",
          onPress: () => {
            handleRedeem();
          },
        },
      ]
    );
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
                  disabled={true}
                  value={totalAmount.toString()}
                  style={{ marginVertical: 6 }}
                  label={"Total Bill (before Discount)"}
                />
                <TextInputCurrency
                  disabled={true}
                  value={discAmount.toString()}
                  style={{ marginVertical: 6 }}
                  label={"Discount Amount"}
                />
                <TextInputCurrency
                  onBlur={onBlurPaidAmount}
                  onFocus={onFocusPaid}
                  onChangeText={onChangePaidAmount}
                  disabled={offerInfo.with_freebie === 2}
                  minValue={offerInfo.min_value}
                  value={paidAmount.toString()}
                  style={{ marginVertical: 6 }}
                  label={"Actual Discounted Payment"}
                />
                <View style={{ marginTop: 8 }}>
                  <Label>Enter 6-Digit Cashier Pin</Label>
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
          Close
        </Button>
        <Spacer position={"left"} size={"small"} />
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
          Redeem
        </Button>
      </View>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  container: {},
});
