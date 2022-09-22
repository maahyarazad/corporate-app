import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../infrastructure/theme";

export const settingsList = [
  // {
  //   label: "Terms and Conditions",
  //   backgroundColor: "white",
  //   textColor: theme.colors.ui.lightGray2,
  //   triggerFunction: 5,
  //   icon: () => {
  //     return (
  //       <MaterialCommunityIcons
  //         color={theme.colors.ui.lightGray2}
  //         name={"clipboard-list-outline"}
  //         size={25}
  //       />
  //     );
  //   },
  // },
  // {
  //   label: "End User License Agreement",
  //   backgroundColor: "white",
  //   textColor: theme.colors.ui.lightGray2,
  //   triggerFunction: 4,
  //   icon: () => {
  //     return (
  //       <MaterialCommunityIcons
  //         color={theme.colors.ui.lightGray2}
  //         name={"file-document-multiple-outline"}
  //         size={25}
  //       />
  //     );
  //   },
  // },
  {
    label: "EULA & Privacy Policy",
    backgroundColor: "white",
    textColor: theme.colors.ui.lightGray2,
    triggerFunction: 3,
    icon: () => {
      return (
        <MaterialCommunityIcons
          color={theme.colors.ui.lightGray2}
          name={"shield-search"}
          size={25}
        />
      );
    },
  },
  {
    label: "Contact Us",
    backgroundColor: "white",
    textColor: theme.colors.ui.lightGray2,
    triggerFunction: 2,
    icon: () => {
      return (
        <MaterialCommunityIcons
          color={theme.colors.ui.lightGray2}
          name={"face-agent"}
          size={25}
        />
      );
    },
  },
  {
    label: "Delete Account",
    backgroundColor: "white",
    textColor: theme.colors.ui.warning,
    triggerFunction: 1,
    icon: () => {
      return (
        <MaterialCommunityIcons
          color={theme.colors.ui.warning}
          name={"account-remove-outline"}
          size={25}
        />
      );
    },
  },
  {
    label: "Logout",
    backgroundColor: "#CC1515",
    textColor: "white",
    triggerFunction: 0,
    icon: () => {
      return (
        <MaterialCommunityIcons color={"white"} name={"logout"} size={25} />
      );
    },
  },
];
