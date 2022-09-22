import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { TabItems } from "../utils/routes";
import { IconButton } from "react-native-paper";
import { useTheme } from "styled-components";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Image, Platform, View } from "react-native";

const Tab = createMaterialTopTabNavigator();
// const Tab = createBottomTabNavigator();

export const EntertainerScreen = () => {
  const theme = useTheme();
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
          return (
            <Tab.Screen
              key={index}
              name={tab.route}
              component={tab.component}
              // options={TabItems[index].options}
              options={{
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
                    // <IconButton
                    //   icon={tab.inactiveIcon}
                    //   size={30}
                    //   color={
                    //     focused
                    //       ? theme.colors.icons.active
                    //       : theme.colors.icons.inactive
                    //   }
                    // />

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
