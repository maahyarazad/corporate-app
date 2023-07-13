import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import PostsScreen from "./posts.screen";
import { createStackNavigator } from "@react-navigation/stack";
import PostDetailScreen from "./postDetail.screen";
import { theme } from "../../infrastructure/theme";

const PostTabsScreen = createMaterialTopTabNavigator();
const PostStackScreen = createStackNavigator();

export const PostStackNavigationScreen = () => {
  return (
    <PostStackScreen.Navigator>
      <PostStackScreen.Screen
        name="post-tabs"
        component={PostTabsNavigationScreen}
        options={{
          headerShown: false,
        }}
      />
      <PostStackScreen.Screen
        name="post-detail"
        component={PostDetailScreen}
        options={{
          headerTintColor: theme.colors.icons.active,
          headerTitleStyle: {
            color: "black",
          },
          headerLeftLabelVisible: false,
        }}
      />
    </PostStackScreen.Navigator>
  );
};

export const PostTabsNavigationScreen = () => {
  return (
    <PostTabsScreen.Navigator
      screenOptions={{
        tabBarIndicatorStyle: {
          backgroundColor: theme.colors.icons.active,
          height: 4,
        },
      }}
    >
      <PostTabsScreen.Screen
        name="all-feeds"
        component={PostsScreen}
        options={{
          tabBarLabel: "All",
        }}
      />
      <PostTabsScreen.Screen name="discussions" component={PostsScreen} />
      <PostTabsScreen.Screen name="marketplace" component={PostsScreen} />
    </PostTabsScreen.Navigator>
  );
};

const styles = StyleSheet.create({});
