import React, { useContext, useEffect } from "react";
import {
  CardStyleInterpolators,
  createStackNavigator,
} from "@react-navigation/stack";
import { LoadingOverlay } from "./src/components/loading/loading.component";
import { NavigationContainer } from "@react-navigation/native";
import { LoginScreen } from "./src/screens/login/login.screen";
import { EntertainerScreen } from "./src/screens/entertainer.screen";
import { VerifyInfo } from "./src/screens/login/login-verify-info.screen";
import { RegistrationScreen } from "./src/screens/corporate/registration.screen";
import { OtpVerification } from "./src/screens/login/otpVerification";
import { MapScreen } from "./src/screens/map.screen";
import { ActivityIndicator } from "react-native-paper";
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
import {
  Image,
  TouchableOpacity,
  View,
  Dimensions,
  ImageBackground,
} from "react-native";
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
import { PostTabsNavigationScreen } from "./src/screens/posts/postNavigation.screen";
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
import * as SplashScreen from "expo-splash-screen";

const AuthStack = createStackNavigator();
const MainStack = createStackNavigator();
const ApprovalStack = createStackNavigator();
const TimeoutStack = createStackNavigator();
const OverlappingStack = createStackNavigator();

const noHeader = { headerShown: false };

const TimeoutStackScreen = () => {
  return (
    <TimeoutStack.Navigator>
      <TimeoutStack.Screen
        name="noconnection"
        component={NoConnectionScreen}
        options={noHeader}
      />
    </TimeoutStack.Navigator>
  );
};

// Shared stack screen options.
//
// forHorizontalIOS is the iOS default but not Android's - Android's stack
// reveals from the bottom - so declaring it here is what gives both platforms
// the same horizontal slide. It cannot be dropped and inferred.
const slideFromRight = {
  headerShown: false,
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  gestureDirection: "horizontal",
  gestureResponseDistance: 200,
};

// Screens the user must not swipe away from mid-flow.
const noSwipeBack = { gestureEnabled: false };

// Android only. react-native-screens detaches an inactive card by removing its
// fragment, so the whole native view tree under it is destroyed and rebuilt on
// the way back. Under Entertainer that tree is a material-top-tabs pager plus
// the navigators nested in its pages; ViewPager2 re-measures and re-settles its
// scroll offset as it is re-attached, which is the horizontal jolt on return.
// detachPreviousScreen keeps the card below the top one at activityState 1 -
// alive but not interactive - so there is nothing to rebuild. iOS keeps the
// view either way, which is why the glitch was Android-only.
const keepPreviousScreenAttached = { detachPreviousScreen: false };

// The Entertainer screen's options never change, so they are built once here.
// Inline in the navigator they were rebuilt on every render - and the stack
// re-renders on every navigation.setOptions() call the screen makes - which
// handed the header a fresh headerLeft each time, re-rendering the logo
// subtree.
//
// It does NOT unmount that subtree: React reconciles by element type and
// position, both unchanged, so the Image is not re-decoded. An earlier version
// of this comment claimed otherwise. The visible jolt on return was almost
// certainly fixed by keepPreviousScreenAttached above, which has a documented
// native mechanism; this hoist is duplication and allocation hygiene. See
// specs/005-static-screen-options/research.md R4.
const entertainerLogo = require("./assets/GE-LOGO-GOLD.png");

const entertainerHeaderLeftStyle = {
  width: "100%",
  height: "100%",
  justifyContent: "center",
};

const entertainerLogoStyle = {
  height: 40,
  width: 80,
  resizeMode: "contain",
};

const renderEntertainerHeaderLeft = () => (
  <View style={entertainerHeaderLeftStyle}>
    <Image style={entertainerLogoStyle} source={entertainerLogo} />
  </View>
);

const entertainerScreenOptions = {
  headerShown: true,
  headerTitle: "",
  headerLeftContainerStyle: { paddingLeft: 8 },
  headerRightContainerStyle: { paddingRight: 4 },
  headerLeft: renderEntertainerHeaderLeft,
};

// ---------------------------------------------------------------------------
// Shared screen options.
//
// These are static - they read nothing from props, state or context - so they
// are built once here rather than rebuilt on every navigator render. "Reads a
// module import" (theme, goback, CardStyleInterpolators) is not the same test
// as "depends on props or state"; only the second blocks hoisting.
// ---------------------------------------------------------------------------

// Same three motion fields as slideFromRight but revealing from the bottom.
// The forVerticalIOS / gestureDirection "horizontal" mismatch is what ships
// today on both callers and is preserved deliberately - changing the dismiss
// direction is a product decision, not a refactor.
const revealFromBottom = {
  headerShown: false,
  cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
  gestureDirection: "horizontal",
  gestureResponseDistance: 200,
};

const modalNoHeader = { presentation: "modal", headerShown: false };

// headerTintColor / headerTitleStyle / headerLeftLabelVisible are inert while
// headerShown is false. They ship today; removing them would be a behavioural
// bet, so they stay.
const postEntryOptions = {
  presentation: "modal",
  headerShown: false,
  headerTintColor: theme.colors.icons.active,
  headerTitleStyle: { color: "black" },
  headerLeftLabelVisible: false,
};

const postDetailOptions = {
  headerTintColor: theme.colors.icons.active,
  headerTitleStyle: { color: "black" },
  headerLeftLabelVisible: false,
  headerTitle: "",
};

const plainBlackHeader = {
  headerShown: false,
  headerBackTitleVisible: false,
  headerTitleAlign: "left",
  headerTintColor: "black",
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  gestureDirection: "horizontal",
  gestureResponseDistance: 200,
};

// The stack injects onPress (its own back action) into headerLeft - see
// @react-navigation/stack HeaderSegment.js:121 - so this needs no closure over
// `navigation` and can live out here. onPress is undefined at the root of a
// stack, where goBack() was a no-op too; neither caller is ever root.
const locationListBackStyle = { paddingLeft: 15 };

const renderBackArrow = ({ onPress }) => (
  <TouchableOpacity onPress={onPress} style={locationListBackStyle}>
    <Ionicons name="arrow-back" size={24} color="black" />
  </TouchableOpacity>
);

const locationListOptions = {
  headerBackTitle: "",
  headerTitle: "",
  headerTintColor: "black",
  headerStyle: { shadowColor: "transparent" },
  headerLeft: renderBackArrow,
  cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
  gestureDirection: "horizontal",
  gestureResponseDistance: 200,
};

// goback is a module-level helper, so these never needed a closure either.
const zurueckRowStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  paddingHorizontal: 8,
};

const renderZurueckBack = () => (
  <TouchableOpacity onPress={goback}>
    <View style={zurueckRowStyle}>
      <MaterialCommunityIcons name="arrow-left" size={24} color="black" />
      <Label>Zuruck</Label>
    </View>
  </TouchableOpacity>
);

const zurueckHeaderOptions = {
  headerShown: true,
  title: "",
  headerLeft: renderZurueckBack,
};

// Looks like zurueckHeaderOptions and is not: this View has no style, so the
// arrow sits above the label instead of beside it. Do not merge the two.
const renderPostSelectBack = () => (
  <TouchableOpacity onPress={goback}>
    <View>
      <MaterialCommunityIcons name="arrow-left" size={24} color="black" />
      <Label>Zuruck</Label>
    </View>
  </TouchableOpacity>
);

const postSelectOptions = {
  presentation: "modal",
  headerShown: false,
  title: "",
  headerLeft: renderPostSelectBack,
};

const AuthStackScreen = () => {
  return (
    <AuthStack.Navigator screenOptions={noHeader}>
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
      />

      <AuthStack.Screen
        name="Login Privacy Policy"
        component={PrivacyPolicyScreen}
      />

      <AuthStack.Screen
        name="Unverified Email"
        component={UnverifiedEmailScreen}
        options={slideFromRight}
      />

      <AuthStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={slideFromRight}
      />

      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={slideFromRight}
      />

      <AuthStack.Screen
        name="ForgotPasswordOTP"
        component={ForgotPasswordOTPScreen}
        options={slideFromRight}
      />

      <AuthStack.Screen
        name="UpdateMember"
        component={UpdateMemberScreen}
        options={slideFromRight}
      />

      <AuthStack.Screen
        name="RegisterDetails"
        component={RegistrationDetailsScreen}
        options={slideFromRight}
      />

      <AuthStack.Screen
        name="RegisterSuccess"
        component={RegistrationSuccessfulScreen}
        options={slideFromRight}
      />

      <AuthStack.Screen
        name="RegisterSuccessByServices"
        component={RegistrationSuccessByServices}
        options={slideFromRight}
      />

      <AuthStack.Screen
        name="VerifyInfo"
        component={VerifyInfo}
        options={slideFromRight}
      />

      <AuthStack.Screen
        name="Registration"
        component={RegistrationScreen}
        options={slideFromRight}
      />

      <AuthStack.Screen
        name="VerifyOTP"
        component={OtpVerification}
        options={slideFromRight}
      />

      <AuthStack.Screen
        name="MobileChange"
        component={ChangeMobileNumberScreen}
        options={slideFromRight}
      />

      <AuthStack.Screen
        name="EmailChange"
        component={ChangeEmailAddressScreen}
        options={slideFromRight}
      />
    </AuthStack.Navigator>
  );
};

const OverlappingNavigator = () => {
  return (
    <BottomSheetModalProvider>
      <OverlappingStack.Navigator screenOptions={keepPreviousScreenAttached}>
        <OverlappingStack.Screen
          name="Entertainer"
          component={EntertainerScreen}
          options={entertainerScreenOptions}
        />

        <OverlappingStack.Screen
          name="post-tabs"
          component={PostTabsNavigationScreen}
          options={noHeader}
        />

        <OverlappingStack.Screen
          name="post-detail"
          component={PostDetailScreen}
          options={postDetailOptions}
        />

        <OverlappingStack.Screen
          name="post-entry"
          component={PostEntryScreen}
          options={postEntryOptions}
        />

        <OverlappingStack.Screen
          name="post-search"
          component={PostSearch}
          options={revealFromBottom}
        />

        <OverlappingStack.Screen
          name="notifications"
          component={NotificationsScreen}
          options={slideFromRight}
        />

        <OverlappingStack.Screen
          name="post-select-category"
          component={PostEntryCategorySelect}
          options={modalNoHeader}
        />

        <OverlappingStack.Screen
          name="post-select"
          component={PostEntrySelect}
          options={postSelectOptions}
        />

        <OverlappingStack.Screen
          name="marketplace-details"
          component={PostDetailMarketplace}
          options={zurueckHeaderOptions}
        />

        <OverlappingStack.Screen
          name="magazine-details"
          component={PostDetailMagazine}
          options={zurueckHeaderOptions}
        />
      </OverlappingStack.Navigator>
    </BottomSheetModalProvider>
  );
};

// A real component, not a callback body.
//
// headerTitle is invoked as a plain function call from inside Header's render
// (@react-navigation/elements Header.js:208 - headerTitle({...}), not
// createElement), so a hook written inline there runs as part of Header's
// render and belongs to Header's fiber. Header.js:170 picks its title renderer
// with `typeof customTitle !== 'function'`, so the moment this screen is given
// a string title - one setOptions call, as postDetail.screen.js already does -
// the same Header instance loses a hook and React throws "Rendered fewer hooks
// than expected". Owning the hook here makes that impossible.
const LocationViewTitle = () => {
  const { sectionTitle } = useContext(SectionContext);

  return (
    <Label size="title" weight="bold">
      {sectionTitle}
    </Label>
  );
};

const locationViewHeaderStyle = {
  borderColor: "black",
  shadowColor: "transparent",
  backgroundColor: "transparent",
};

// The spread runs once at module load, so composing costs nothing per render -
// unlike a spread written inside JSX, which would rebuild the object every time
// and defeat the point.
const locationViewOptions = {
  ...plainBlackHeader,
  headerTitle: () => <LocationViewTitle />,
  headerStyle: locationViewHeaderStyle,
};

const MainScreen = () => {
  const { i18n } = useContext(TranslationContext);
  return (
    <MainStack.Navigator>
      <MainStack.Screen
        name="Main"
        component={OverlappingNavigator}
        options={noHeader}
      />

      <MainStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={slideFromRight}
      />

      <MainStack.Screen
        name="Logout"
        component={LogoutScreen}
        options={noHeader}
      />

      <MainStack.Screen
        name="Map"
        component={MapScreen}
         options={slideFromRight}
      />

      <MainStack.Screen
        name="LocationList"
        component={LocationListScreen}
        options={locationListOptions}
      />

      <MainStack.Screen
        name="AvailOffer"
        component={AvailOfferScreen}
        options={slideFromRight}
      />

      <MainStack.Screen
        name="TransactionSummary"
        component={TransactionSummaryScreen}
        // The one options object that stays inline. title reads i18n from
        // context, so it cannot be a module constant - that is exactly where
        // the rule stops. useMemo would not help either: this component
        // re-renders when TranslationContext changes, which is precisely when
        // i18n changes, so the memo would invalidate on every render it was
        // meant to skip.
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
        options={locationViewOptions}
      />

      <MainStack.Screen
        name="Event Detail"
        component={EventDetailScreen}
        options={plainBlackHeader}
      />

      <MainStack.Screen
        name="Attend Guests"
        component={EventGuestsScreen}
        options={plainBlackHeader}
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
        options={noHeader}
      />
      <ApprovalStack.Screen
        name="AuthEditProfile"
        component={AuthEditProfileScreen}
        options={slideFromRight}
      />
      <ApprovalStack.Screen
        name="Camera"
        component={CameraScreen}
        options={slideFromRight}
      />
      <ApprovalStack.Screen
        name="Logout"
        component={LogoutScreen}
        options={noHeader}
      />
    </ApprovalStack.Navigator>
  );
};

SplashScreen.preventAutoHideAsync();
export const AppNavigation = () => {
  const { isOutdated } = useContext(AppContext);
  const { width, height } = Dimensions.get("screen");
  const { phoneVerified, refreshToken, isSkip, noConnection, isAuthorized } =
    useAuth();

  //   const assets = null;

  const renderNavigator = () => {
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

    useEffect(() => {
      if (assets) {
        SplashScreen.hideAsync();
      }
    }, [assets]);
    if (!assets) {
      return (
        <ImageBackground
          source={require("./assets/splash.png")}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width,
            height,
          }}
          resizeMode="cover"
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator
              size="large"
              color="#FFB400"
              style={{ paddingTop: 250 }}
            />
          </View>
        </ImageBackground>
      );
    }

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

  return (
    <NavigationContainer ref={navigationRef}>
      {renderNavigator()}
    </NavigationContainer>
  );
};
