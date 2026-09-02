import React from "react";
import { StyleSheet, View } from "react-native";
import { Label } from "../../components/typography/label.component";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { ProfInfo } from "./profInfo";
import { ProfSettings as ProfSettings } from "./profSettings";
import { ProfRedeemHistory } from "./profRedeemHistory";
import { Fontisto, MaterialCommunityIcons } from "@expo/vector-icons";
import { i18n } from "../../services/translation/translation.context";
import { fontSizes } from "../../infrastructure/theme/fonts";

const ProfileTab = createMaterialTopTabNavigator();

export const ProfTabs = () => {
  const CustomLabel = ({ label, icon }) => {
    return (
      <View style={styles.rowCenter}>
        {icon}
      
        <Label size="caption" weight="bold" style={{marginLeft: 4, fontSize: fontSizes.tab_title}}>
          {label}
        </Label>
      </View>
    );
  };

  return (
    <ProfileTab.Navigator
      style={styles.profileTabNavigator}
      screenOptions={{
        tabBarPressColor: "transparent",
        lazy: true,
        tabBarIndicatorStyle: {
          height: "115%",
          backgroundColor: "white",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          shadowOpacity: 0.4,
          // shadowRadius: 10,
          // shadowOffset: {
          //   height: -5,
          // },
          elevation: 5,
        },
        tabBarStyle: {
          backgroundColor: "#ccc",
          borderTopWidth: 2,
          borderColor: "#bbb",
        },
      }}
    >
      <ProfileTab.Screen
        name="ProfInfo"
        options={{
          tabBarActiveTintColor: "white",
          tabBarLabel: () => {
            return (
              <CustomLabel
                icon={<MaterialCommunityIcons size={20} name="account" />}
                label={i18n.t("profile-tabs.user-profile")}
              />
            );
          },
          // tabBarIcon: () => <MaterialCommunityIcons name="account" />,
        }}
        component={ProfInfo}
      />

      <ProfileTab.Screen
        name="ProfRedeem"
        options={{
          tabBarLabel: () => {
            return (
              <CustomLabel
                icon={<Fontisto size={20} name="dollar" />}
                label={i18n.t("profile-tabs.savings")}
              />
            );
          },
        }}
        component={ProfRedeemHistory}
      />
      <ProfileTab.Screen
        name="ProfSettings"
        options={{
          tabBarLabel: () => {
            return (
              <CustomLabel
                icon={<MaterialCommunityIcons size={20} name="cog" />}
                label={i18n.t("profile-tabs.settings")}
              />
            );
          },
        }}
        component={ProfSettings}
      />
    </ProfileTab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {},
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileTabNavigator: {
    height: "100%",
    marginTop: 20,
    overflow: "visible",
  },
});
