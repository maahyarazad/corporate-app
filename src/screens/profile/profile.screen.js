import { createStackNavigator } from "@react-navigation/stack";
import React, { useContext, useState } from "react";
import { Dimensions, Image, View } from "react-native";
import { SafeArea } from "../../components/safearea.component";
import { ProfTabs } from "../../features/profile/profTabs";
import { UserContext } from "../../services/user/user.context";
import { config } from "../../utils/constants";
import { ContactUsScreen } from "./contactUs.screen";
import { PrivacyPolicyScreen } from "./privacyPolicy.screen";

const ProfileStack = createStackNavigator();

const ProfilePrimaryScreen = () => {
  const { userInfo } = useContext(UserContext);
  const { width } = Dimensions.get("window");
  const [height, setHeight] = useState(100);

  return (
    <>
      {userInfo != undefined && (
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
                  uri: `${config.SERVER_HOST}/uploads/app/card_images/${userInfo.photo}`,
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

{
  /* <SafeArea style={{ backgroundColor: "#DDD" }}>
      <View
        style={{
          width: 200,
          height: 200,
          backgroundColor: "#EEE",
          alignSelf: "center",
          overflow: "hidden",
          borderWidth: 5,
          borderColor: "#CCC",
          borderRadius: 200 / 2,
          marginTop: 10,
          elevation: 5,
          zIndex: 100,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.5}
          style={{
            flex: 1,
          }}
        >
          <Image
            style={{ flex: 1 }}
            source={{ uri: "https://picsum.photos/700" }}
          />
        </TouchableOpacity>
      </View>
      <View
        style={{
          width: Dimensions.get("window").width - 32,
          height: "auto",
          backgroundColor: "#EEE",
          alignSelf: "center",
          borderRadius: 10,
          marginTop: -100,
          elevation: 10,
          zIndex: 10,
          justifyContent: "space-between",
          alignItems: "center",
          shadowOffset: {
            width: 3,
            height: 4,
          },
          shadowRadius: 5,
          shadowColor: "black",
          shadowOpacity: 0.3,
        }}
      >
        <View style={{ marginTop: 120, alignItems: "center" }}>
          <Label size={"heading"} weight={"bold"}>
            Miguel Iñaki William Paday
          </Label>
          <Label style={{ color: "#999" }} size={"title"} weight={"medium"}>
            Software Engineer
          </Label>
        </View>
        <Spacer position={"bottom"} size={"medium"}>
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: "row" }}>
              <Label>Works at </Label>
              <Label weight={"bold"}>German Emirates Club </Label>
            </View>
            <View style={{ flexDirection: "row" }}>
              <Label>Studied at </Label>
              <Label weight={"bold"}>University of Cebu </Label>
            </View>
            <View style={{ flexDirection: "row" }}>
              <Label>Lived in </Label>
              <Label weight={"bold"}>Dubai, United Arab Emirates </Label>
            </View>
            <View style={{ flexDirection: "row" }}>
              <Label>Joined since </Label>
              <Label weight={"bold"}>May 2022 </Label>
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: 16,
              alignSelf: "flex-end",
            }}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                width: "auto",
                height: 50,
                elevation: 10,
                shadowOffset: {
                  width: 3,
                  height: 4,
                },
                shadowRadius: 3,
                shadowColor: "black",
                shadowOpacity: 0.3,
              }}
            >
              <View
                style={{
                  borderRadius: 5,
                  overflow: "hidden",
                  flex: 1,
                }}
              >
                <LinearGradient
                  style={{
                    flex: 1,
                    width: "auto",
                    height: 50,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  colors={["#2C82F9", "#2C82F9"]}
                >
                  <Label
                    style={{ color: "white" }}
                    size={"body"}
                    weight={"bold"}
                  >
                    Add Friend
                  </Label>
                </LinearGradient>
              </View>
            </TouchableOpacity>
            <Spacer position={"right"} size="medium" />

            <TouchableOpacity
              style={{
                flex: 1,
                width: "auto",
                height: 50,
                elevation: 10,
                borderRadius: 5,
                shadowOffset: {
                  width: 3,
                  height: 4,
                },
                shadowRadius: 3,
                shadowColor: "black",
                shadowOpacity: 0.3,
              }}
              onPress={handleLogout}
            >
              <View
                style={{
                  borderRadius: 5,
                  overflow: "hidden",
                  flex: 1,
                }}
              >
                <LinearGradient
                  style={{
                    flex: 1,
                    width: "auto",
                    height: 50,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  colors={["#2C82F9", "#2C82F9"]}
                >
                  <Label
                    style={{ color: "white" }}
                    size={"body"}
                    weight={"bold"}
                  >
                    Message
                  </Label>
                </LinearGradient>
              </View>
            </TouchableOpacity>
          </View>
        </Spacer>
      </View>
    </SafeArea> */
}

//V2
