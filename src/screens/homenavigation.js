import React, { useContext } from "react";
import styled from "styled-components/native";
import { Image, View } from "react-native";
import { Button, IconButton } from "react-native-paper";
import {
  CardStyleInterpolators,
  createStackNavigator,
} from "@react-navigation/stack";
import { HomeScreen } from "./home.screen";
import { LocationListScreen } from "./location/location-list.screen";
import { Label } from "../components/typography/label.component";
import { SectionContext } from "../services/section/section.context";
import { LocationViewScreen } from "./location/location-view.screen";
import { AvailOfferScreen } from "./offer/availOffer.screen";
import { UserContext } from "../services/user/user.context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { navigate } from "../navigation/navigate";

const HomeStack = createStackNavigator();

export const HomeNavigation = () => {
  return (
    <>
      <HomeStack.Navigator detachInactiveScreens={true}>
        <HomeStack.Screen
          name="Home1"
          component={HomeScreen}
          options={{
            headerShown: false,
          }}
        />
      </HomeStack.Navigator>
    </>
  );
};
