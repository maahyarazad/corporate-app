import { createStackNavigator } from "@react-navigation/stack";
import React, { useContext, useState } from "react";
import {
  Dimensions,
  Image,
  SafeAreaView,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { SafeArea } from "../../components/safearea.component";
import { ProfTabs } from "../../features/profile/profTabs";
import { UserContext } from "../../services/user/user.context";
import { config } from "../../utils/constants";
import { ContactUsScreen } from "./contactUs.screen";
import { PrivacyPolicyScreen } from "./privacyPolicy.screen";
import useUser from "../../../hooks/useUser";
import useAuth from "../../../hooks/useAuth";
import { Label } from "../../components/typography/label.component";
import CustomButton from "../../components/customButton.component";
import { theme } from "../../infrastructure/theme";
import { goback } from "../../navigation/navigate";
import { Ionicons } from "@expo/vector-icons";
import { TranslationContext } from "../../services/translation/translation.context";
import { CacheImage } from "../../components/cacheImage";
import { fontSizes } from "../../infrastructure/theme/fonts";

const ProfileStack = createStackNavigator();

const ProfilePrimaryScreen = () => {
  const { userData } = useUser();
  const { isSkip, goToVerification } = useAuth();
  const { width } = Dimensions.get("window");
  console.log(userData);

  const { i18n } = useContext(TranslationContext);

  return (
    <>
      {
        <SafeArea style={{ backgroundColor: "#efefef" }}>
          <View style={{ paddingHorizontal: 12 }}>
            <TouchableOpacity
              onPress={goback}
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
              activeOpacity={0.5}
            >
              <Ionicons name="arrow-back" size={35} color={"#555"} />
              <Label
                size={"body"}
                weight="bold"
                style={{ color: "#555", justifyContent: "center" }}
              >
                {i18n.t("return")}
              </Label>
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: 14, paddingBottom: 6 }}>
            <Label weight={"bold"} size={"h5"}>
              Profil
            </Label>
          </View>
          {/* Main Container */}
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            {/* Image Container */}
            {!isSkip ? (
              <View
                style={{
                  // height: "40%",
                  // width: width,
                  width: "90%",
                  aspectRatio: 1.45,
                  padding: 16,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 10,
                  // backgroundColor: "#ccc",
                }}
              >
                {userData.card_image &&
                userData.card_image.startsWith("GEC-") ? (
                  <View style={styles.card_style_blue}>
                    <Image
                      key={userData.card_image}
                      source={require("../../../assets/GE-LOGO-GOLD.png")}
                      style={styles.logo}
                    />

                    <Label style={styles.labelBottomRight}>
                      {userData.card_image}
                    </Label>
                  </View>
                ) : (
                  <CacheImage
                    style={styles.card_style}
                    resizeMode={"cover"}
                    uri={`${config.SERVER_HOST}/uploads/app/card_images/${userData?.card_image}`}
                  />
                )}
              </View>
            ) : (
              <View
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Label>Sie haben keine Karte hochgeladen.</Label>
                <CustomButton
                  onPress={goToVerification}
                  style={{ backgroundColor: theme.colors.icons.active }}
                  label={"Zur Upload-Seite gehen"}
                  labelStyle={{ color: "white" }}
                />
              </View>
            )}
          </View>
          <View style={{ flex: 2 }}>
            <ProfTabs />
          </View>
        </SafeArea>
      }
    </>
  );
};

export const ProfileScreen = ({ theme, ...props }) => {
  // const RenderProfile = () => {
  //   return
  // }

  return (
    <>
      <SafeAreaView style={{ flex: 1 }}>
        <ProfileStack.Navigator
          screenOptions={{ headerShown: false, gestureEnabled: false }}
        >
          <ProfileStack.Screen
            name="MainProfile"
            component={ProfilePrimaryScreen}
          />
          <ProfileStack.Screen name="ContactUs" component={ContactUsScreen} />
          <ProfileStack.Screen
            name="Privacy Policy"
            component={PrivacyPolicyScreen}
          />
        </ProfileStack.Navigator>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  card_style: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    backgroundColor: "#ccc",
  },
  card_style_blue: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    backgroundColor: "#0d1b2a",
    justifyContent: "flex-start", // top
    alignItems: "flex-start", // left
  },

  logo: {
    position: "absolute",
    top: 15,
    left: 10,
    width: 140,
    height: 80,
    resizeMode: "contain",
  },
  labelBottomRight: {
    color: "#D9B144",
    fontSize: fontSizes.title,
    position: "absolute",
    bottom: 20,
    right: 20,
  },
});
