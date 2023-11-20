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
  TouchableOpacity,
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
import { TranslationContext } from "../services/translation/translation.context";
import { Hotpicks } from "../components/hotpick/hotpicks.component";
import { UrlListener } from "../utils/urlRouter";
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
import * as SecureStore from "expo-secure-store";

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
  const [closeWarning, setCloseWarning] = useState(false);
  const [expireWarning, setExpireWarning] = useState(0);

  useEffect(() => {
    let isMounted = true;
    //Handle Push Notification Listener

    const checkExpireWarning = async () => {
      const remainingDays = moment(userData?.expiry).diff(moment(), "days");

      if (userData?.expiry && remainingDays > 10 && remainingDays <= 40) {
        const _expireWarning = await getLocalExpireWarning();
        if (!_expireWarning) {
          setExpireWarning(1);
        }
      } else {
        //reset expire warning local store
        setExpireWarning(0);
        saveWarning(0);
      }
    };
    checkExpireWarning();

    return () => {
      isMounted = false;
    };
  }, []);

  const getLocalExpireWarning = async () => {
    try {
      const _expireWarning = await SecureStore.getItemAsync("expireWarning");

      return parseInt(_expireWarning ?? 0);
    } catch (error) {
      console.error("Failed to get local storage [Home]:", error);
    }
  };

  const saveWarning = async (value) => {
    try {
      await SecureStore.setItemAsync("expireWarning", value.toString());
    } catch (error) {
      console.error("Failed to save local storage [Home]:", error);
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

  const handleCloseWarning = () => {
    setCloseWarning(true);
    saveWarning(1);
  };

  const handleOrderCard = () => {
    setShowModal(true);
  };
  const WarningBar = ({ msg, canClose = false }) => {
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
        <View style={{ flexDirection: "row", gap: 8, flex: 1 }}>
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
          {canClose && (
            <View style={{ justifyContent: "center" }}>
              <TouchableOpacity onPress={handleCloseWarning}>
                <MaterialCommunityIcons
                  name="close"
                  size={25}
                  color={"white"}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const calculateRemainingTime = () => {
    const remainingDays = moment(userData?.expiry).diff(moment(), "days");

    if (!(remainingDays > 0)) {
      const remainingHours = moment(userData?.expiry).diff(moment(), "hours");

      if (!(remainingHours > 0)) {
        const remainingMinutes = moment(userData?.expiry).diff(
          moment(),
          "minutes"
        );

        if (!(remainingMinutes > 0)) {
          return `less than a minute`;
        }

        return remainingMinutes + ` minutes`;
      }

      return remainingHours + ` hours`;
    }

    return remainingDays + ` days`;
  };

  return (
    <>
      {userData &&
      userData?.expiry &&
      expireWarning &&
      !closeWarning &&
      !isSkip ? (
        <WarningBar
          canClose={true}
          msg={`Your card will expire in ${moment(userData.expiry).diff(
            moment(),
            "days"
          )} days. Please order a new card and upload it.`}
        />
      ) : userData &&
        moment(userData?.expiry).diff(moment(), "days") <= 10 &&
        !closeWarning &&
        !isSkip ? (
        <WarningBar
          msg={`Your card will expire in ${calculateRemainingTime()}. Please order a new card and upload it.`}
        />
      ) : isSkip ? (
        <WarningBar
          msg={
            "You have not uploaded a card yet. To avail offers, please upload a card."
          }
        />
      ) : (
        userData &&
        userData?.expired > 0 && (
          <WarningBar
            msg={`Your card has already expired on ${moment(
              userData.expiry
            ).format("MMM YYYY")}. Please upload your new card.`}
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
