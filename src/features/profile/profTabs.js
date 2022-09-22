import React from "react";
import { StyleSheet, View } from "react-native";
import { Label } from "../../components/typography/label.component";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { ProfInfo } from "./profInfo";
import { ProfSettings as ProfSettings } from "./profSettings";
import { ProfRedeemHistory } from "./profRedeemHistory";
import { Fontisto, MaterialCommunityIcons } from "@expo/vector-icons";
import { Spacer } from "../../components/spacer/spacer.component";

const ProfileTab = createMaterialTopTabNavigator();

export const ProfTabs = () => {
  const CustomLabel = ({ label, icon }) => {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {icon}
        <Spacer position={"left"} size="small" />
        <Label size={"caption"} weight={"bold"}>
          {label}
        </Label>
      </View>
    );
  };

  return (
    <ProfileTab.Navigator
      style={{
        height: "100%",
        marginTop: 20,
        overflow: "visible",
      }}
      screenOptions={{
        tabBarPressColor: "transparent",
        lazy: true,
        tabBarIndicatorStyle: {
          height: "130%",
          backgroundColor: "white",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          shadowOpacity: 0.4,
          // shadowRadius: 10,
          // shadowOffset: {
          //   height: -5,
          // },
          elevation: 10,
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
                label={"User Profile"}
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
                label={"Savings"}
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
                label={"Settings"}
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
});
