import { createStackNavigator } from "@react-navigation/stack";
import React, { useContext, useEffect, useState } from "react";
import moment from "moment";
import {
  Image,
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeArea } from "../../components/safearea.component";
import { ProfTabs } from "../../features/profile/profTabs";
import { config } from "../../utils/constants";
import { ContactUsScreen } from "./contactUs.screen";
import { PrivacyPolicyScreen } from "./privacyPolicy.screen";
import useUser from "../../../hooks/useUser";
import useAuth from "../../../hooks/useAuth";
import { Label } from "../../components/typography/label.component";
import CustomButton from "../../components/customButton.component";
import { theme } from "../../infrastructure/theme";
import { returnToMain } from "../../navigation/navigate";
import { LinearGradient } from "expo-linear-gradient";
import { TranslationContext } from "../../services/translation/translation.context";
import { CacheImage } from "../../components/cacheImage";
import { fontSizes } from "../../infrastructure/theme/fonts";
import useRequest from "../../../hooks/useRequest";
import { isCancel } from "../../utils/cancellation";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";

const ProfileStack = createStackNavigator();

const CARD_BOX_SIZE = 55;
const CARD_ICON_SIZE = 45;
const CARD_ICON_COLOR = "#fba918";

// Wrapped rather than passed straight to onPress: TouchableOpacity hands its
// callback a GestureResponderEvent, and returnToMain's first parameter is the
// tab name. `onPress={returnToMain}` would therefore try to select a tab named
// after a synthetic event object.
//
// returnToMain, not navigate("Main", ...): it drops every screen above Main
// whatever the stack is. See the comment on the helper itself.
const goHome = () => returnToMain();

const ProfilePrimaryScreen = () => {
  const request = useRequest();
  const { userData } = useUser();
  const [partnerTitle, setPartnerTitle] = useState("");

  // Declared inside the effect rather than as a useCallback above it, which is
  // the same shape map.screen.js uses. useRequest returns a NEW function on
  // every render (hooks/useRequest.js builds `httpRequest` as a plain const,
  // not a useCallback), so a useCallback wrapper could never list `request` as
  // a dependency without re-running forever - and omitting it captured a stale
  // `request`, and with it a stale access token.
  //
  // Depends on partner_id alone, not the whole userData object: it is the only
  // field read here, so an unrelated profile edit no longer refetches.
  useEffect(() => {
    const controller = new AbortController();

    const getPartnerTitle = async () => {
      // Previously the URL was built from `userData.partner_id` unguarded. The
      // TypeError on a null userData was swallowed by the catch below, so it
      // read as "the title just did not load".
      if (!userData?.partner_id) return;

      try {
        const response = await request(
          `/partners/partner-title/${userData.partner_id}`,
          "get",
          undefined,
          undefined,
          controller.signal
        );
        if (response && response.success) {
          setPartnerTitle(response.data.title);
        }
      } catch (error) {
        // An abort is this screen being disposed, which is routine here - see
        // specs/012-dispose-profile-and. Only real failures are worth logging.
        if (isCancel(error)) return;
        console.log("Failed to get partner title", error);
      }
    };

    getPartnerTitle();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.partner_id]);

  const { isSkip, goToVerification } = useAuth();
  const { i18n } = useContext(TranslationContext);

  return (
    <View style={styles.safeArea}>
      <View style={styles.box}>
        <TouchableOpacity
          onPress={goHome}
          style={styles.backButton}
          activeOpacity={0.5}
        >
          <Ionicons name="arrow-back" size={35} color="#555" />
          <Label size="body" weight="bold" style={styles.label}>
            {i18n.t("return")}
          </Label>
        </TouchableOpacity>
        <View>
          <Label weight="bold" size="h5">
            {i18n.t("profile-tabs.page-title")}
          </Label>
        </View>
      </View>

      <View style={styles.cardWrapper}>
        {!isSkip ? (
          <View style={styles.cardContainer}>
            {userData?.card_image && userData.card_image.startsWith("GEC-") ? (
              <View style={styles.card_style}>
                <Image
                  key={userData.card_image}
                  source={require("../../../assets/GE-LOGO-GOLD.png")}
                  style={styles.logo}
                />

                <Label style={styles.cardLabel}>CORPORATE CARD</Label>

                <View pointerEvents="none" style={styles.glowOverlay} />
                <View pointerEvents="none" style={styles.textureOverlay} />
                <LinearGradient
                  pointerEvents="none"
                  colors={[
                    "rgba(255,255,255,0.12)",
                    "rgba(255,255,255,0.04)",
                    "rgba(0,0,0,0.08)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.glareOverlay}
                />

                <View style={styles.iconsRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons
                      name="airplane-outline"
                      size={CARD_ICON_SIZE}
                      color={CARD_ICON_COLOR}
                    />
                  </View>

                  <View style={styles.iconCircle}>
                    <Ionicons
                      name="fast-food-outline"
                      size={CARD_ICON_SIZE}
                      color={CARD_ICON_COLOR}
                    />
                  </View>

                  <View style={styles.iconCircle}>
                    <Ionicons
                      name="gift-outline"
                      size={CARD_ICON_SIZE}
                      color={CARD_ICON_COLOR}
                    />
                  </View>

                  <View style={styles.iconCircle}>
                    <Ionicons
                      name="beer-outline"
                      size={CARD_ICON_SIZE}
                      color={CARD_ICON_COLOR}
                    />
                  </View>

                  <View style={styles.iconCircle}>
                    <AntDesign
                      name="shopping-cart"
                      size={CARD_ICON_SIZE}
                      color={CARD_ICON_COLOR}
                    />
                  </View>

                  <LinearGradient
                    colors={["#704505", "#fba918", "#704505"]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.withGradientBackground}
                  >
                    <Label style={styles.gecLabel}>GEC</Label>
                  </LinearGradient>
                </View>

                <View style={styles.nameBlock}>
                  <Label
                    style={styles.nameLabel}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Name
                  </Label>
                  <Label
                    style={styles.nameValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {`${userData?.honorifics || ""} ${userData?.first_name || ""} ${
                      userData?.last_name || ""
                    }`.trim()}
                  </Label>
                </View>

                <View style={styles.partnerBlock}>
                  <Label
                    style={styles.partnerLabel}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Corporate Partner
                  </Label>
                  <Label
                    style={styles.partnerValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {partnerTitle}
                  </Label>
                </View>

                <View style={styles.expiryBlock}>
                  <Label style={styles.expiryLabel}>Expiry</Label>
                  <Label
                    style={styles.expiryValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {userData?.expiry
                      ? moment(userData.expiry).format("MM/YY")
                      : "--/--"}
                  </Label>
                </View>
              </View>
            ) : (
              <CacheImage
                style={styles.card_style}
                resizeMode="cover"
                uri={`${config.SERVER_HOST}/uploads/app/card_images/${userData?.card_image}`}
              />
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Label>Sie haben keine Karte hochgeladen.</Label>
            <CustomButton
              onPress={goToVerification}
              style={{ backgroundColor: theme.colors.icons.active }}
              label="Zur Upload-Seite gehen"
              labelStyle={styles.customButtonLabel}
            />
          </View>
        )}
      </View>

      <View style={styles.flexBox}>
        <ProfTabs />
      </View>
    </View>
  );
};

// The bottom edge is deliberately absent: nothing sits below this screen -
// Profile is a stack route, not a tab, and ProfTabs puts its bar at the top -
// so a bottom inset here is dead space. The scrollable tab content gets that
// inset back as padding inside ProfTabs, where it is what content actually
// needs.
//
// This is also the app's only safe-area boundary for this screen. Nesting a
// second SafeAreaView inside would apply every inset twice; the library does
// not subtract what an ancestor already consumed.
const PROFILE_SAFE_AREA_EDGES = ["top", "left", "right"];

export const ProfileScreen = () => {
  return (
    <SafeArea style={styles.fill} edges={PROFILE_SAFE_AREA_EDGES}>
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
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },

  cardWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  cardContainer: {
    width: "90%",
    aspectRatio: 1.45,
    marginBottom: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    overflow: "visible",
    // transform: [
    //   { perspective: 1000 },
    //   { rotateX: "2deg" },
    //   { rotateY: "-5deg" },
    //   { rotateZ: "-0.8deg" },
    //   { scaleX: 0.985 },
    //   { scaleY: 1.01 },
    // ],
    shadowColor: Platform.OS === "ios" ? "#000" : "none",
    shadowOffset:
      Platform.OS === "ios" ? { width: 0, height: 8 } : { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: Platform.OS === "ios" ? 12 : 0,
    elevation: 8,
  },

  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },


  card_style: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    backgroundColor: "#9d1d1d",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    overflow: "hidden",
    position: "relative",
  },

  glowOverlay: {
    position: "absolute",
    inset: 0,
    borderRadius: 10,
    shadowColor: "#fba918",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
  },

  textureOverlay: {
    position: "absolute",
    top: -20,
    right: -20,
    width: "75%",
    height: "85%",
    opacity: 0.08,
    borderRadius: 999,
    backgroundColor: "#fff",
    transform: [{ rotate: "-25deg" }, { scaleX: 1.2 }],
  },

  glareOverlay: {
    position: "absolute",
    inset: 0,
    borderRadius: 10,
  },

  logo: {
    position: "absolute",
    top: 15,
    left: 0,
    width: 120,
    height: 60,
    resizeMode: "contain",
  },

  iconsRow: {
    position: "absolute",
    left: 10,
    right: 10,
    top: "50%",
    transform: [{ translateY: -20 }],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  cardLabel: {
    position: "absolute",
    color: "#fba918",
    fontSize: fontSizes.large_title,
    right: 10,
    top: "20%",
  },

  iconCircle: {
    width: CARD_BOX_SIZE,
    height: CARD_BOX_SIZE,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: CARD_ICON_COLOR,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251,169,24,0.04)",
  },

  withGradientBackground: {
    width: CARD_BOX_SIZE,
    height: CARD_BOX_SIZE,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  gecLabel: {
    color: "#f7df9b",
    fontSize: fontSizes.body,
    fontWeight: "700",
  },

  nameBlock: {
    position: "absolute",
    left: 10,
    bottom: 10,
    width: "42%",
  },

  partnerBlock: {
    position: "absolute",
    left: "46%",
    bottom: 10,
    width: "30%",
  },

  expiryBlock: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: "18%",
    alignItems: "flex-end",
  },

  nameLabel: {
    color: "#fba918",
    fontSize: fontSizes.caption,
    marginBottom: 2,
  },

  nameValue: {
    color: "white",
    fontSize: fontSizes.subtitle,
  },

  partnerLabel: {
    color: "#fba918",
    fontSize: fontSizes.caption,
    marginBottom: 2,
  },

  partnerValue: {
    color: "white",
    fontSize: fontSizes.subtitle,
  },

  expiryLabel: {
    color: "#fba918",
    fontSize: fontSizes.caption,
    marginBottom: 2,
    textAlign: "right",
  },

  expiryValue: {
    color: "white",
    fontSize: fontSizes.subtitle,
    textAlign: "right",
  },
  fill: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#efefef",
  },
  box: {
    paddingHorizontal: 25,
    paddingBottom: 25,
    alignItems: 'center',
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    color: "#555",
    justifyContent: "center",
  },
  
  customButtonLabel: {
    color: "white",
  },
  flexBox: {
    flex: 2,
  },
  
});
