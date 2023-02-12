import React, { useContext, useEffect } from "react";
import {
  Alert,
  FlatList,
  Linking,
  StyleSheet,
  TouchableHighlight,
  View,
} from "react-native";
import { Label } from "../../components/typography/label.component";
import { theme } from "../../infrastructure/theme";
import { navigate } from "../../navigation/navigate";
import { UserService } from "../../services/user/user.service";
import { EULAPrivacyLink } from "../../utils/constants";
import * as WebBrowser from "expo-web-browser";
import * as Constants from "expo-constants";
import { AuthContext } from "../../services/auth/auth.context";
import { TranslationContext } from "../../services/translation/translation.context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export const ProfSettings = () => {
  const { user } = useContext(AuthContext);
  const { i18n } = useContext(TranslationContext);
  const settingsList = [
    {
      label: i18n.t("profile-tabs.settings-menu.settings-permission"),
      backgroundColor: "white",
      textColor: theme.colors.ui.lightGray2,
      triggerFunction: 4,
      icon: () => {
        return (
          <MaterialCommunityIcons
            color={theme.colors.ui.lightGray2}
            name={"cog-outline"}
            size={25}
          />
        );
      },
    },
    {
      label: i18n.t("profile-tabs.settings-menu.legal"),
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
      label: i18n.t("profile-tabs.settings-menu.contact-us"),
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
      label: i18n.t("profile-tabs.settings-menu.delete-account"),
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
      label: i18n.t("profile-tabs.settings-menu.logout"),
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

  useEffect(() => {}, []);

  const handleLogout = () => {
    // logout();
    Alert.alert(i18n.t("logout.header"), i18n.t("logout.message"), [
      {
        text: i18n.t("no"),
        onPress: () => {},
      },
      {
        text: i18n.t("yes"),
        onPress: () => {
          navigate("Logout");
        },
      },
    ]);
  };

  const handleDelete = () => {
    // logout();
    Alert.alert(
      i18n.t("delete-account.header"),
      i18n.t("delete-account.message"),
      [
        {
          text: i18n.t("no"),
          onPress: () => {},
        },
        {
          text: i18n.t("yes"),
          onPress: async () => {
            if (user.user_id) {
              const response = await UserService.removeUser(user.user_id);
              if (response.success) {
                Alert.alert(response.title, response.message);
                navigate("Logout");
              } else {
                Alert.alert(response.title, response.message);
              }
            } else {
              alert("User ID not available");
            }
          },
        },
      ]
    );
  };

  const handleContactUs = () => {
    navigate("ContactUs");
  };

  const handlePrivacyPolicy = async () => {
    // navigate("Privacy Policy");
    try {
      await WebBrowser.openBrowserAsync(EULAPrivacyLink);
    } catch (error) {
      // console.log(error);
      Alert.alert("Error Occured", "Cannot Open Document");
    }
  };

  const handleSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (err) {
      Alert.alert("Error Occured", "Cannot Open Settings");
    }
  };

  const actions = [
    handleLogout,
    handleDelete,
    handleContactUs,
    handlePrivacyPolicy,
    handleSettings,
  ];

  const renderSettings = ({ item }) => {
    return (
      <TouchableHighlight
        key={item.label}
        onPress={() => {
          if (item.triggerFunction < actions.length)
            actions[item.triggerFunction]();
        }}
      >
        <View
          style={[
            styles.itemSettingsContainer,
            { backgroundColor: item.backgroundColor },
          ]}
        >
          {item.icon != undefined ? item.icon() : <></>}
          <Label
            style={{ color: item.textColor, marginLeft: 8 }}
            weight={"bold"}
          >
            {item.label}
          </Label>
        </View>
      </TouchableHighlight>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.settingsContainer}
        data={settingsList}
        renderItem={renderSettings}
        ListFooterComponent={() => {
          return (
            <View
              style={{
                padding: 12,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View style={styles.versionView}>
                <Label style={{ color: "#777" }}>
                  v{Constants.default.manifest.version}
                </Label>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  versionView: {
    padding: 8,
    paddingHorizontal: 12,
    // backgroundColor: theme.colors.ui.lighterGray,
    // borderRadius: 20,
  },
  settingsContainer: {
    // flex: 1,
    alignSelf: "stretch",
  },
  itemSettingsContainer: {
    padding: 16,
    borderBottomWidth: 2,
    borderColor: theme.colors.ui.lighterGray,
    flexDirection: "row",
    alignItems: "center",
  },
});
