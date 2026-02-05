import React, { useCallback, useContext, useEffect, useState } from "react";
// import { TabItems } from "../utils/routes";
import { useTheme } from "styled-components/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Alert, Image, Platform, TouchableOpacity, View } from "react-native";
import { LocationContext } from "../services/location/location.context";
import { HomeNavigation } from "./homenavigation";
import { SpecialsScreen } from "./specials.screen";
import { EventsScreen } from "./events/events.screen";
import { TranslationContext } from "../services/translation/translation.context";
import { PostTabsNavigationScreen } from "./posts/postNavigation.screen";
import useUser from "../../hooks/useUser";
import { Label } from "../components/typography/label.component";
import { useNavigation } from "@react-navigation/native";
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
import { CacheImage } from "../components/cacheImage";
import { typeEnum } from "../utils/constants";

const Tab = createMaterialTopTabNavigator();
// const Tab = createBottomTabNavigator();

export const EntertainerScreen = () => {
  const { i18n } = useContext(TranslationContext);
  const { userData } = useUser();
  const navigation = useNavigation();
  const [hasNotification, setHasNotification] = useState(false);

  useEffect(() => {
    const subscription = addNotificationResponseReceivedListener(
      handleNotificationResponse
    );
    const subscription2 = addNotificationReceivedListener((notification) => {
      console.log("incoming");
      setHasNotification(true);
    });

    return () => {
      subscription.remove();
      subscription2.remove();
    };
  }, []);

  useEffect(() => {
    if (userData) {
      console.log("has notification", hasNotification);
      changeHeaderRight(userData?.member === 1 ? "Feed" : "Home");
    }

    return () => {};
  }, [hasNotification]);

  useEffect(() => {
    const getPushToken = async () => {
      try {
        // if (userData.userPushToken) {
        //   const token = (await getExpoPushTokenAsync()).data;
        //   console.log("push token is available", userData.userPushToken, token);
        //   return;
        // }

        // console.log("push token is blank/invalid");
        registerForPushNotificationsAsync();
      } catch (error) {
        console.log(error);
      }
    };

    if (userData) {
      changeHeaderRight(userData?.member === 1 ? "Feed" : "Home");
      getPushToken();
    }
    return () => {};
  }, [userData]);

  const registerForPushNotificationsAsync = async () => {
    try {
      if (Platform.OS === "android") {
        console.log("testing");
        await setNotificationChannelAsync("default", {
          name: "default",
          importance: AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
        console.log("helo");
      }

      const token = (await getExpoPushTokenAsync()).data;
      console.log("push token", token);
      if (isDevice) {
        // alert("registering");
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
          alert("Failed to get push token for push notification!");
          return;
        }

        console.log("notif d", token);
        if (userData.userPushToken === token) return;
        const response = await NotificationsService.storePushToken(
          userData.user_id,
          token
        );

        // alert("success");
        if (!response.success) {
          Alert.alert(response.title, response.message);
        }
        // console.log("whattt");
        // console.log(user);
        await SecureStorage.setItemAsync("pushtoken", token);
      } else {
        alert("Must use physical device for Push Notifications");
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
          origin: "push",
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
      },
    },
    // {
    //   route: "Profile",
    //   component: ProfileScreen,
    //   activeIcon: " ",
    //   inactiveIcon: "account-circle",
    //   name: i18n.t("bottom-tabs.profile"),
    // },
  ];

  const theme = useTheme();
  const { eventList } = useContext(LocationContext);

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
            limit: 20,
            source: 2,
            headerTitle: i18n.t("search-all"),
            focus: true,
          });
          break;
      }
    };

    navigation.setOptions({
      headerRight: () => (
        <>
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
              size={"subtitle"}
              weight={"bold"}
            >
              {i18n.t("user_greeting", {
                name:
                  userData != undefined
                    ? userData.first_name?.split(" ")[0]
                    : "",
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
                    // borderRadius: 35,
                    // backgroundColor: "#eee",
                    justifyContent: "flex-end",
                    alignItems: "flex-end",
                  }}
                >
                  <MaterialCommunityIcons
                    name="magnify"
                    size={30}
                    style={{ fontWeight: "" }}
                  />
                </View>
              </TouchableOpacity>

              {route === "Home" && (
                <TouchableOpacity
                  onPress={() => {
                    navigate("Map");
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      // borderRadius: 35,
                      // backgroundColor: "#eee",
                      marginRight: 5,
                      justifyContent: "flex-end",
                      alignItems: "flex-end",
                    }}
                  >
                    <MaterialCommunityIcons
                      name="map-search"
                      size={28}
                      style={{ fontWeight: "" }}
                    />
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
                      // borderRadius: 35,
                      // backgroundColor: "#eee",
                      marginRight: 5,
                      justifyContent: "flex-end",
                      alignItems: "flex-end",
                    }}
                  >
                    <MaterialCommunityIcons
                      name="bell-outline"
                      size={28}
                      style={{ fontWeight: "" }}
                    />
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
                        aspectRatio: "1",
                      }}
                    ></View>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  navigate("Profile");
                }}
              >
                {userData && userData.member_image ? (
                  <View style={{ borderRadius: 25, overflow: "hidden" }}>
                    <CacheImage
                      style={{ width: 30, aspectRatio: "1" }}
                      uri={userData.member_image}
                    />
                  </View>
                ) : (
                  <MaterialCommunityIcons name="account-circle" size={30} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </>
      ),
    });
  };

  return (
    <>
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
          const onTabSelect = () => {
            changeHeaderRight(tab.route);
          };

          //Hide Specific Tabs
          if (tab.route === "Events" && !eventList.length) return;

          if (tab.route === "Feed" && userData && !userData.member) return;
          {
            /* if (tab.route === "Feed" && true) return; //Disable Feed */
          }

          return (
            <Tab.Screen
              key={index}
              name={tab.route}
              component={tab.component}
              listeners={{
                tabPress: onTabSelect,
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
                tabBarIcon: ({ focused }) => {
                  if (tab.route === "Profile") {
                    return (
                      <View
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 35,
                          overflow: "hidden",
                        }}
                      >
                        {userData?.member_image ? (
                          <CacheImage
                            style={{ width: "100%", height: "100%" }}
                            uri={userData?.member_image}
                          />
                        ) : (
                          <MaterialCommunityIcons
                            name="account-circle"
                            size={30}
                            color={theme.colors.icons.active}
                          />
                        )}
                      </View>
                    );
                  }
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
