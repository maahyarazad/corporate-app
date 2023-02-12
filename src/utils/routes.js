import { HomeNavigation } from "../screens/homenavigation";
import { SpecialsScreen } from "../screens/specials.screen";
import { ProfileScreen } from "../screens/profile/profile.screen";
import { Image, View } from "react-native";
import { EventsScreen } from "../screens/events/events.screen";
import { i18n } from "../services/translation/translation.context";

export const TabItems = [
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
    },
  },
  {
    route: "Profile",
    component: ProfileScreen,
    activeIcon: " ",
    inactiveIcon: "account-circle",
    name: i18n.t("bottom-tabs.profile"),
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
];
