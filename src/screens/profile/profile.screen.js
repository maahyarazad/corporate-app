import { createStackNavigator } from "@react-navigation/stack";
import React, { useContext, useState } from "react";
import {
  Dimensions,
  Image,
  SafeAreaView,
  TouchableOpacity,
  View,
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

const ProfileStack = createStackNavigator();

const ProfilePrimaryScreen = () => {
  const { userData } = useUser();
  const { isSkip, goToVerification } = useAuth();
  const { width } = Dimensions.get("window");
  const [height, setHeight] = useState(100);

  const { i18n } = useContext(TranslationContext);

  return (
    <>
      {userData != undefined && (
        <SafeArea style={{ backgroundColor: "#efefef" }}>
          <View style={{ paddingHorizontal: 16 }}>
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

          {/* Main Container */}
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
            onLayout={(e) => {
              setHeight(e.nativeEvent.layout.height);
            }}
          >
            {/* Image Container */}
            {!isSkip ? (
              <View
                style={{
                  // height: "40%",
                  // width: width,
                  height: height,
                  width: height * (800 / 550),
                  padding: 16,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 10,
                  // backgroundColor: "#ccc",
                }}
              >
                <Image
                  style={{
                    width: "100%",
                    height: "100%",
                    resizeMode: "cover",
                    borderRadius: 10,
                    backgroundColor: "#ccc",
                  }}
                  source={{
                    uri: `${config.SERVER_HOST}/uploads/app/card_images/${userData.card_image}`,
                  }}
                />
              </View>
            ) : (
              <View
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Label>You have not uploaded a card.</Label>
                <CustomButton
                  onPress={goToVerification}
                  style={{ backgroundColor: theme.colors.icons.active }}
                  label={"Go to Upload page"}
                  labelStyle={{ color: "white" }}
                />
              </View>
            )}
          </View>
          <View style={{ flex: 2 }}>
            <ProfTabs />
          </View>
        </SafeArea>
      )}
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
