import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RenderHome } from "./home.screen";

// detachInactiveScreens dropped: @react-navigation/stack already defaulted it
// to true on Android, and native-stack manages screen detachment itself.
// .getComponent() - the factory returns a config object, not a component, and
// this is consumed as a Tab.Screen `component`. See navigation.js for the
// full explanation.
export const HomeNavigation = createNativeStackNavigator({
  screens: {
    Home1: { screen: RenderHome, options: { headerShown: false } },
  },
}).getComponent();
