import React, { useContext, useEffect, useState, useCallback } from "react";
import { Image, Platform, TouchableOpacity, View } from "react-native";
import { useTheme } from "styled-components/native";
import { showToast } from "../Toast";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useNavigation } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import * as Device from "expo-device";

import { LocationContext } from "../services/location/location.context";
import { TranslationContext } from "../services/translation/translation.context";
import { HomeNavigation } from "./homenavigation";
import { SpecialsScreen } from "./specials.screen";
import { EventsScreen } from "./events/events.screen";
import { PostTabsNavigationScreen } from "./posts/postNavigation.screen";
import useUser from "../../hooks/useUser";
import { Label } from "../components/typography/label.component";
import { navigate } from "../navigation/navigate";
import { NotificationsService } from "../services/notifications/notifications.service";
import { CacheImage } from "../components/cacheImage";
import { typeEnum } from "../utils/constants";
import { LogBox } from "react-native";

LogBox.ignoreLogs([
  'A props object containing a "key" prop is being spread into JSX',
]);
const Tab = createMaterialTopTabNavigator();

/**
 * REQUIRED:
 * This controls what happens when a push arrives while the app is OPEN.
 * Without this, you may receive the event but see no banner.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const EntertainerScreen = () => {
  const { i18n } = useContext(TranslationContext);
  const { userData } = useUser();
  const navigation = useNavigation();
  const theme = useTheme();
  const { eventList } = useContext(LocationContext);

  const [hasNotification, setHasNotification] = useState(false);

  const handleNotificationResponse = useCallback((response) => {
    // console.log("CHECKING NOTIF RESPONSE");

    const notificationData =
      response?.notification?.request?.content?.data || {};
    // console.log("NOTIFICATION DATA:", notificationData);

    const path = notificationData?.path;
    const id = notificationData?.id;

    if (!path) return;

    switch (path) {
      case "partner":
        navigate("Location View", { locId: id });
        break;

      case "event":
        navigate("Event Detail", { id });
        break;

      case "post":
        navigate("post-detail", {
          id,
          origin: "push",
        });
        break;

      default:
        // console.log("Unhandled notification path:", path);
        break;
    }
  }, []);

  useEffect(() => {
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        handleNotificationResponse(response);
      });

    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        // console.log("incoming foreground notification", notification);
        setHasNotification(true);
      }
    );

    // Handles the case where app was opened by tapping a notification
    // while previously closed/backgrounded.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationResponse(response);
      }
    });

    return () => {
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  }, [handleNotificationResponse]);

  useEffect(() => {
    if (!userData) return;
    // changeHeaderRight(userData?.member === 1 ? "Feed" : "Home");
    changeHeaderRight(userData?.member === 1 ? "Home" : "Home");
  }, [userData, hasNotification]);

  useEffect(() => {
    if (!userData?.user_id) return;

    let isMounted = true;

    const getPushToken = async () => {
      try {
        if (!isMounted) return;
        await registerForPushNotificationsAsync();
      } catch (error) {
        console.log("Failed to register push notifications:", error);
      }
    };

    getPushToken();

    return () => {
      isMounted = false;
    };
  }, [userData?.user_id]);

  const registerForPushNotificationsAsync = async () => {
    try {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }

      if (!Device.isDevice) {
        throw new Error("Push notifications require a physical device");
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        throw new Error("Permission not granted for push notifications");
      }

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      if (!projectId) {
        throw new Error("Missing EAS projectId");
      }

      const expoPushToken = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      const token = expoPushToken?.data;

      if (!token) {
        throw new Error("Failed to obtain Expo push token");
      }

      // console.log("Expo push token:", token);
      // console.log("User Id:", userData.user_id);

      const response = await NotificationsService.storePushToken(
        userData.user_id,
        {
          token,
          provider: "expo",
          platform: Platform.OS,
        }
      );

      if (!response?.success) {
        showToast(
          "error",
          response?.title || "Error",
          response?.message || "Failed to store push token"
        );
        return null;
      }

      await SecureStore.setItemAsync("pushtoken", token);
      return token;
    } catch (error) {
      console.log("Failed to register for push notifications:", error);
      showToast(
        "error",
        "Push notification setup failed",
        error?.message || "Unknown error"
      );
      return null;
    }
  };

  const changeHeaderRight = (route) => {
    const handleSearch = () => {
      switch (route) {
        case "Feed":
          navigate("post-search");
          break;
        case "Home":
        default:
          navigate("LocationList", {
            type: typeEnum.category,
            search: 0,
            page: 1,
            limit: 100,
            source: 2,
            headerTitle: i18n.t("search-all"),
            focus: true,
          });
          break;
      }
    };

    navigation.setOptions({
      headerRight: () => (
        <View
          style={{
            width: "100%",
            flexDirection: "row",
            alignContent: "center",
            justifyContent: "flex-end",
            paddingRight: 4,
          }}
        >
          <Label
            style={{
              paddingRight: 8,
              textAlign: "right",
              alignSelf: "center",
            }}
            numberOfLines={1}
            size="subtitle"
            weight="bold"
          >
            {i18n.t("user_greeting", {
              name: userData ? userData.first_name?.split(" ")[0] : "",
            })}
          </Label>

          <View
            style={{
              flexDirection: "row",
              gap: 4,
              alignSelf: "center",
            }}
          >
            <TouchableOpacity onPress={handleSearch}>
              <View
                style={{
                  width: 30,
                  aspectRatio: 1,
                  justifyContent: "flex-end",
                  alignItems: "flex-end",
                }}
              >
                <MaterialCommunityIcons name="magnify" size={30} />
              </View>
            </TouchableOpacity>

            {route === "Home" && (
              <TouchableOpacity onPress={() => navigate("Map")}>
                <View
                  style={{
                    width: 28,
                    marginRight: 5,
                    justifyContent: "flex-end",
                    alignItems: "flex-end",
                  }}
                >
                  <MaterialCommunityIcons name="map-search" size={28} />
                </View>
              </TouchableOpacity>
            )}

            {userData.member === 1 && (
              <TouchableOpacity
                onPress={() => {
                  setHasNotification(false);
                  navigate("notifications");
                }}
              >
                <View
                  style={{
                    width: 28,
                    marginRight: 5,
                    justifyContent: "flex-end",
                    alignItems: "flex-end",
                  }}
                >
                  <MaterialCommunityIcons name="bell-outline" size={28} />
                </View>

                {hasNotification && (
                  <View
                    style={{
                      position: "absolute",
                      top: 2,
                      right: 6,
                      backgroundColor: "red",
                      borderRadius: 25,
                      width: 10,
                      aspectRatio: 1,
                    }}
                  />
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => navigate("Profile")}>
              {userData && userData.member_image ? (
                <View style={{ borderRadius: 25, overflow: "hidden" }}>
                  <CacheImage
                    style={{ width: 30, aspectRatio: 1 }}
                    uri={userData.member_image}
                  />
                </View>
              ) : (
                <MaterialCommunityIcons name="account-circle" size={30} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      ),
    });
  };

  const TabItems = React.useMemo(
    () => [
      // {
      //   route: "Feed",
      //   component: PostTabsNavigationScreen,
      //   activeIcon: " ",
      //   inactiveIcon: "post",
      //   name: i18n.t("bottom-tabs.feed"),
      // },
      {
        route: "Home",
        component: HomeNavigation,
        activeIcon: "",
        inactiveIcon: "home",
        name: i18n.t("bottom-tabs.home"),
      },
      {
        route: "Offers",
        component: SpecialsScreen,
        activeIcon: " ",
        inactiveIcon: "tag-multiple",
        name: i18n.t("bottom-tabs.offers"),
      },
      {
        route: "Events",
        component: EventsScreen,
        activeIcon: " ",
        inactiveIcon: "calendar-month",
        name: i18n.t("bottom-tabs.events"),
      },
    ],
    [i18n]
  );

  const visibleTabs = TabItems.filter((tab) => {
    return true;
    if (tab.route === "Events" && !eventList.length) return false;
    //   if (tab.route === "Feed" && userData && !userData.member) return false;
    return true;
  });

  return (
    <Tab.Navigator
      tabBarPosition="bottom"
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
      {visibleTabs.map((tab) => (
        <Tab.Screen
          key={tab.route}
          name={tab.route}
          component={tab.component}
          listeners={{
            tabPress: () => {
              changeHeaderRight(tab.route);
            },
          }}
          options={{
            tabBarLabel: tab.name,
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: "bold",
            },
            tabBarStyle: {
              height: Platform.OS === "ios" ? "10%" : "auto",
            },
            tabBarIcon: ({ focused }) => (
              <MaterialCommunityIcons
                name={tab.inactiveIcon}
                size={30}
                color={
                  focused
                    ? theme.colors.icons.active
                    : theme.colors.icons.inactive
                }
              />
            ),
            tabBarActiveTintColor: theme.colors.icons.active,
          }}
        />
      ))}
    </Tab.Navigator>
  );
};
