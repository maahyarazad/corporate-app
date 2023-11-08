import React, { useContext, useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import { TabItems } from "../utils/routes";
import { IconButton } from "react-native-paper";
import { useTheme } from "styled-components";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Alert, Dimensions, Image, Platform, View } from "react-native";
import { LocationContext } from "../services/location/location.context";
import { HomeNavigation } from "./homenavigation";
import { SpecialsScreen } from "./specials.screen";
import { EventsScreen } from "./events/events.screen";
import { ProfileScreen } from "./profile/profile.screen";
import { TranslationContext } from "../services/translation/translation.context";
import {
  PostStackNavigationScreen,
  PostTabsNavigationScreen,
} from "./posts/postNavigation.screen";
import useUser from "../../hooks/useUser";
import { Label } from "../components/typography/label.component";
import BottomSheetSelector from "../components/bottomSheetSelector.component";
import { TouchableWithoutFeedback } from "@gorhom/bottom-sheet";
import { useRoute } from "@react-navigation/native";
import {
  AndroidImportance,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  getExpoPushTokenAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
} from "expo-notifications";
import { navigate } from "../navigation/navigate";

import { NotificationsService } from "../services/notifications/notifications.service";
import * as SecureStorage from "expo-secure-store";

import { isDevice } from "expo-device";

const Tab = createMaterialTopTabNavigator();
// const Tab = createBottomTabNavigator();

export const EntertainerScreen = () => {
  const { i18n } = useContext(TranslationContext);
  const { userData } = useUser();

  useEffect(() => {
    const subscription = addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    const getPushToken = async () => {
      try {
        if (userData.userPushToken) {
          console.log("push token is available", userData.userPushToken);
          return;
        }

        console.log("push token is blank/invalid");
        registerForPushNotificationsAsync();
      } catch (error) {
        console.log(error);
      }
    };

    if (userData) getPushToken();

    return () => {
      subscription.remove();
    };
  }, [userData]);

  const registerForPushNotificationsAsync = async () => {
    try {
      const token = (await getExpoPushTokenAsync()).data;
      if (isDevice) {
        const { status: existingStatus } = await getPermissionsAsync();
        let finalStatus = existingStatus;
        console.log("notif a", existingStatus);
        if (existingStatus !== "granted") {
          console.log("notif b");
          const { status } = await requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== "granted") {
          console.log("notif c");
          // alert("Failed to get push token for push notification!");
          return;
        }

        console.log("notif d", token);
        const response = await NotificationsService.storePushToken(
          userData.user_id,
          token
        );
        if (!response.success) {
          Alert.alert(response.title, response.message);
        }
        // console.log("whattt");
        // console.log(user);
        await SecureStorage.setItemAsync("pushtoken", token);
      } else {
        alert("Must use physical device for Push Notifications");
      }

      if (Platform.OS === "android") {
        setNotificationChannelAsync("default", {
          name: "default",
          importance: AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }
    } catch (error) {
      console.error("Failed to get push token for push notification!", error);
    }
  };

  const handleNotificationResponse = (response) => {
    console.log("CHECKING NOTIF");
    const notificationData = response.notification.request.content.data;

    console.log("NOTIFICATION", notificationData);
    switch (notificationData.path) {
      case "partner":
        navigate("Location View", {
          locId: notificationData.id,
        });
        break;
      case "event":
        navigate("Event Detail", {
          id: notificationData.id,
        });
        break;
      case "post":
        navigate("post-detail", {
          id: notificationData.id,
        });
        break;
    }

    console.log(notificationData.path);
  };

  const TabItems = [
    {
      route: "Feed",
      component: PostTabsNavigationScreen,
      activeIcon: " ",
      inactiveIcon: "post",
      name: i18n.t("bottom-tabs.feed"),
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
    // {
    //   route: "Profile",
    //   component: ProfileScreen,
    //   activeIcon: " ",
    //   inactiveIcon: "account-circle",
    //   name: i18n.t("bottom-tabs.profile"),
    //   options: {
    //     headerShown: true,
    //     headerTitle: "",
    //     headerLeftContainerStyle: { paddingLeft: 16 },
    //     headerRightContainerStyle: { paddingRight: 4 },
    //     headerLeft: () => {
    //       return (
    //         <View style={{}}>
    //           <Image
    //             style={{
    //               height: 50,
    //               width: 100,
    //               resizeMode: "contain",
    //             }}
    //             source={require("../../assets/GE-LOGO-GOLD.png")}
    //           />
    //         </View>
    //       );
    //     },
    //     headerRight: () => {
    //       return (
    //         <HomeHeaderIconView>
    //           <Icon icon="headphones" />
    //           <Icon icon="emoticon-outline" />
    //           <Icon icon="heart-outline" />
    //           <Icon icon="bell-outline" />
    //         </HomeHeaderIconView>
    //       );
    //     },
    //   },
    // },
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
          lazy: true,
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
          //Hide Specific Tabs
          if (tab.route === "Events" && !eventList.length) return;

          {
            /* if (tab.route === "Feed" && userData && !userData.member) return; */
          }
          if (tab.route === "Feed" && true) return; //Disable Feed

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
