import { createStackNavigator } from "@react-navigation/stack";
import React, { useContext, useState } from "react";
import { Dimensions, Image, View } from "react-native";
import { SafeArea } from "../../components/safearea.component";
import { ProfTabs } from "../../features/profile/profTabs";
import { UserContext } from "../../services/user/user.context";
import { config } from "../../utils/constants";
import { ContactUsScreen } from "./contactUs.screen";
import { PrivacyPolicyScreen } from "./privacyPolicy.screen";
import useUser from "../../../hooks/useUser";

const ProfileStack = createStackNavigator();

const ProfilePrimaryScreen = () => {
  const { userData } = useUser();
  const { width } = Dimensions.get("window");
  const [height, setHeight] = useState(100);

  return (
    <>
      {userData != undefined && (
        <SafeArea style={{ backgroundColor: "#efefef" }}>
          {/* Main Container */}
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
            onLayout={(e) => {
              setHeight(e.nativeEvent.layout.height);
            }}
          >
            {/* Image Container */}
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
                  uri: `${config.SERVER_HOST}/uploads/app/card_images/${userData.photo}`,
                }}
              />
            </View>
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
    </>
  );
};
