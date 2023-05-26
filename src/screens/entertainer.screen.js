import React, { useContext } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import { TabItems } from "../utils/routes";
import { IconButton } from "react-native-paper";
import { useTheme } from "styled-components";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Image, Platform, View } from "react-native";
import { LocationContext } from "../services/location/location.context";
import { HomeNavigation } from "./homenavigation";
import { SpecialsScreen } from "./specials.screen";
import { EventsScreen } from "./events/events.screen";
import { ProfileScreen } from "./profile/profile.screen";
import { TranslationContext } from "../services/translation/translation.context";

const Tab = createMaterialTopTabNavigator();
// const Tab = createBottomTabNavigator();

export const EntertainerScreen = () => {
  const { i18n } = useContext(TranslationContext);
  const TabItems = [
    {
      route: "Home",
      // component: TransactionSummaryScreen,
      component: HomeNavigation,
      activeIcon: "",
      inactiveIcon: "home",
      name: i18n.t("bottom-tabs.home"),
      options: {
        headerShown: false,
      },
    },
    {
      route: "Offers",
      component: SpecialsScreen,
      activeIcon: " ",
      inactiveIcon: "tag-multiple",
      name: i18n.t("bottom-tabs.offers"),
      options: {
        headerShown: true,
        headerTitle: "2",
        headerLeftContainerStyle: { paddingLeft: 16 },
        headerRightContainerStyle: { paddingRight: 4 },

        headerLeft: () => {
          return (
            <View>
              <Image
                style={{
                  height: 50,
                  width: 100,
                  resizeMode: "contain",
                }}
                source={require("../../assets/GE-LOGO-GOLD.png")}
              />
            </View>
          );
        },
      },
    },
    {
      route: "Events",
      component: EventsScreen,
      activeIcon: " ",
      inactiveIcon: "calendar-month",
      name: i18n.t("bottom-tabs.events"),
      options: {
        headerShown: true,
        headerTitle: "2",
        headerLeftContainerStyle: { paddingLeft: 16 },
        headerRightContainerStyle: { paddingRight: 4 },
        headerLeft: () => {
          return (
            <View style={{}}>
              <Image
                style={{
                  height: 50,
                  width: 100,
                  resizeMode: "contain",
                }}
                source={require("../../assets/GE-LOGO-GOLD.png")}
              />
            </View>
          );
        },
      },
    },
    {
      route: "Profile",
      component: ProfileScreen,
      activeIcon: " ",
      inactiveIcon: "account-circle",
      name: i18n.t("bottom-tabs.profile"),
      options: {
        headerShown: true,
        headerTitle: "",
        headerLeftContainerStyle: { paddingLeft: 16 },
        headerRightContainerStyle: { paddingRight: 4 },

        headerLeft: () => {
          return (
            <View style={{}}>
              <Image
                style={{
                  height: 50,
                  width: 100,
                  resizeMode: "contain",
                }}
                source={require("../../assets/GE-LOGO-GOLD.png")}
              />
            </View>
          );
        },
        headerRight: () => {
          return (
            <HomeHeaderIconView>
              <Icon icon="headphones" />
              <Icon icon="emoticon-outline" />
              <Icon icon="heart-outline" />
              <Icon icon="bell-outline" />
            </HomeHeaderIconView>
          );
        },
      },
    },
  ];

  const theme = useTheme();
  const { eventList } = useContext(LocationContext);
  return (
    <>
      {/* <View
        style={{
          backgroundColor: "white",
          height: "10%",
          alignItems: "flex-end",
          paddingHorizontal: 16,
          flexDirection: "row",
        }}
      >
        <View style={{ flex: 1 }}>
          <Image
            style={{
              height: 50,
              width: 100,
              resizeMode: "contain",
            }}
            source={require("../../assets/ifza-icon-black.png")}
          />
        </View>
        <View style={{ flex: 1 }}>
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "flex-start",
            }}
          >
            <IconButton icon="headphones" />
            <IconButton icon="emoticon-outline" />
            <IconButton icon="heart-outline" />
            <IconButton icon="bell-outline" />
          </View>
        </View>
      </View> */}
      <Tab.Navigator
        tabBarPosition="bottom"
        showPageIndicator={true}
        screenOptions={{
          tabBarItemStyle: {
            paddingTop: 6,
            margin: 0,
          },
          tabBarIndicatorStyle: {
            color: "transparent",
            backgroundColor: "transparent",
          },
          tabBarIconStyle: {
            width: 30,
            height: 30,
            alignItems: "center",
          },
          tabBarInactiveTintColor: "#999",
          tabBarStyle: { backgroundColor: "red" },
        }}
      >
        {TabItems.map((tab, index) => {
          if (tab.route === "Events" && !eventList.length) return;
          return (
            <Tab.Screen
              key={index}
              name={tab.route}
              component={tab.component}
              // options={TabItems[index].options}

              options={{
                tabBarLabel: tab.name,
                tabBarLabelStyle: {
                  fontSize: 10,
                  fontWeight: "bold",
                },
                tabBarStyle: {
                  // marginBottom: 10,
                  // backgroundColor: "red",
                  height: Platform.OS === "ios" ? "10%" : "auto",
                },
                // tabBarItemStyle: {
                //   paddingBottom: 6,
                // },
                tabBarIcon: ({ focused }) => {
                  return (
                    <MaterialCommunityIcons
                      name={tab.inactiveIcon}
                      size={30}
                      color={
                        focused
                          ? theme.colors.icons.active
                          : theme.colors.icons.inactive
                      }
                    />
                  );
                },

                tabBarActiveTintColor: theme.colors.icons.active,
              }}
            />
          );
        })}
      </Tab.Navigator>
    </>
  );
};
