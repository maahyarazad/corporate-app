import React, { useContext, useEffect, useState } from "react";
import {
  CardStyleInterpolators,
  createStackNavigator,
} from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import { LoginScreen } from "./src/screens/login/login.screen";
import { EntertainerScreen } from "./src/screens/entertainer.screen";
import { VerifyInfo } from "./src/screens/login/login-verify-info.screen";
import { RegistrationScreen } from "./src/screens/corporate/registration.screen";
import { OtpVerification } from "./src/screens/login/otpVerification";
import { MapScreen } from "./src/screens/map.screen";
import { AuthContext } from "./src/services/auth/auth.context";
import { SplashScreen } from "./src/screens/splash.screen";
import { navigationRef } from "./src/navigation/navigate";
import { LogoutScreen } from "./src/screens/logout.screen";
import { RequestApprovalScreen } from "./src/screens/login/requestapproval.screen";
import { CameraScreen } from "./src/screens/camera.screen";
import { RegistrationSuccessfulScreen } from "./src/screens/corporate/registrationSuccess.screen";
import { RegistrationDetailsScreen } from "./src/screens/corporate/registrationDetails.screen";
import { Label } from "./src/components/typography/label.component";
import { useAssets } from "expo-asset";
import { LocationListScreen } from "./src/screens/location/location-list.screen";
import { SectionContext } from "./src/services/section/section.context";
import { AvailOfferScreen } from "./src/screens/offer/availOffer.screen";
import { LocationViewScreen } from "./src/screens/location/location-view.screen";
import { Image, View } from "react-native";
import { UserContext } from "./src/services/user/user.context";
import { TransactionSummaryScreen } from "./src/screens/offer/transactionSummary.screen";
import { ForgotPasswordScreen } from "./src/screens/reset-password/forgotPassword";
import { ForgotPasswordOTPScreen } from "./src/screens/reset-password/forgotPasswordOTP";
import { ChangePasswordScreen } from "./src/screens/reset-password/changePassword";
import { AuthEditProfileScreen } from "./src/screens/login/authEditProfile";
import { UnverifiedEmailScreen } from "./src/screens/login/unverifiedEmail.screen";
import { PrivacyPolicyScreen } from "./src/screens/profile/privacyPolicy.screen";
import { EventDetailScreen } from "./src/screens/events/eventDetail.screen";

const AuthStack = createStackNavigator();
const MainStack = createStackNavigator();
const ApprovalStack = createStackNavigator();

const config = {
  animation: "spring",
  config: {
    stiffness: 1000,
    damping: 500,
    mass: 3,
    overshootClamping: true,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
};

const AuthStackScreen = () => {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          headerShown: false,
        }}
      />

      <AuthStack.Screen
        name="Login Privacy Policy"
        component={PrivacyPolicyScreen}
        options={{
          headerShown: false,
        }}
      />

      <AuthStack.Screen
        name="Unverified Email"
        component={UnverifiedEmailScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />

      <AuthStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />

      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          gestureDirection: "horizontal",
          gestureResponseDistance: 200,
        }}
      />

      <AuthStack.Screen
        name="ForgotPasswordOTP"
        component={ForgotPasswordOTPScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />

      <AuthStack.Screen
        name="RegisterDetails"
        component={RegistrationDetailsScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          gestureDirection: "horizontal",
          gestureResponseDistance: 200,
        }}
      />

      <AuthStack.Screen
        name="RegisterSuccess"
        component={RegistrationSuccessfulScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />

      <AuthStack.Screen
        name="VerifyInfo"
        component={VerifyInfo}
        options={{
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          gestureDirection: "horizontal",
          gestureResponseDistance: 200,
        }}
      />
      <AuthStack.Screen
        name="Registration"
        component={RegistrationScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <AuthStack.Screen
        name="VerifyOTP"
        component={OtpVerification}
        options={{
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          gestureDirection: "horizontal",
          gestureResponseDistance: 200,
        }}
      />
    </AuthStack.Navigator>
  );
};

const MainScreen = () => {
  const { userInfo } = useContext(UserContext);

  return (
    <>
      <MainStack.Navigator option>
        <MainStack.Screen
          name="Entertainer"
          component={EntertainerScreen}
          options={{
            headerShown: true,
            headerTitle: "",
            headerLeftContainerStyle: { paddingLeft: 8 },
            headerRightContainerStyle: { paddingRight: 4 },
            headerRight: () => {
              return (
                <>
                  <View style={{ width: "100%" }}>
                    <Label
                      style={{ paddingRight: 8, textAlign: "right" }}
                      numberOfLines={1}
                      size={"subtitle"}
                      weight={"bold"}
                    >
                      {`Hi there, ${
                        userInfo != undefined
                          ? userInfo.first_name.split(" ")[0]
                          : ""
                      }!`}
                    </Label>
                  </View>
                </>
              );
            },
            headerLeft: () => {
              return (
                <View style={{ width: "100%" }}>
                  <Image
                    style={{
                      height: 50,
                      width: 100,
                      resizeMode: "contain",
                    }}
                    source={require("./assets/ifza-icon-black.png")}
                  />
                </View>
              );
            },
          }}
        />
        <MainStack.Screen
          name="Logout"
          component={LogoutScreen}
          options={{ headerShown: false }}
        />
        <MainStack.Screen
          name="Map"
          component={MapScreen}
          options={{
            headerShown: false,
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
            gestureDirection: "horizontal",
            gestureResponseDistance: 200,
          }}
        />
        <MainStack.Screen
          name="LocationList"
          component={LocationListScreen}
          options={{
            headerBackTitleVisible: false,
            headerTitleAlign: "left",
            headerTintColor: "black",
            headerStyle: { borderColor: "black", shadowColor: "transparent" },
            cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
            gestureDirection: "horizontal",
            gestureResponseDistance: 200,
          }}
        />
        <MainStack.Screen
          name="AvailOffer"
          component={AvailOfferScreen}
          options={{
            headerShown: false,
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
            gestureDirection: "horizontal",
            gestureResponseDistance: 200,
          }}
        />
        <MainStack.Screen
          name="TransactionSummary"
          component={TransactionSummaryScreen}
          options={{
            headerShown: true,
            title: "Transaction Summary",
            gestureEnabled: false,
            headerBackTitleVisible: false,
          }}
        />
        <MainStack.Screen
          name={"Location View"}
          component={LocationViewScreen}
          options={{
            headerShown: false,
            headerBackTitleVisible: false,
            headerTitleAlign: "left",
            headerTintColor: "black",
            headerTitle: () => {
              const { sectionTitle } = useContext(SectionContext);
              return (
                <Label size={"title"} weight={"bold"}>
                  {sectionTitle}
                </Label>
              );
            },
            headerStyle: {
              borderColor: "black",
              shadowColor: "transparent",
              backgroundColor: "transparent",
            },
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
            gestureDirection: "horizontal",
            gestureResponseDistance: 200,
          }}
        />

        <MainStack.Screen
          name={"Event Detail"}
          component={EventDetailScreen}
          options={{
            headerShown: false,
            headerBackTitleVisible: false,
            headerTitleAlign: "left",
            headerTintColor: "black",
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
            gestureDirection: "horizontal",
            gestureResponseDistance: 200,
          }}
        />
      </MainStack.Navigator>
    </>
  );
};

const ApprovalScreen = () => {
  return (
    <ApprovalStack.Navigator>
      <ApprovalStack.Screen
        name="RequestApproval"
        component={RequestApprovalScreen}
        options={{
          headerShown: false,
        }}
      />
      <ApprovalStack.Screen
        name="AuthEditProfile"
        component={AuthEditProfileScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          gestureDirection: "horizontal",
          gestureResponseDistance: 200,
        }}
      />
      <ApprovalStack.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          gestureDirection: "horizontal",
          gestureResponseDistance: 200,
        }}
      />
      <ApprovalStack.Screen
        name="Logout"
        component={LogoutScreen}
        options={{ headerShown: false }}
      />
    </ApprovalStack.Navigator>
  );
};

const ExceedTimeout = () => {
  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <Label>There has been an error</Label>
    </View>
  );
};

export const AppNavigation = () => {
  const { isRetrieving, user, isUserVerified } = useContext(AuthContext);
  // const [timePassed, setTimePassed] = useState(false);
  const [assets] = useAssets([
    require("./assets/IFZA-Logo.png"),
    require("./assets/ifza-login-bg2.jpg"),
    require("./assets/ifza-login-bg.webp"),
    require("./assets/ifza-icon-black.png"),

    //----------Category Icons------------
    require("./assets/Food_Drinks.png"),
    require("./assets/Beauty_Fitness.png"),
    require("./assets/Attraction_Leisure.png"),
    require("./assets/Fashion_Retail.png"),
    require("./assets/EverydayServices.png"),
    require("./assets/Travel.png"),
    require("./assets/Education.png"),
    require("./assets/Healthcare.png"),
    require("./assets/FinancialServices.png"),
    require("./assets/RealEstate.png"),
    require("./assets/Consulting.png"),

    //----------Stamp Icons------------
    require("./assets/stamps/IFZA_1__Off_Discount.png"),
    require("./assets/stamps/IFZA_2__Off_Discount.png"),
    require("./assets/stamps/IFZA_3__Off_Discount.png"),
    require("./assets/stamps/IFZA_4__Off_Discount.png"),
    require("./assets/stamps/IFZA_5__Off_Discount.png"),
    require("./assets/stamps/IFZA_6__Off_Discount.png"),
    require("./assets/stamps/IFZA_7__Off_Discount.png"),
    require("./assets/stamps/IFZA_8__Off_Discount.png"),
    require("./assets/stamps/IFZA_9__Off_Discount.png"),
    require("./assets/stamps/IFZA_10__Off_Discount.png"),
    require("./assets/stamps/IFZA_11__Off_Discount.png"),
    require("./assets/stamps/IFZA_12__Off_Discount.png"),
    require("./assets/stamps/IFZA_13__Off_Discount.png"),
    require("./assets/stamps/IFZA_14__Off_Discount.png"),
    require("./assets/stamps/IFZA_15__Off_Discount.png"),
    require("./assets/stamps/IFZA_16__Off_Discount.png"),
    require("./assets/stamps/IFZA_17__Off_Discount.png"),
    require("./assets/stamps/IFZA_18__Off_Discount.png"),
    require("./assets/stamps/IFZA_19__Off_Discount.png"),
    require("./assets/stamps/IFZA_20__Off_Discount.png"),
    require("./assets/stamps/IFZA_25__Off_Discount.png"),
    require("./assets/stamps/IFZA_30__Off_Discount.png"),
    require("./assets/stamps/IFZA_35__Off_Discount.png"),
    require("./assets/stamps/IFZA_40__Off_Discount.png"),
    require("./assets/stamps/IFZA_45__Off_Discount.png"),
    require("./assets/stamps/IFZA_50__Off_Discount.png"),
    require("./assets/stamps/IFZA_55__Off_Discount.png"),
    require("./assets/stamps/IFZA_60__Off_Discount.png"),
    require("./assets/stamps/IFZA_65__Off_Discount.png"),
    require("./assets/stamps/IFZA_70__Off_Discount.png"),
    require("./assets/stamps/IFZA_75__Off_Discount.png"),
    require("./assets/stamps/IFZA_80__Off_Discount.png"),
    require("./assets/stamps/IFZA_85__Off_Discount.png"),
    require("./assets/stamps/IFZA_90__Off_Discount.png"),
    require("./assets/stamps/IFZA_95__Off_Discount.png"),
    require("./assets/stamps/IFZA_100__Off_Discount.png"),
    require("./assets/stamps/IFZA_Best_Offer.png"),
    require("./assets/stamps/IFZA_Buy_1_Get_2.png"),
    require("./assets/stamps/IFZA_Buy_2_Get_3.png"),
    require("./assets/stamps/IFZA_Buy_3_Get_4.png"),
    require("./assets/stamps/IFZA_Buy_4_Get_5.png"),
    require("./assets/stamps/IFZA_Buy_5_Get_6.png"),
    require("./assets/stamps/IFZA_Buy_6_Get_7.png"),
    require("./assets/stamps/IFZA_Freebie.png"),
    require("./assets/stamps/IFZA_Special_Offer.png"),

    //----------Specials Icons------------
    require("./assets/specials/Workspace.png"),
    require("./assets/specials/Adrenaline.png"),
    require("./assets/specials/Brand_New.png"),
    require("./assets/specials/Breakfast.png"),
    require("./assets/specials/Brunches.png"),
    require("./assets/specials/Buffet.png"),
    require("./assets/specials/Cuisine.png"),
    require("./assets/specials/Daycations.png"),
    require("./assets/specials/Delivery.png"),
    require("./assets/specials/Flash_Sale.png"),
    require("./assets/specials/Gourmet.png"),
    require("./assets/specials/Hot_Pick.png"),
    require("./assets/specials/Kids.png"),
    require("./assets/specials/Monthly_Offers.png"),
    require("./assets/specials/Pet_Friendly.png"),
    require("./assets/specials/Shisha_Offers.png"),
    require("./assets/specials/Staycations.png"),
    require("./assets/specials/Summer_Super_Sale.png"),
    require("./assets/specials/Takeaway.png"),
    require("./assets/specials/Trending_Offers.png"),
  ]);

  if (isRetrieving || !assets) {
    console.log(user);
    return <SplashScreen />;
  }

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        {user.token ? (
          user.isAuthorized && user.submitCard ? (
            <MainScreen />
          ) : (
            <ApprovalScreen />
          )
        ) : (
          <AuthStackScreen />
        )}
      </NavigationContainer>
    </>
  );
};
