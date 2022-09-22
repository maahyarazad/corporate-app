import React, { useEffect } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  TouchableHighlight,
  View,
} from "react-native";
import { Label } from "../../components/typography/label.component";
import { theme } from "../../infrastructure/theme";
import { navigate } from "../../navigation/navigate";
import { UserService } from "../../services/user/user.service";
import { EULAPrivacyLink } from "../../utils/constants";
import { settingsList } from "../../utils/settingsDefinition";
import * as WebBrowser from "expo-web-browser";
import * as Constants from "expo-constants";

export const ProfSettings = () => {
  useEffect(() => {}, []);

  const handleLogout = () => {
    // logout();
    Alert.alert("Confirm Logout", "Do you really want to logout?", [
      {
        text: "No",
        onPress: () => {},
      },
      {
        text: "Yes",
        onPress: () => {
          navigate("Logout");
        },
      },
    ]);
  };

  const handleDelete = () => {
    // logout();
    Alert.alert(
      "Warning",
      "Are you sure you want to delete this Account? \n\nNote: This action is permanent and your account cannot be recovered.",
      [
        {
          text: "No",
          onPress: () => {},
        },
        {
          text: "Yes",
          onPress: async () => {
            if (user.user_id) {
              const response = await UserService.removeUser(user.user_id);
              if (response.success) {
                Alert.alert(response.title, response.message);
                logout();
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

  const actions = [
    handleLogout,
    handleDelete,
    handleContactUs,
    handlePrivacyPolicy,
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
