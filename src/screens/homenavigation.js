import React, { useContext } from "react";
import styled from "styled-components/native";
import { Image, View } from "react-native";
import { Button, IconButton } from "react-native-paper";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RenderHome } from "./home.screen";
import { LocationListScreen } from "./location/location-list.screen";
import { Label } from "../components/typography/label.component";
import { SectionContext } from "../services/section/section.context";
import { LocationViewScreen } from "./location/location-view.screen";
import { AvailOfferScreen } from "./offer/availOffer.screen";
import { UserContext } from "../services/user/user.context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { navigate } from "../navigation/navigate";

// detachInactiveScreens dropped: @react-navigation/stack already defaulted it
// to true on Android, and native-stack manages screen detachment itself.
export const HomeNavigation = createNativeStackNavigator({
  screens: {
    Home1: { screen: RenderHome, options: { headerShown: false } },
  },
});
