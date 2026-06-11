import React, { useContext, useEffect, useState } from "react";
import {
  FlatList,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { showToast } from "../../Toast";
import { showConfirm } from "../../components/confirmDialog.component";
import { Label } from "../../components/typography/label.component";
import { theme } from "../../infrastructure/theme";
import { UserService } from "../../services/user/user.service";
import { EULAPrivacyLink } from "../../utils/constants";
import { DELETE_ACCOUNT } from "../../utils/constants";
import * as WebBrowser from "expo-web-browser";
import * as Constants from "expo-constants";
import { AuthContext } from "../../services/auth/auth.context";
import { TranslationContext } from "../../services/translation/translation.context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import useAuth from "../../../hooks/useAuth";
import { Switch } from "react-native-paper";
import * as SecureStore from "expo-secure-store";
import useBiometrics from "../../../hooks/useBiometrics";
import useUser from "../../../hooks/useUser";

export const ProfSettings = () => {
  const { signout } = useAuth();
  const { i18n } = useContext(TranslationContext);
  const { setUserData } = useUser();
  const biometric = useBiometrics();

  useEffect(() => {
    return () => {};
  }, [biometric.available, biometric.token]);

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
            name="cog-outline"
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
            name="shield-search"
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
            name="face-agent"
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
            name="account-remove-outline"
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
          <MaterialCommunityIcons color="white" name="logout" size={25} />
        );
      },
    },
  ];

  useEffect(() => {}, []);

  const handleLogout = () => {
    // logout();
    showConfirm({
      title: i18n.t("logout.header"),
      message: i18n.t("logout.message"),
      confirmText: i18n.t("yes"),
      cancelText: i18n.t("no"),
      destructive: true,
      onConfirm: () => {
        signout();
        setUserData(null);
        // navigate("Logout");
      },
    });
  };

  const handleDelete = async () => {


    // navigate("Privacy Policy");
    try {
      await WebBrowser.openBrowserAsync(DELETE_ACCOUNT);
    } catch (error) {
      // console.log(error);
      showToast("error", "Error Occured", "Cannot Open Document");
    }
    // logout();
    // Alert.alert(
    //   i18n.t("delete-account.header"),
    //   i18n.t("delete-account.message"),
    //   [
    //     {
    //       text: i18n.t("no"),
    //       onPress: () => {},
    //     },
    //     {
    //       text: i18n.t("yes"),
    //       onPress: async () => {
    //         if (user.user_id) {
    //           const response = await UserService.removeUser(user.user_id);
    //           if (response.success) {
    //             Alert.alert(response.title, response.message);
    //             navigate("Logout");
    //           } else {
    //             Alert.alert(response.title, response.message);
    //           }
    //         } else {
    //           alert("User ID not available");
    //         }
    //       },
    //     },
    //   ]
    // );
  };

  const handleContactUs = async () => {
    try {
      await WebBrowser.openBrowserAsync(
        "https://services.german-emirates-club.com/support"
      );
    } catch (error) {
      showToast("error", "Error Occured", "Cannot Open Support Page");
    }
  };

  const handlePrivacyPolicy = async () => {
    // navigate("Privacy Policy");
    try {
      await WebBrowser.openBrowserAsync(EULAPrivacyLink);
    } catch (error) {
      // console.log(error);
      showToast("error", "Error Occured", "Cannot Open Document");
    }
  };

  const handleSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (err) {
      showToast("error", "Error Occured", "Cannot Open Settings");
    }
  };

  const actions = [
    handleLogout,
    handleDelete,
    handleContactUs,
    handlePrivacyPolicy,
    handleSettings,
  ];

  const Section = ({ title, children }) => {
    return (
      <View style={styles.section}>
        <View>
          <Label size="subtitle" weight="medium" color="#888">
            {title}
          </Label>
        </View>
        {children}
      </View>
    );
  };

  const Settings = ({ onPress, icon, label, type = "button" }) => {
    const [switchValue, setSwitchValue] = useState(!!biometric.token);

    const handleBiometric = async (value) => {
      try {
        if (value) {
          const bioAuth = await biometric.authenticate();
          if (bioAuth) {
            if (biometric.enable()) {
              return setSwitchValue(true);
            }

            return setSwitchValue();
          } else setSwitchValue(false);
        } else {
          biometric.disable();
        }
      } catch (error) {}
    };

    const cb = async () => {
      switch (type) {
        case "button":
          onPress();
          break;
        case "switch":
          handleBiometric(!switchValue);
          setSwitchValue(!switchValue);
          break;
        default:
          break;
      }
    };

    return (
      <TouchableWithoutFeedback onPress={cb}>
        <View style={styles.settingsButton}>
          <MaterialCommunityIcons
            color={theme.colors.ui.lightGray2}
            name={icon}
            size={25}
          />
          <Label weight="bold">{label}</Label>
          <View style={{ flex: 1 }}>
            {type === "switch" && (
              <Switch
                value={switchValue}
                color={theme.colors.icons.active}
                onValueChange={(x) => {
                  handleBiometric(x);
                  setSwitchValue(x);
                }}
                style={{ alignSelf: "flex-end" }}
              />
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  };

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
            weight="bold"
          >
            {item.label}
          </Label>
        </View>
      </TouchableHighlight>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f8f8f8" }}>
      {biometric.available != null && biometric.type != null && (
        <ScrollView contentContainerStyle={styles.container}>
          <Section title="General">
            <Settings
              icon="cog-outline"
              label={i18n.t("profile-tabs.settings-menu.settings-permission")}
              onPress={handleSettings}
            />
            <Settings
              icon={biometric.type}
              label={`Login using ${
                biometric.type === "fingerprint" ? "Fingerprint" : "Face ID"
              }`}
              onPress={handleSettings}
              type="switch"
            />
          </Section>
          <Section title="Legal">
            <Settings
              icon="shield-search"
              label={i18n.t("profile-tabs.settings-menu.legal")}
              onPress={handlePrivacyPolicy}
            />
          </Section>
          <Section title="Support">
            <Settings
              icon="face-agent"
              label={i18n.t("profile-tabs.settings-menu.contact-us")}
              onPress={handleContactUs}
            />
          </Section>
          <Section title="Account">
            <Settings
              icon="account-remove-outline"
              label={i18n.t("profile-tabs.settings-menu.delete-account")}
              onPress={handleDelete}
            />
            <Settings
              icon="logout"
              label={i18n.t("profile-tabs.settings-menu.logout")}
              onPress={handleLogout}
            />
          </Section>
          <Label style={{ color: "#777", alignSelf: "flex-end" }}>
            v{Constants.default.expoConfig.version}
          </Label>
          {/* <FlatList
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
                  v{Constants.default.expoConfig.version}
                </Label>
              </View>
            </View>
          );
        }}
      /> */}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // justifyContent: "center",
    // alignItems: "center",
    padding: 15,
    gap: 18,
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
  settingsButton: {
    flex: 1,
    padding: 15,
    backgroundColor: "white",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  section: {
    gap: 8,
  },
  scrollView: {},
});
