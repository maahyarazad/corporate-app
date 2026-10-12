import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Label } from "../../components/typography/label.component";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { ProfInfo } from "./profInfo";
import { ProfSettings as ProfSettings } from "./profSettings";
import { ProfRedeemHistory } from "./profRedeemHistory";
import { Fontisto, MaterialCommunityIcons } from "@expo/vector-icons";
import { i18n } from "../../services/translation/translation.context";
import { fontSizes } from "../../infrastructure/theme/fonts";

const ProfileTab = createMaterialTopTabNavigator();

// The static half of screenOptions. Hoisted so only the one inset-dependent
// key has to be rebuilt when the safe area changes.
const BASE_SCREEN_OPTIONS = {
  tabBarPressColor: "transparent",
  lazy: true,
  tabBarIndicatorStyle: {
    height: "115%",
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowOpacity: 0.4,
    elevation: 5,
  },
  tabBarStyle: {
    backgroundColor: "#ccc",
    borderTopWidth: 2,
    borderColor: "#bbb",
  },
};

export const ProfTabs = () => {
  // profile.screen.js drops the bottom safe-area edge so the screen runs to the
  // bottom of the display. The inset comes back here instead, as padding on the
  // scene container, so the last row of each tab's scrollable content clears
  // the home indicator and the gesture bar rather than sitting under them.
  //
  // Applied once via screenOptions rather than in all three tab screens, and
  // memoized because a fresh object would re-render every scene. Note the prop
  // is `sceneStyle` and it lives in screenOptions - React Navigation 7 renamed
  // it from the v6 `sceneContainerStyle` navigator prop, which this version
  // ignores silently.
  const insets = useSafeAreaInsets();

  const screenOptions = useMemo(
    () => ({
      ...BASE_SCREEN_OPTIONS,
      sceneStyle: { paddingBottom: insets.bottom },
    }),
    [insets.bottom]
  );

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
      screenOptions={screenOptions}
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
