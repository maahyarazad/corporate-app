import React, { useContext } from "react";
import { Linking, Platform, StyleSheet, View, Image } from "react-native";
import { showToast } from "../Toast";
import { Button } from "react-native-paper";
import Background from "../components/background/background.component";

import { Label } from "../components/typography/label.component";
import { AppContext } from "../services/app/app.context";
import * as Constants from "expo-constants";
import { companyLogo } from "../utils/constants";
import {colors} from '../infrastructure/theme/colors'

export const VersionMismatchScreen = () => {
  const { appState } = useContext(AppContext);

  const URL_PLAYSTORE = `https://play.google.com/store/apps/details?id=com.buenapublica.GECRewards`;
  const URL_APPSTORE = `https://apps.apple.com/app/id${appState.apple_id}`;

const onPressPublisher = async () => {
  const url = Platform.OS === "ios" ? URL_APPSTORE : URL_PLAYSTORE;

  try {
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      showToast("error", "Not Supported", "This link cannot be opened.");
      return;
    }
    await Linking.openURL(url);
  } catch (error) {
    console.log("Failed to open store link:", error);
    
  }
};

  return (
    <>
      <Background style={styles.container}>
        <Image style={styles.image} source={companyLogo} />
        <View style={styles.wrapper}>
          <View style={styles.window}>
            <Label size="title" weight="bold">
              Outdated Version
            </Label>

            <View style={styles.spacer} />

            <Label style={styles.message} size="subtitle">
              Your app is running on an outdated version. Please update your
              app.
            </Label>

            <View style={styles.box} />
            <Button 
              onPress={onPressPublisher}
              contentStyle={{
                
                backgroundColor: colors.icons.active
              }}
              mode="contained" 
            >
              {Platform.OS === "ios" ? `Go to Appstore` : `Go to Playstore`}
            </Button>
          </View>
          <View style={styles.overlay}>
            <Label style={styles.label}>
              v{Constants.default.expoConfig.version}
            </Label>
          </View>
        </View>
      </Background>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    paddingBottom: 100,
  },
  wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
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
  image: {
    width: 100,
    height: 50,
    resizeMode: "contain",
    marginLeft: 16,
  },
  spacer: {
    marginTop: 10,
  },
  box: {
    marginTop: 20,
    fontSize: 40,
  },
  overlay: {
    position: "absolute",
    right: 24,
    bottom: 24,
  },
  label: {
    color: "white",
  },
});
