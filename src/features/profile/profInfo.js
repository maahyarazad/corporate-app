import React, { useContext } from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { Spacer } from "../../components/spacer/spacer.component";
import { Label } from "../../components/typography/label.component";
import { UserContext } from "../../services/user/user.context";
import moment from "moment";
import { genderEnum } from "../../utils/constants";
import { Button } from "react-native-paper";
import { AuthContext } from "../../services/auth/auth.context";

const { width } = Dimensions.get("window");
const labelWidth = width * (1 / 3);

export const ProfInfo = () => {
  const { userInfo } = useContext(UserContext);
  // console.log(userInfo);

  const RenderRow = ({ label, value }) => {
    return (
      <View style={styles.infoRow}>
        <View style={styles.label}>
          <Label style={{ color: "#999" }} size={"caption"} weight={"medium"}>
            {label}
          </Label>
        </View>
        <Spacer position={"left"} size={"small"} />
        <View style={styles.value}>
          <Label size={"body"} weight={"medium"}>
            {value}
          </Label>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ alignSelf: "stretch" }}
        contentContainerStyle={{
          paddingVertical: 16,
        }}
      >
        <RenderRow label={"Username"} value={`${userInfo.username}`} />
        <RenderRow label={"Email Address"} value={userInfo.email} />
        <RenderRow
          label={"Mobile Number"}
          value={`+${userInfo.area_code} ${userInfo.phone_number}`}
        />
        {userInfo.card_number != undefined && (
          <RenderRow
            label={"Card Number"}
            value={userInfo.card_number
              .toString()
              .replace(/.{4}/g, `$& `)
              .trim()}
          />
        )}
        {userInfo.card_valid_date != undefined && (
          <RenderRow
            label={"Validity Date"}
            value={moment(userInfo.card_valid_date).format("MM/YY")}
          />
        )}

        <RenderRow
          label={"Full Name"}
          value={`${userInfo.honorifics} ${userInfo.first_name} ${userInfo.middle_name} ${userInfo.last_name}`}
        />
        <RenderRow
          label={"Birthdate"}
          value={moment(userInfo.birthdate).format("LL")}
        />
        <RenderRow
          label={"Gender"}
          value={genderEnum[userInfo.gender.toLowerCase()]}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 8,
    backgroundColor: "#f8f8f8",
  },
  infoRow: {
    padding: 6,
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    flex: 1,
  },
  label: {
    width: labelWidth,
    alignItems: "flex-end",
    justifyContent: "flex-start",
    minHeight: 20,
  },
  value: {
    justifyContent: "flex-start",
    flex: 1,
    height: "100%",
    minHeight: 20,
  },
});
