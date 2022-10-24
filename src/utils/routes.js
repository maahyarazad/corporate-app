import { HomeNavigation } from "../screens/homenavigation";
import { SpecialsScreen } from "../screens/specials.screen";
import { ProfileScreen } from "../screens/profile/profile.screen";
import { Image, View } from "react-native";
import { EventsScreen } from "../screens/events/events.screen";

export const TabItems = [
  {
    route: "Home",
    // component: TransactionSummaryScreen,
    component: HomeNavigation,
    activeIcon: "",
    inactiveIcon: "home",
    options: {
      headerShown: false,
    },
  },
  {
    route: "Offers",
    component: SpecialsScreen,
    activeIcon: " ",
    inactiveIcon: "tag-multiple",
    options: {
      headerShown: true,
      headerTitle: "2",
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
              source={require("../../assets/ifza-icon-black.png")}
            />
          </View>
        );
      },
    },
  },
  {
    route: "Events",
    component: EventsScreen,
    activeIcon: " ",
    inactiveIcon: "calendar-month",
    options: {
      headerShown: true,
      headerTitle: "2",
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
              source={require("../../assets/ifza-icon-black.png")}
            />
          </View>
        );
      },
    },
  },
  {
    route: "Profile",
    component: ProfileScreen,
    activeIcon: " ",
    inactiveIcon: "account-circle",
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
              source={require("../../assets/ifza-icon-black.png")}
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
];
