import React, { useContext } from "react";
import { Linking, Platform, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import Background from "../components/background/background.component";
import { SafeArea } from "../components/safearea.component";
import { Spacer } from "../components/spacer/spacer.component";
import { Label } from "../components/typography/label.component";
import { AppContext } from "../services/app/app.context";
import * as Constants from "expo-constants";

export const VersionMismatchScreen = () => {
  const { appState } = useContext(AppContext);

  const URL_PLAYSTORE = `https://play.google.com/store/apps/details?id=${appState.package_name}`;
  const URL_APPSTORE = `https://apps.apple.com/app/id${appState.apple_id}`;

  console.log("YAWA", appState);
  const onPressPublisher = async () => {
    try {
      const supported = await Linking.canOpenURL(URL_APPSTORE);

      if (supported) {
        await Linking.openURL(URL_APPSTORE);
      } else {
        alert("Not Supported");
      }
    } catch (error) {}
  };

  return (
    <Background style={styles.container}>
      <View style={styles.window}>
        <Label size={"title"} weight={"bold"}>
          Outdated Version
        </Label>
        <Spacer position={"top"} size={"small"} />
        <Label style={styles.message} size={"subtitle"}>
          Your app is running on an outdated version. Please update your app.
        </Label>
        <Spacer position={"top"} size={"medium"} />
        <Button
          onPress={onPressPublisher}
          contentStyle={{
            backgroundColor: "rgba(210,115,0,1)",
          }}
          mode="contained"
        >
          {Platform.OS === "ios" ? `Go to Appstore` : `Go to Playstore`}
        </Button>
      </View>
      <View
        style={{
          position: "absolute",
          right: 24,
          bottom: 24,
        }}
      >
        <Label style={{ color: "white" }}>
          v{Constants.default.manifest.version}
        </Label>
      </View>
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  window: {
    backgroundColor: "#ddd",
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 8,

    justifyContent: "center",
    alignItems: "center",
  },
  message: {
    textAlign: "center",
  },
});
