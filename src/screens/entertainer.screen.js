import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  Dimensions,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
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
import { resolvePushDestination } from "../utils/pushDestination";
import { LogBox } from "react-native";

LogBox.ignoreLogs([
  'A props object containing a "key" prop is being spread into JSX',
]);
const Tab = createMaterialTopTabNavigator();

// Bounds the de-duplication set below. It only needs to span the cold-start
// replay window, where getLastNotificationResponseAsync and the live listener
// can both deliver the same tap.
const MAX_HANDLED_NOTIFICATION_IDS = 50;

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

// Module scope: none of these depend on props, state or theme, and Platform.OS
// cannot change at runtime. Declaring them here keeps their identity stable
// instead of minting fresh objects on every render.
const TAB_NAVIGATOR_SCREEN_OPTIONS = {
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
};

const TAB_BAR_LABEL_STYLE = {
  fontSize: 10,
  fontWeight: "bold",
};

const TAB_BAR_STYLE = {
  height: Platform.OS === "ios" ? "10%" : "auto",
};

// react-native-tab-view starts at { width: 0 }, renders only the focused page
// absolutely filled, then re-renders every page at the measured width once
// onLayout arrives. On Android those pages live inside a ViewPager2, and that
// second pass makes it re-measure and re-settle its scroll offset - a visible
// horizontal slide, replayed every time the native tree is rebuilt. Handing the
// pager the width up front collapses the two passes into one. The app is locked
// to portrait (app.json), so a module constant is the right lifetime here.
const INITIAL_TAB_LAYOUT = { width: Dimensions.get("window").width };

const styles = StyleSheet.create({
  headerRight: {
    width: "100%",
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "flex-end",
    paddingRight: 4,
  },
  greeting: {
    paddingRight: 8,
    textAlign: "right",
    alignSelf: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 4,
    alignSelf: "center",
  },
  searchIcon: {
    width: 30,
    aspectRatio: 1,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  actionIcon: {
    width: 28,
    marginRight: 5,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  unreadDot: {
    position: "absolute",
    top: 2,
    right: 6,
    backgroundColor: "red",
    borderRadius: 25,
    width: 10,
    aspectRatio: 1,
  },
  avatarClip: {
    borderRadius: 25,
    overflow: "hidden",
  },
  avatar: {
    width: 30,
    aspectRatio: 1,
  },
});

export const EntertainerScreen = () => {
  const { i18n } = useContext(TranslationContext);
  const { userData } = useUser();
  const navigation = useNavigation();
  const theme = useTheme();
  const { eventList } = useContext(LocationContext);

  const [hasNotification, setHasNotification] = useState(false);

  // A single tap must produce exactly one navigation: on a cold start the
  // one-shot getLastNotificationResponseAsync replay and the live listener can
  // both fire for the same notification.
  //
  // Capped: the set only has to out-live the cold-start replay window, so the
  // most recent handful of ids is enough. Uncapped it grew for the lifetime of
  // the process. A Set preserves insertion order, so the oldest entry is the
  // first key.
  const handledNotificationIds = useRef(new Set());

  const handleNotificationResponse = useCallback((response) => {
    const notificationId = response?.notification?.request?.identifier;

    if (notificationId) {
      if (handledNotificationIds.current.has(notificationId)) {
        return;
      }
      handledNotificationIds.current.add(notificationId);

      if (handledNotificationIds.current.size > MAX_HANDLED_NOTIFICATION_IDS) {
        const oldest = handledNotificationIds.current.values().next().value;
        handledNotificationIds.current.delete(oldest);
      }
    }

    const notificationData =
      response?.notification?.request?.content?.data || {};

    if (__DEV__) {
      console.log(
        "[push] raw notification data:",
        JSON.stringify(notificationData)
      );
    }

    const destination = resolvePushDestination(notificationData);

    // An unresolvable payload is a no-op: the app stays on its default screen.
    // resolvePushDestination has already logged the diagnostic in dev builds.
    if (!destination) return;

    navigate(destination.screen, destination.params);
  }, []);

  useEffect(() => {
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse
      );

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

  const registerForPushNotificationsAsync = useCallback(async () => {
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
  }, [userData?.user_id]);

  useEffect(() => {
    if (!userData?.user_id) return;

    const getPushToken = async () => {
      try {
        await registerForPushNotificationsAsync();
      } catch (error) {
        console.log("Failed to register push notifications:", error);
      }
    };

    getPushToken();
  }, [userData?.user_id, registerForPushNotificationsAsync]);

  const handleSearch = useCallback(
    (route) => {
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
    },
    [i18n]
  );

  const openNotifications = useCallback(() => {
    setHasNotification(false);
    navigate("notifications");
  }, []);

  const openMap = useCallback(() => navigate("Map"), []);
  const openProfile = useCallback(() => navigate("Profile"), []);

  const changeHeaderRight = useCallback(
    (route) => {
      navigation.setOptions({
        headerRight: () => (
          <View style={styles.headerRight}>
            <Label
              style={styles.greeting}
              numberOfLines={1}
              size="subtitle"
              weight="bold"
            >
              {i18n.t("user_greeting", {
                name: userData ? userData.first_name?.split(" ")[0] : "",
              })}
            </Label>

            <View style={styles.actions}>
              <TouchableOpacity onPress={() => handleSearch(route)}>
                <View style={styles.searchIcon}>
                  <MaterialCommunityIcons name="magnify" size={30} />
                </View>
              </TouchableOpacity>

              {route === "Home" && (
                <TouchableOpacity onPress={openMap}>
                  <View style={styles.actionIcon}>
                    <MaterialCommunityIcons name="map-search" size={28} />
                  </View>
                </TouchableOpacity>
              )}

              {userData?.member === 1 && (
                <TouchableOpacity onPress={openNotifications}>
                  <View style={styles.actionIcon}>
                    <MaterialCommunityIcons name="bell-outline" size={28} />
                  </View>

                  {hasNotification && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={openProfile}>
                {userData && userData.member_image ? (
                  <View style={styles.avatarClip}>
                    <CacheImage
                      style={styles.avatar}
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
    },
    [
      navigation,
      i18n,
      userData,
      hasNotification,
      handleSearch,
      openMap,
      openNotifications,
      openProfile,
    ]
  );

  // useLayoutEffect, not useEffect: setOptions has to land in the same commit
  // that mounts the screen, otherwise the header paints once without the right
  // side and then again with it.
  useLayoutEffect(() => {
    if (!userData) return;
    // changeHeaderRight(userData?.member === 1 ? "Feed" : "Home");
    changeHeaderRight(userData?.member === 1 ? "Home" : "Home");
  }, [userData, hasNotification, changeHeaderRight]);

  // The tab children below must not depend on changeHeaderRight. Its identity
  // turns over whenever userData or hasNotification changes - a single incoming
  // notification is enough - and a new children array makes react-navigation
  // re-read every screen config and re-render the entire TabView underneath.
  // The listener reaches the current version through this ref instead.
  const changeHeaderRightRef = useRef(changeHeaderRight);

  useEffect(() => {
    changeHeaderRightRef.current = changeHeaderRight;
  }, [changeHeaderRight]);

  const handleTabPress = useCallback((route) => {
    changeHeaderRightRef.current(route);
  }, []);

  const TabItems = useMemo(
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

  const visibleTabs = useMemo(
    () =>
      TabItems.filter((tab) => {
        return true;
        if (tab.route === "Events" && !eventList.length) return false;
        //   if (tab.route === "Feed" && userData && !userData.member) return false;
        return true;
      }),
    [TabItems, eventList]
  );

  const renderTabIcon = useCallback(
    (iconName) =>
      ({ focused }) => (
        <MaterialCommunityIcons
          name={iconName}
          size={30}
          color={
            focused ? theme.colors.icons.active : theme.colors.icons.inactive
          }
        />
      ),
    [theme]
  );

  const tabScreens = useMemo(
    () =>
      visibleTabs.map((tab) => (
        <Tab.Screen
          key={tab.route}
          name={tab.route}
          component={tab.component}
          listeners={{
            tabPress: () => {
              handleTabPress(tab.route);
            },
          }}
          options={{
            tabBarLabel: tab.name,
            tabBarLabelStyle: TAB_BAR_LABEL_STYLE,
            tabBarStyle: TAB_BAR_STYLE,
            tabBarIcon: renderTabIcon(tab.inactiveIcon),
            tabBarActiveTintColor: theme.colors.icons.active,
          }}
        />
      )),
    [visibleTabs, handleTabPress, renderTabIcon, theme]
  );

  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      initialLayout={INITIAL_TAB_LAYOUT}
      screenOptions={TAB_NAVIGATOR_SCREEN_OPTIONS}
    >
      {tabScreens}
    </Tab.Navigator>
  );
};
