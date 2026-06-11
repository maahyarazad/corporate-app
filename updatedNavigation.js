// ✅ 1) CONSTANT ANIMATION CONFIG (put near top of file)

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

// one constant horizontal animation for ALL normal stack pushes
const TRANSITION = {
  gestureEnabled: true,
  gestureDirection: "horizontal",
  transitionSpec: { open: config, close: config },
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
};

// optional: if you want modal screens to also be unified (vertical + same spring)
const TRANSITION_MODAL = {
  gestureEnabled: true,
  gestureDirection: "vertical",
  transitionSpec: { open: config, close: config },
  cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
};

// base options applied to every Stack.Navigator
const BASE_STACK_OPTIONS = {
  headerBackTitleVisible: false,
  ...TRANSITION,
};



// ✅ 2) APPLY TO ALL STACKS

const TimeoutStackScreen = () => {
  return (
    <TimeoutStack.Navigator screenOptions={BASE_STACK_OPTIONS}>
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
    <AuthStack.Navigator screenOptions={BASE_STACK_OPTIONS}>
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
        options={{
          headerShown: false,
          gestureEnabled: false, // keep your override
        }}
      />

      <AuthStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{
          headerShown: false,
          gestureEnabled: false, // keep your override
        }}
      />

      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ headerShown: false }}
      />

      <AuthStack.Screen
        name="ForgotPasswordOTP"
        component={ForgotPasswordOTPScreen}
        options={{
          headerShown: false,
          gestureEnabled: false, // keep your override
        }}
      />

      <AuthStack.Screen
        name="UpdateMember"
        component={UpdateMemberScreen}
        options={{ headerShown: false }}
      />

      <AuthStack.Screen
        name="RegisterDetails"
        component={RegistrationDetailsScreen}
        options={{ headerShown: false }}
      />

      <AuthStack.Screen
        name="RegisterSuccess"
        component={RegistrationSuccessfulScreen}
        options={{
          headerShown: false,
          gestureEnabled: false, // keep your override
        }}
      />

      <AuthStack.Screen
        name="VerifyInfo"
        component={VerifyInfo}
        options={{ headerShown: false }}
      />

      <AuthStack.Screen
        name="Registration"
        component={RegistrationScreen}
        options={{
          headerShown: false,
          gestureEnabled: false, // keep your override
        }}
      />

      <AuthStack.Screen
        name="VerifyOTP"
        component={OtpVerification}
        options={{ headerShown: false }}
      />

      <AuthStack.Screen
        name="MobileChange"
        component={ChangeMobileNumberScreen}
        options={{ headerShown: false }}
      />

      <AuthStack.Screen
        name="EmailChange"
        component={ChangeEmailAddressScreen}
        options={{ headerShown: false }}
      />
    </AuthStack.Navigator>
  );
};


const OverlappingNavigator = () => {
  const { i18n } = useContext(TranslationContext);

  return (
    <BottomSheetModalProvider>
      <OverlappingStack.Navigator screenOptions={BASE_STACK_OPTIONS}>
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
                  style={{ height: 40, width: 80, resizeMode: "contain" }}
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

        {/* modal screens unified (same spring) */}
        <OverlappingStack.Screen
          name="post-entry"
          component={PostEntryScreen}
          options={{
            presentation: "modal",
            headerShown: false,
            ...TRANSITION_MODAL,
          }}
        />

        <OverlappingStack.Screen
          name="post-search"
          component={PostSearch}
          options={{
            headerShown: false,
          }}
        />

        <OverlappingStack.Screen
          name="notifications"
          component={NotificationsScreen}
          options={{
            headerShown: false,
          }}
        />

        <OverlappingStack.Screen
          name="post-select-category"
          component={PostEntryCategorySelect}
          options={{
            presentation: "modal",
            headerShown: false,
            ...TRANSITION_MODAL,
          }}
        />

        <OverlappingStack.Screen
          name="post-select"
          component={PostEntrySelect}
          options={{
            presentation: "modal",
            headerShown: false,
            ...TRANSITION_MODAL,
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

  return (
    <MainStack.Navigator screenOptions={BASE_STACK_OPTIONS}>
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
        options={{ headerShown: false }}
      />

      <MainStack.Screen
        name="LocationList"
        component={LocationListScreen}
        options={{
          headerTitleAlign: "left",
          headerTintColor: "black",
          headerStyle: { borderColor: "black", shadowColor: "transparent" },
        }}
      />

      <MainStack.Screen
        name="AvailOffer"
        component={AvailOfferScreen}
        options={{ headerShown: false }}
      />

      <MainStack.Screen
        name="TransactionSummary"
        component={TransactionSummaryScreen}
        options={{
          headerShown: true,
          title: i18n.t("redemption-success.transaction-summary"),
          gestureEnabled: false, // keep your override
        }}
      />

      <MainStack.Screen
        name="Location View"
        component={LocationViewScreen}
        options={{
          headerShown: false,
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
        }}
      />

      <MainStack.Screen
        name="Event Detail"
        component={EventDetailScreen}
        options={{ headerShown: false }}
      />

      <MainStack.Screen
        name="Attend Guests"
        component={EventGuestsScreen}
        options={{ headerShown: false }}
      />
    </MainStack.Navigator>
  );
};


const ApprovalScreen = () => {
  return (
    <ApprovalStack.Navigator screenOptions={BASE_STACK_OPTIONS}>
      <ApprovalStack.Screen
        name="RequestApproval"
        component={RequestApprovalScreen}
        options={{ headerShown: false }}
      />

      <ApprovalStack.Screen
        name="AuthEditProfile"
        component={AuthEditProfileScreen}
        options={{ headerShown: false }}
      />

      <ApprovalStack.Screen
        name="Camera"
        component={CameraScreen}
        options={{ headerShown: false }}
      />

      <ApprovalStack.Screen
        name="Logout"
        component={LogoutScreen}
        options={{ headerShown: false }}
      />
    </ApprovalStack.Navigator>
  );
};