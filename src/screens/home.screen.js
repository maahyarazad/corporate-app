import React, {
  PureComponent,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TouchableHighlight,
  View,
} from "react-native";
import { FeaturedBanner } from "../features/home/components/banner.component";
import { HomeCategory } from "../features/home/components/category.component";
import styled from "styled-components/native";
import { Spacer } from "../components/spacer/spacer.component";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { UserContext } from "../services/user/user.context";
import { AuthContext } from "../services/auth/auth.context";
import { navigate } from "../navigation/navigate";
import { SearchButton } from "../components/searchbutton";
import {
  MemoizedTopPartner,
  TopPartners,
} from "../features/home/components/toppartners.component";
import { config, typeEnum } from "../utils/constants";
import { isDevice } from "expo-device";
import * as SecureStorage from "expo-secure-store";
import * as Notifications from "expo-notifications";
import { NotificationsService } from "../services/notifications/notifications.service";
import { TranslationContext } from "../services/translation/translation.context";
import { Hotpicks } from "../components/hotpick/hotpicks.component";
import { UrlListener } from "../utils/urlRouter";
import { addNotificationResponseReceivedListener } from "expo-notifications";
import { LocationContext } from "../services/location/location.context";
import { StatusBar } from "expo-status-bar";
import { Label } from "../components/typography/label.component";
import useAuth from "../../hooks/useAuth";
import CustomButton from "../components/customButton.component";
import { theme } from "../infrastructure/theme";
import useUser from "../../hooks/useUser";
import moment from "moment";
import { CustomModal } from "../components/modal/customModal.component";
import { OrderCardModal } from "../features/offers/components/offerModalForm";
import { useNavigation } from "@react-navigation/native";

const HomeContainer = styled(FlatList)`
  flex: 1;
`;

const NearMeButton = styled(TouchableHighlight)`
  background-color: white;
  padding: 10px 20px;
  justify-content: center;
  align-items: center;
  border-radius: 5px;
  box-shadow: 2px 2px 2px rgba(0, 0, 0, 0.4);
`;

const RenderHome = ({ handleSearch }) => {
  const handleNavigateMap = () => {
    navigate("Map");
  };

  return (
    <>
      <UrlListener />
      <StatusBar style="dark" />

      <ScrollView nestedScrollEnabled={true} removeClippedSubviews={true}>
        <Spacer position={"top"} size={"medium"}>
          <Spacer position={"left"} size={"medium"}>
            <Spacer position={"right"} size={"medium"}>
              <View style={{ flexDirection: "row" }}>
                <SearchButton onPress={handleSearch} />
                <Spacer position={"left"} size={"small"} />
                <NearMeButton
                  underlayColor={"#EEE"}
                  onPress={handleNavigateMap}
                >
                  <MaterialCommunityIcons
                    name="map-search"
                    size={25}
                    color={"#555"}
                  />
                </NearMeButton>
              </View>
            </Spacer>
          </Spacer>
        </Spacer>
        <FeaturedBanner />
        <Hotpicks />
        <HomeCategory />
        <TopPartners />
      </ScrollView>
    </>
  );
};

const MemoeizedHome = React.memo(RenderHome);

const TestComp = () => {
  useEffect(() => {
    alert("test");

    return () => {};
  }, []);

  return (
    <View>
      <Text>Test</Text>
    </View>
  );
};

export const HomeScreen = ({ ...props }) => {
  const { navigation } = props;
  const [refreshing, setRefreshing] = useState(0);
  const [refreshCount, setRefreshCount] = useState(0);
  const { i18n } = useContext(TranslationContext);
  const { eventList } = useContext(LocationContext);
  const testing = useRef(false);
  const { isSkip, goToVerification } = useAuth();
  const { userData } = useUser();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    //Handle Push Notification Listener
    const subscription = addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    const getPushToken = async () => {
      try {
        const pToken = await SecureStorage.getItemAsync("pushtoken");
        if (pToken != undefined) {
          console.log("push token is available");
          return;
        }

        console.log("push token is blank/invalid");
        registerForPushNotificationsAsync();
      } catch (error) {
        console.log(error);
      }
    };

    getPushToken();

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  const handleNotificationResponse = (response) => {
    const notificationData = response.notification.request.content.data;

    console.log("NOTIFICATION", notificationData);
    switch (notificationData.path) {
      case "partner":
        navigate("Location View", {
          locId: notificationData.id,
        });
        break;
      case "event":
        navigate("Event Detail", {
          id: notificationData.id,
        });
        break;
    }

    console.log(notificationData.path);
  };

  const registerForPushNotificationsAsync = async () => {
    if (isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        alert("Failed to get push token for push notification!");
        return;
      }
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log(token, user.user_id);

      const response = await NotificationsService.storePushToken(
        user.user_id,
        token
      );
      if (!response.success) {
        Alert.alert(response.title, response.message);
      }
      // console.log("whattt");
      // console.log(user);
      await SecureStorage.setItemAsync("pushtoken", token);
    } else {
      alert("Must use physical device for Push Notifications");
    }

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }
  };

  const onRefresh = () => {
    testing.current = false;
    setRefreshing((prev) => prev + 1);
  };

  const handleSearch = () => {
    // setSectionTitle("Search All");

    navigate("LocationList", {
      type: typeEnum.category,
      search: 0,
      page: 1,
      limit: 20,
      source: 2,
      headerTitle: i18n.t("search-all"),
      focus: true,
    });
  };

  const closeModal = () => {
    setShowModal(false);
  };
  const handleOrderCard = () => {
    setShowModal(true);
  };
  const WarningBar = ({ msg }) => {
    return (
      <View
        style={{
          backgroundColor: "red",
          padding: 12,
          flexDirection: "row",
          justifyContent: "space-between",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.4,
          shadowRadius: 5,
          zIndex: 1,
        }}
      >
        <View
          style={{
            flex: 1,
          }}
        >
          <Label color={"white"}>{msg}</Label>
        </View>
        <CustomButton
          onPress={handleOrderCard}
          style={{
            backgroundColor: theme.colors.icons.active,
            borderWidth: 0,
            shadowOpacity: 0.5,
            shadowColor: "black",
            shadowOffset: {
              width: 2,
              height: 2,
            },
            shadowRadius: 5,
          }}
          label={"Order Card"}
          labelStyle={{ color: "white" }}
        />
      </View>
    );
  };

  return (
    <>
      {isSkip ? (
        <WarningBar
          msg={
            "You have not uploaded a card yet. To avail offers, please upload a card."
          }
        />
      ) : userData.expired > 0 ? (
        <WarningBar
          msg={`Your card has already expired on ${moment(
            userData.expiry
          ).format("MMM YYYY")}. Please upload your new card.`}
        />
      ) : (
        moment(userData.expiry).diff(moment(), "days") >= 5 && (
          <WarningBar
            msg={`Your card will expire in ${moment(userData.expiry).diff(
              moment(),
              "days"
            )} Days. Please order a new card and upload it.`}
          />
        )
      )}
      <CustomModal showModal={showModal}>
        <OrderCardModal onClose={closeModal} />
      </CustomModal>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={testing.current} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <MemoeizedHome handleSearch={handleSearch} />
      </ScrollView>
    </>
  );
};
