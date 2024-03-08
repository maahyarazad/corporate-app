import React, { useContext } from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { Spacer } from "../../components/spacer/spacer.component";
import { Label } from "../../components/typography/label.component";
import { UserContext } from "../../services/user/user.context";
import moment from "moment";
import { genderEnum } from "../../utils/constants";
import { Button } from "react-native-paper";
import { AuthContext } from "../../services/auth/auth.context";
import { TranslationContext } from "../../services/translation/translation.context";
import useUser from "../../../hooks/useUser";
import useAuth from "../../../hooks/useAuth";

const { width } = Dimensions.get("window");
const labelWidth = width * (1 / 3);

export const ProfInfo = () => {
  const { userData } = useUser();
  const { isSkip } = useAuth();
  const { i18n } = useContext(TranslationContext);
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
        {!!isSkip && (
          <View
            style={{
              alignItems: "center",
              marginBottom: 16,
              paddingHorizontal: 32,
            }}
          >
            <Label
              style={{ fontStyle: "italic", color: "red", textAlign: "center" }}
            >
              {`Da Sie keine gültige MemberCard hochgeladen haben, können Sie nicht auf bestimmte App-Funktionen zugreifen. Bitte besorgen Sie sich eine MemberCard. \n\nBitte kontaktieren Sie die GEC Hotline : 00971.56 20 500 66 um Ihre (gültige) MemberCard zu erhalten!`}
            </Label>
          </View>
        )}
        <RenderRow
          label={i18n.t("profile-tabs.profile.username")}
          value={`${userData?.username}`}
        />
        <RenderRow
          label={i18n.t("profile-tabs.profile.email")}
          value={userData?.email}
        />
        <RenderRow
          label={i18n.t("profile-tabs.profile.mobile")}
          value={`+${userData?.area_code} ${userData?.phone_number}`}
        />
        {/* {console.log("CARD NUMBER:", userInfo.card_number)} */}
        {!!userData?.card_number &&
          userData?.card_number.trim() != "" &&
          userData?.card_number != "" && (
            <RenderRow
              label={"Card Number"}
              value={userData?.card_number
                ?.toString()
                .replace(/.{4}/g, `$& `)
                .trim()}
            />
          )}
        {!!userData?.expiry && (
          <>
            {/* <Label>{userInfo.card_valid_date}</Label> */}
            <RenderRow
              label={"Validity Date"}
              value={moment(userData?.expiry).format("MM/YY")}
            />
          </>
        )}

        {userData?.partner_name != undefined &&
          userData.partner_name?.trim() != "" && (
            <RenderRow
              label={i18n.t("profile-tabs.profile.partner")}
              value={userData?.partner_name}
            />
          )}

        <RenderRow
          label={i18n.t("profile-tabs.profile.name")}
          value={`${userData?.honorifics} ${userData?.first_name}${
            !!userData?.middlename ? ` ${userData?.middle_name} ` : " "
          }${userData?.last_name}`}
        />
        <RenderRow
          label={i18n.t("profile-tabs.profile.birthdate")}
          value={moment(userData?.birthdate).format("LL")}
        />
        <RenderRow
          label={i18n.t("profile-tabs.profile.gender")}
          value={
            userData?.gender?.toLowerCase() === "m"
              ? i18n.t("gender.male")
              : i18n.t("gender.female")
          }
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
