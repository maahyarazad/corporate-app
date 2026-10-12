import React, {
  memo,
  useContext,
  useEffect,
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
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "styled-components/native";
import { showToast } from "../Toast";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import * as Device from "expo-device";

import { TranslationContext } from "../services/translation/translation.context";
import { HomeNavigation } from "./homenavigation";
import { SpecialsScreen } from "./specials.screen";
import { EventsScreen } from "./events/events.screen";
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

// Content height of the header, below the status bar. The native stack could
// not give us this: native-stack forwards only backgroundColor from
// headerStyle to the native UINavigationBar, so height/minHeight set there
// are dropped before they reach it.
const HEADER_HEIGHT = 60;

const headerLogoSource = require("../../assets/GE-LOGO-GOLD.png");

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  headerContainer: {
    width: "100%",
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "flex-start",
    paddingRight: 10,
  },
  headerRight: {
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "flex-end",
    paddingRight: 10,
  },
  logo: {
    height: 40,
    width: 80,
    resizeMode: "contain",
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

// Split out and memoized so header state (headerRoute, hasNotification) and
// pager state stop re-rendering each other.
//
// The props are primitives, not the userData object: userData's identity turns
// over on every write to the user context, while the two fields the header
// actually reads change almost never. Passing the fields is what keeps the memo
// from being defeated on arrival.
const EntertainerHeader = memo(function EntertainerHeader({
  containerStyle,
  greeting,
  memberImage,
  isMember,
  hasNotification,
  showMapAction,
  onLogoPress,
  onSearchPress,
  onMapPress,
  onNotificationsPress,
  onProfilePress,
}) {
  return (
    <View style={containerStyle}>
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onLogoPress}>
            <Image style={styles.logo} source={headerLogoSource} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <Label
            style={styles.greeting}
            numberOfLines={1}
            size="subtitle"
            weight="bold"
          >
            {greeting}
          </Label>

          <View style={styles.actions}>
            <TouchableOpacity onPress={onSearchPress}>
              <View style={styles.searchIcon}>
                <MaterialCommunityIcons name="magnify" size={30} />
              </View>
            </TouchableOpacity>

            {showMapAction && (
              <TouchableOpacity onPress={onMapPress}>
                <View style={styles.actionIcon}>
                  <MaterialCommunityIcons name="map-search" size={28} />
                </View>
              </TouchableOpacity>
            )}

            {isMember && (
              <TouchableOpacity onPress={onNotificationsPress}>
                <View style={styles.actionIcon}>
                  <MaterialCommunityIcons name="bell-outline" size={28} />
                </View>

                {hasNotification && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={onProfilePress}>
              {memberImage ? (
                <View style={styles.avatarClip}>
                  <CacheImage style={styles.avatar} uri={memberImage} />
                </View>
              ) : (
                <MaterialCommunityIcons name="account-circle" size={30} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
});

export const EntertainerScreen = () => {
  const { i18n } = useContext(TranslationContext);
  const { userData } = useUser();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  // Depend on the colours, not the theme object: a new theme identity with
  // unchanged colours would otherwise rebuild every tab screen.
  const activeIconColor = theme.colors.icons.active;
  const inactiveIconColor = theme.colors.icons.inactive;

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
  const navigateHome = useCallback(() => {
    navigate("Home");
  }, []);

  // The header is rendered by this screen now, not by the native stack
  // (headerShown: false in navigation.js). Owning it in JS is what makes
  // HEADER_HEIGHT real, and it keeps the bar out of the Liquid Glass treatment
  // iOS 26 applies to UINavigationBar.
  const [headerRoute, setHeaderRoute] = useState("Home");

  // setHeaderRoute comes from useState, so this callback's identity is stable
  // for the life of the screen. That matters: the tab children below must not
  // depend on anything whose identity turns over when userData or
  // hasNotification changes - one incoming notification is enough - because a
  // new children array makes react-navigation re-read every screen config and
  // re-render the entire TabView underneath.
  const handleTabPress = useCallback((route) => {
    setHeaderRoute(route);
  }, []);

  const headerContainerStyle = useMemo(
    () => [
      styles.header,
      { paddingTop: insets.top, height: HEADER_HEIGHT + insets.top },
    ],
    [insets.top]
  );

  const greeting = useMemo(
    () =>
      i18n.t("user_greeting", {
        name: userData ? userData.first_name?.split(" ")[0] : "",
      }),
    [i18n, userData]
  );

  // Was an inline arrow in the header JSX, so it minted a new onPress - and a
  // new TouchableOpacity props object - on every render of the screen.
  const openSearch = useCallback(
    () => handleSearch(headerRoute),
    [handleSearch, headerRoute]
  );

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

  // The filter this used to run returned true unconditionally - the two rules
  // below it were unreachable - but it still listed eventList as a dependency.
  // Every write to the location context therefore produced a new array, which
  // rebuilt tabScreens, which re-rendered the whole TabView. Restoring either
  // rule means reinstating the filter and the eventList dependency with it.
  //
  //   if (tab.route === "Events" && !eventList.length) return false;
  //   if (tab.route === "Feed" && userData && !userData.member) return false;
  const visibleTabs = TabItems;

  const renderTabIcon = useCallback(
    (iconName) =>
      ({ focused }) => (
        <MaterialCommunityIcons
          name={iconName}
          size={30}
          color={focused ? activeIconColor : inactiveIconColor}
        />
      ),
    [activeIconColor, inactiveIconColor]
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
            tabBarActiveTintColor: activeIconColor,
          }}
        />
      )),
    [visibleTabs, handleTabPress, renderTabIcon, activeIconColor]
  );

  // The pager is the expensive subtree on this screen. Holding its element
  // identity steady lets React skip it entirely when only header state moved.
  const tabNavigator = useMemo(
    () => (
      <Tab.Navigator
        tabBarPosition="bottom"
        initialLayout={INITIAL_TAB_LAYOUT}
        screenOptions={TAB_NAVIGATOR_SCREEN_OPTIONS}
      >
        {tabScreens}
      </Tab.Navigator>
    ),
    [tabScreens]
  );

  return (
    <View style={styles.screen}>
      <EntertainerHeader
        containerStyle={headerContainerStyle}
        greeting={greeting}
        memberImage={userData?.member_image}
        isMember={userData?.member === 1}
        hasNotification={hasNotification}
        showMapAction={headerRoute === "Home"}
        onLogoPress={navigateHome}
        onSearchPress={openSearch}
        onMapPress={openMap}
        onNotificationsPress={openNotifications}
        onProfilePress={openProfile}
      />

      {tabNavigator}
    </View>
  );
};
