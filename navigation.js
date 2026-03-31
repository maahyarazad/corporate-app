import React, { useContext } from "react";
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
import { SplashScreen } from "./src/screens/splash.screen";
import { goback, navigationRef } from "./src/navigation/navigate";
import { LogoutScreen } from "./src/screens/logout.screen";
import { RequestApprovalScreen } from "./src/screens/login/requestapproval.screen";
import { CameraScreen } from "./src/screens/camera.screen";
import { RegistrationSuccessfulScreen } from "./src/screens/corporate/registrationSuccess.screen";
import { RegistrationSuccessByServices } from "./src/screens/corporate/registrationSuccessByServices.screen";
import { RegistrationDetailsScreen } from "./src/screens/corporate/registrationDetails.screen";
import { Label } from "./src/components/typography/label.component";
import { useAssets } from "expo-asset";
import { LocationListScreen } from "./src/screens/location/location-list.screen";
import { SectionContext } from "./src/services/section/section.context";
import { AvailOfferScreen } from "./src/screens/offer/availOffer.screen";
import { LocationViewScreen } from "./src/screens/location/location-view.screen";
import { Image, TouchableOpacity, View } from "react-native";
import { TransactionSummaryScreen } from "./src/screens/offer/transactionSummary.screen";
import { ForgotPasswordScreen } from "./src/screens/reset-password/forgotPassword";
import { ForgotPasswordOTPScreen } from "./src/screens/reset-password/forgotPasswordOTP";
import { ChangePasswordScreen } from "./src/screens/reset-password/changePassword";
import { AuthEditProfileScreen } from "./src/screens/login/authEditProfile";
import { UnverifiedEmailScreen } from "./src/screens/login/unverifiedEmail.screen";
import { PrivacyPolicyScreen } from "./src/screens/profile/privacyPolicy.screen";
import { EventDetailScreen } from "./src/screens/events/eventDetail.screen";
import { EventGuestsScreen } from "./src/screens/events/eventGuests.screen";
import { TranslationContext } from "./src/services/translation/translation.context";
import { UpdateMemberScreen } from "./src/screens/login/updateMember.screen";
import { NoConnectionScreen } from "./src/screens/noConnection.screen";
import { AppContext } from "./src/services/app/app.context";
import { VersionMismatchScreen } from "./src/screens/versionMismatch.screen";
import useAuth from "./hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ProfileScreen } from "./src/screens/profile/profile.screen";
import PostEntrySelect from "./src/screens/posts/post_entry/postEntrySelect.screen";
import {
  PostTabsNavigationScreen,
} from "./src/screens/posts/postNavigation.screen";
import PostDetailScreen from "./src/screens/posts/postDetail.screen";
import PostEntryScreen from "./src/screens/posts/post_entry/postEntry.screen";
import { theme } from "./src/infrastructure/theme";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import PostEntryCategorySelect from "./src/screens/posts/post_entry/postEntryCategorySelect.screen";
import PostDetailMarketplace from "./src/screens/posts/postDetailMarketplace.screen";
import PostSearch from "./src/screens/posts/postSearch.screen";
import NotificationsScreen from "./src/screens/notifications.screen";
import ChangeMobileNumberScreen from "./src/screens/profile/changeMobileNumber.screen";
import PostDetailMagazine from "./src/screens/posts/postDetailMagazine.screen";
import ChangeEmailAddressScreen from "./src/screens/profile/changeEmailAddress.screen ";
import { useNavigation } from "@react-navigation/native";

const AuthStack = createStackNavigator();
const MainStack = createStackNavigator();
const ApprovalStack = createStackNavigator();
const TimeoutStack = createStackNavigator();
const OverlappingStack = createStackNavigator();

const TimeoutStackScreen = () => {
  return (
    <TimeoutStack.Navigator>
      <TimeoutStack.Screen
        name="noconnection"
        component={NoConnectionScreen}
        options={{ headerShown: false }}
      />
    </TimeoutStack.Navigator>
  );
};

const AuthStackScreen = () => {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />

      <AuthStack.Screen
        name="Login Privacy Policy"
        component={PrivacyPolicyScreen}
        options={{ headerShown: false }}
      />

      <AuthStack.Screen
        name="Unverified Email"
        component={UnverifiedEmailScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />

      <AuthStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ headerShown: false, gestureEnabled: false }}
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
        options={{ headerShown: false, gestureEnabled: false }}
      />

      <AuthStack.Screen
        name="UpdateMember"
        component={UpdateMemberScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          gestureDirection: "horizontal",
          gestureResponseDistance: 200,
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
        options={{ headerShown: false, gestureEnabled: false }}
      />

      <AuthStack.Screen
        name="RegisterSuccessByServices"
        component={RegistrationSuccessByServices}
        options={{ headerShown: false, gestureEnabled: false }}
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
        options={{ headerShown: false, gestureEnabled: false }}
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

      <AuthStack.Screen
        name="MobileChange"
        component={ChangeMobileNumberScreen}
        options={{
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          gestureDirection: "horizontal",
          gestureResponseDistance: 200,
        }}
      />

      <AuthStack.Screen
        name="EmailChange"
        component={ChangeEmailAddressScreen}
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

const OverlappingNavigator = () => {
  const { i18n } = useContext(TranslationContext);
  
  return (
    <BottomSheetModalProvider>
      <OverlappingStack.Navigator>
        <OverlappingStack.Screen
          name="Entertainer"
          component={EntertainerScreen}
          options={{
            headerShown: true,
            headerTitle: "",
            headerLeftContainerStyle: { paddingLeft: 8 },
            headerRightContainerStyle: { paddingRight: 4 },
            headerLeft: () => (
              <View
                style={{
                  width: "100%",
                  height: "100%",
                  justifyContent: "center",
                }}
              >
                <Image
                  style={{
                    height: 40,
                    width: 80,
                    resizeMode: "contain",
                  }}
                  source={require("./assets/GE-LOGO-GOLD.png")}
                />
              </View>
            ),
          }}
        />

        <OverlappingStack.Screen
          name="post-tabs"
          component={PostTabsNavigationScreen}
          options={{ headerShown: false }}
        />

        <OverlappingStack.Screen
          name="post-detail"
          component={PostDetailScreen}
          options={{
            headerTintColor: theme.colors.icons.active,
            headerTitleStyle: { color: "black" },
            headerLeftLabelVisible: false,
            headerTitle: "",
          }}
        />

        <OverlappingStack.Screen
          name="post-entry"
          component={PostEntryScreen}
          options={{
            presentation: "modal",
            headerShown: false,
            headerTintColor: theme.colors.icons.active,
            headerTitleStyle: { color: "black" },
            headerLeftLabelVisible: false,
          }}
        />

        <OverlappingStack.Screen
          name="post-search"
          component={PostSearch}
          options={{
            headerShown: false,
            cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
            gestureDirection: "horizontal",
            gestureResponseDistance: 200,
          }}
        />

        <OverlappingStack.Screen
          name="notifications"
          component={NotificationsScreen}
          options={{
            headerShown: false,
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
            gestureDirection: "horizontal",
            gestureResponseDistance: 200,
          }}
        />

        <OverlappingStack.Screen
          name="post-select-category"
          component={PostEntryCategorySelect}
          options={{
            presentation: "modal",
            headerShown: false,
          }}
        />

        <OverlappingStack.Screen
          name="post-select"
          component={PostEntrySelect}
          options={{
            presentation: "modal",
            headerShown: false,
            title: "",
            headerLeft: () => (
              <TouchableOpacity onPress={goback}>
                <View>
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={24}
                    color="black"
                  />
                  <Label>Zuruck</Label>
                </View>
              </TouchableOpacity>
            ),
          }}
        />

        <OverlappingStack.Screen
          name="marketplace-details"
          component={PostDetailMarketplace}
          options={{
            headerShown: true,
            title: "",
            headerLeft: () => (
              <TouchableOpacity onPress={goback}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 8,
                  }}
                >
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={24}
                    color="black"
                  />
                  <Label>Zuruck</Label>
                </View>
              </TouchableOpacity>
            ),
          }}
        />

        <OverlappingStack.Screen
          name="magazine-details"
          component={PostDetailMagazine}
          options={{
            headerShown: true,
            title: "",
            headerLeft: () => (
              <TouchableOpacity onPress={goback}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 8,
                  }}
                >
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={24}
                    color="black"
                  />
                  <Label>Zuruck</Label>
                </View>
              </TouchableOpacity>
            ),
          }}
        />
      </OverlappingStack.Navigator>
    </BottomSheetModalProvider>
  );
};

const MainScreen = () => {
  const { i18n } = useContext(TranslationContext);
const navigation = useNavigation();
  return (
    <MainStack.Navigator>
      <MainStack.Screen
        name="Main"
        component={OverlappingNavigator}
        options={{ headerShown: false }}
      />

      <MainStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
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
           headerBackTitle: "",
  headerTitle: "",
  headerTintColor: "black",
  headerStyle: { shadowColor: "transparent" },

  headerLeft: () => (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={{ paddingLeft: 15 }}
    >
      <Ionicons name="arrow-back" size={24} color="black" />
    </TouchableOpacity>
  ),
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
          title: i18n.t("redemption-success.transaction-summary"),
          gestureEnabled: false,
          headerBackTitleVisible: false,
        }}
      />

      <MainStack.Screen
        name="Location View"
        component={LocationViewScreen}
        options={{
          headerShown: false,
          headerBackTitleVisible: false,
          headerTitleAlign: "left",
          headerTintColor: "black",
          headerTitle: () => {
            const { sectionTitle } = useContext(SectionContext);
            return (
              <Label size="title" weight="bold">
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
        name="Event Detail"
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

      <MainStack.Screen
        name="Attend Guests"
        component={EventGuestsScreen}
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
  );
};

const ApprovalScreen = () => {
  return (
    <ApprovalStack.Navigator>
      <ApprovalStack.Screen
        name="RequestApproval"
        component={RequestApprovalScreen}
        options={{ headerShown: false }}
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

export const AppNavigation = () => {
  const { isOutdated } = useContext(AppContext);
  
  const { phoneVerified, refreshToken, isSkip, noConnection, isAuthorized } =
    useAuth();

  const [assets] = useAssets([
    require("./assets/IFZA-Logo.png"),
    require("./assets/ifza-login-bg2.jpg"),
    require("./assets/ifza-login-bg.webp"),
    require("./assets/GE-LOGO-GOLD.png"),

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

    require("./assets/stamps/GEC_1_Off_Discount.png"),
    require("./assets/stamps/GEC_2_Off_Discount.png"),
    require("./assets/stamps/GEC_3_Off_Discount.png"),
    require("./assets/stamps/GEC_4_Off_Discount.png"),
    require("./assets/stamps/GEC_5_Off_Discount.png"),
    require("./assets/stamps/GEC_6_Off_Discount.png"),
    require("./assets/stamps/GEC_7_Off_Discount.png"),
    require("./assets/stamps/GEC_8_Off_Discount.png"),
    require("./assets/stamps/GEC_9_Off_Discount.png"),
    require("./assets/stamps/GEC_10_Off_Discount.png"),
    require("./assets/stamps/GEC_11_Off_Discount.png"),
    require("./assets/stamps/GEC_12_Off_Discount.png"),
    require("./assets/stamps/GEC_13_Off_Discount.png"),
    require("./assets/stamps/GEC_14_Off_Discount.png"),
    require("./assets/stamps/GEC_15_Off_Discount.png"),
    require("./assets/stamps/GEC_16_Off_Discount.png"),
    require("./assets/stamps/GEC_17_Off_Discount.png"),
    require("./assets/stamps/GEC_18_Off_Discount.png"),
    require("./assets/stamps/GEC_19_Off_Discount.png"),
    require("./assets/stamps/GEC_20_Off_Discount.png"),
    require("./assets/stamps/GEC_25_Off_Discount.png"),
    require("./assets/stamps/GEC_30_Off_Discount.png"),
    require("./assets/stamps/GEC_35_Off_Discount.png"),
    require("./assets/stamps/GEC_40_Off_Discount.png"),
    require("./assets/stamps/GEC_45_Off_Discount.png"),
    require("./assets/stamps/GEC_50_Off_Discount.png"),
    require("./assets/stamps/GEC_55_Off_Discount.png"),
    require("./assets/stamps/GEC_60_Off_Discount.png"),
    require("./assets/stamps/GEC_65_Off_Discount.png"),
    require("./assets/stamps/GEC_70_Off_Discount.png"),
    require("./assets/stamps/GEC_75_Off_Discount.png"),
    require("./assets/stamps/GEC_80_Off_Discount.png"),
    require("./assets/stamps/GEC_85_Off_Discount.png"),
    require("./assets/stamps/GEC_90_Off_Discount.png"),
    require("./assets/stamps/GEC_95_Off_Discount.png"),
    require("./assets/stamps/GEC_100_Off_Discount.png"),
    require("./assets/stamps/GEC_2_for_1.png"),
    require("./assets/stamps/GEC_3_for_2.png"),
    require("./assets/stamps/GEC_4_for_3.png"),
    require("./assets/stamps/GEC_5_for_4.png"),
    require("./assets/stamps/GEC_6_for_5.png"),
    require("./assets/stamps/GEC_7_for_6.png"),
    require("./assets/stamps/GEC_Freebie.png"),

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

  const renderNavigator = () => {
    if (noConnection) {
      return <TimeoutStackScreen />;
    }

    if (isOutdated) {
      return <VersionMismatchScreen />;
    }

    if (phoneVerified && refreshToken) {
      if (isAuthorized || isSkip) {
        return <MainScreen />;
      }

      return <ApprovalScreen />;
    }

    return <AuthStackScreen />;
  };

  if (!assets) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {renderNavigator()}
    </NavigationContainer>
  );
};