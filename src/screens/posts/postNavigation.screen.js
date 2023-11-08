import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useEffect } from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import PostsScreen from "./posts.screen";
import { createStackNavigator } from "@react-navigation/stack";
import PostDetailScreen from "./postDetail.screen";
import { theme } from "../../infrastructure/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import PostEntryScreen from "./post_entry/postEntry.screen";
import PostEntrySelect from "./post_entry/postEntrySelect.screen";
import { useNavigation } from "@react-navigation/native";

const PostTabsScreen = createMaterialTopTabNavigator();
const PostStackScreen = createStackNavigator();

export const PostStackNavigationScreen = () => {
  useEffect(() => {
    return () => {};
  }, []);

  return (
    <PostStackScreen.Navigator>
      {/* <PostStackScreen.Screen
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
      <PostStackScreen.Screen
        name="post-edit"
        component={PostEntryScreen}
        options={{
          headerTintColor: theme.colors.icons.active,
          headerTitleStyle: {
            color: "black",
          },
          headerLeftLabelVisible: false,
        }}
      />
      <PostStackScreen.Screen
        name="post-select-category"
        component={PostEntrySelect}
        options={{
          headerShown: false,
        }}
      /> */}
    </PostStackScreen.Navigator>
  );
};

export const PostTabsNavigationScreen = () => {
  return (
    // <PostTabsScreen.Navigator
    //   screenOptions={{
    //     tabBarIndicatorStyle: {
    //       backgroundColor: theme.colors.icons.active,
    //       height: 4,
    //     },
    //   }}
    // >
    //   <PostTabsScreen.Screen
    //     name="all-feeds"
    //     component={PostsScreen}
    //     options={{
    //       tabBarLabel: "All",
    //     }}
    //   />
    //   <PostTabsScreen.Screen
    //     name="discussions"
    //     component={PostsScreen}
    //     options={{ lazy: true }}
    //   />
    //   <PostTabsScreen.Screen
    //     name="marketplace"
    //     component={PostsScreen}
    //     options={{ lazy: true }}
    //   />
    // </PostTabsScreen.Navigator>
    <PostsScreen />
  );
};

const styles = StyleSheet.create({});
