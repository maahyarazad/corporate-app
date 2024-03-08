import moment from "moment";
import React, { useContext, useState } from "react";
import { StyleSheet, TouchableHighlight, View } from "react-native";
import { ActivityIndicator, Button } from "react-native-paper";
import { theme } from "../infrastructure/theme";
import { TransactionService } from "../services/transaction/transaction.service";
import { TranslationContext } from "../services/translation/translation.context";
import { config } from "../utils/constants";
// import { Button } from "react-native-paper";
import { CustomModal } from "./modal/customModal.component";
import { Label } from "./typography/label.component";

export const BreakdownRow = ({ item }) => {
  const [showModal, setShowModal] = useState(false);
  const [transaction, setTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { i18n } = useContext(TranslationContext);
  const handleOnItemPress = async (id) => {
    // setUser({ ...user, sample: "hello" });
    // console.log("changed something");
    // alert(id);
    try {
      setShowModal(true);
      setIsLoading(true);
      const response = await TransactionService.getTransaction(id);
      console.log(response);
      if (response.success) {
        setIsLoading(false);
        setTransaction(response.data);
      }
    } catch (error) {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const RowDetails = ({ label, value }) => {
    return (
      <View
        style={{
          opacity: transaction ? 1 : 0,
          flexDirection: "row",
          paddingVertical: 2,
        }}
      >
        <View style={{ flex: 1 }}>
          <Label size={"caption"}>{label}</Label>
        </View>
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <Label style={{ textAlign: "right" }} size={"caption"}>
            {value}
          </Label>
        </View>
      </View>
    );
  };

  return (
    <>
      <CustomModal showModal={showModal}>
        <View
          style={{
            flex: 1,
            backgroundColor: "#00000088",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: "90%",
              backgroundColor: "white",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                backgroundColor: "#ccc",
                padding: 16,
              }}
            >
              <Label weight={"bold"}>
                {i18n.t("profile-tabs.history-breakdown.transaction-details")}
              </Label>
            </View>
            <View
              style={{
                padding: 16,
              }}
            >
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  justifyContent: "center",
                }}
              >
                <ActivityIndicator
                  color={theme.colors.icons.active}
                  size={40}
                  animating={!transaction}
                />
              </View>
              <RowDetails
                label={i18n.t(
                  "profile-tabs.history-breakdown.transaction-code"
                )}
                value={transaction ? transaction.transaction_code : ""}
              />
              <RowDetails
                label={i18n.t("profile-tabs.history-breakdown.availed")}
                value={`${
                  transaction
                    ? transaction.with_freebie
                      ? `${i18n.t("free")} ${transaction.freebie}`
                      : transaction.premium
                    : ""
                } on ${transaction ? transaction.prodname : ""}`}
              />
              <RowDetails
                label={i18n.t("profile-tabs.history-breakdown.merchant")}
                value={transaction ? transaction.merchant : ""}
              />
              <RowDetails
                label={i18n.t("profile-tabs.history-breakdown.category")}
                value={transaction ? transaction.category : ""}
              />
              <RowDetails
                label={i18n.t(
                  "profile-tabs.history-breakdown.transaction-date"
                )}
                value={moment(
                  transaction ? transaction.date_transaction : new Date()
                ).format("DD.MMMM YYYY H:mm A")}
              />

              <RowDetails
                label={i18n.t("profile-tabs.history-breakdown.paid")}
                value={`${transaction ? transaction.paid.toFixed(2) : ""} ${
                  config.CURRENCY
                }`}
              />
              <RowDetails
                label={i18n.t("profile-tabs.history-breakdown.savings")}
                value={`${
                  transaction
                    ? transaction.with_freebie
                      ? transaction.freebie_value.toFixed(2)
                      : transaction.discount.toFixed(2)
                    : ""
                } ${config.CURRENCY}`}
              />
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 16,
              }}
            >
              <Button
                color={theme.colors.icons.active}
                onPress={handleCloseModal}
                mode="contained"
                style={{ borderRadius: 10 }}
                buttonColor={theme.colors.icons.active}
              >
                {i18n.t("close")}
              </Button>
            </View>
          </View>
        </View>
      </CustomModal>
      <TouchableHighlight
        activeOpacity={0.9}
        underlayColor="#ddd"
        style={{ flex: 1, background: "red", padding: 15 }}
        onPress={() => handleOnItemPress(item.transaction_id)}
      >
        <View style={{ flex: 1, flexDirection: "row" }}>
          <View style={{ flex: 3 }}>
            <Label size={"caption"}>{item.merchant}</Label>
          </View>
          <View style={{ flex: 3, alignItems: "flex-end" }}>
            <Label size={"caption"}>
              {moment(item.date_transaction).format("DD.MMM YYYY")}
            </Label>
          </View>
          <View style={{ flex: 2, alignItems: "flex-end" }}>
            <Label size={"caption"}>
              {parseFloat(item.discount).toFixed(2)}
            </Label>
          </View>
        </View>
      </TouchableHighlight>
    </>
  );
};

const styles = StyleSheet.create({
  container: {},
});
