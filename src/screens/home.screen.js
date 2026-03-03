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
  SafeAreaView,
  ScrollView,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import FeaturedBanner from "../features/home/components/banner.component";
import { HomeCategory } from "../features/home/components/category.component";
import styled from "styled-components/native";
import { Spacer } from "../components/spacer/spacer.component";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { UserContext } from "../services/user/user.context";
import { AuthContext } from "../services/auth/auth.context";
import { navigate } from "../navigation/navigate";
import { SearchButton } from "../components/searchbutton";
import TopPartners from "../features/home/components/toppartners.component";
import { config, typeEnum } from "../utils/constants";
import { TranslationContext } from "../services/translation/translation.context";
import Hotpicks from "../components/hotpick/hotpicks.component";
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
import HomeHeader from "../features/home/components/header.component";
import useRequest from "../../hooks/useRequest";
import { Platform } from "react-native";

const HomeContainer = styled(FlatList)`
  flex: 1;
`;

export const NearMeButton = styled(TouchableHighlight)`
  background-color: white;
  padding: 10px 20px;
  justify-content: center;
  align-items: center;
  border-radius: 5px;

  /* Shadow for iOS */
  ${Platform.OS === "ios" &&
  `
    shadow-color: #000;
    shadow-offset: 2px 2px;
    shadow-opacity: 0.4;
    shadow-radius: 2px;
  `}

  /* Shadow for Android */
  ${Platform.OS === "android" && `elevation: 3;`}
`;
const RenderHome = ({ handleSearch }) => {
  const [bannerData, setBannerData] = useState(null);
  const [hotpickData, setHotpickData] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [topPartnersData, setTopPartnersData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { lang } = useContext(TranslationContext);
  const { userData } = useUser();
  const request = useRequest();

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    // if (!isLogout.current) {
    fetchData();
    // }

    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchData = async () => {
    try {
      setRefreshing(true);

      const data = {
        id: config.APP_ID,
        status: 1,
        user_id: userData.user_id,
      };

      const bannerFetch = request(`/v2/app/get-banners`, "post", data);
      const hotpicksFetch = request(
        `/v2/offer/hotpicks?app_id=${config.APP_ID}&lang=${lang}&limit=10`,
        "get"
      );
      const categoryFetch = request(
        `/v2/partner/category-available2?app_id=${config.APP_ID}&lang=${lang}`,
        "get"
      );
      const topPartnersFetch = request(
        `/v2/partner/top-per-category?app_id=${config.APP_ID}&lang=${lang}&count=5`,
        "get"
      );

      const [bannerResult, hotpickResult, categoryResult, topPartnersResult] =
        await Promise.all([
          bannerFetch,
          hotpicksFetch,
          categoryFetch,
          topPartnersFetch,
        ]);

      console.log("hotpick", hotpickResult);

      if (isMounted.current) {
        if (bannerResult.success) setBannerData(bannerResult.data);
        if (hotpickResult.success) setHotpickData(hotpickResult.data);
        if (categoryResult.success) setCategoryData(categoryResult.result);
        if (topPartnersResult.success)
          setTopPartnersData(topPartnersResult.result);
      }
    } catch (error) {
      setRefreshing(false);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    fetchData();
  };

  return (
    <>
      <UrlListener />
      <StatusBar style="dark" />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={{ backgroundColor: "#eee", height: "100%" }}
        nestedScrollEnabled={true}
        removeClippedSubviews={true}
      >
        <FeaturedBanner bannerData={bannerData} />
        <Hotpicks hotpickData={hotpickData} />
        <HomeCategory categoryData={categoryData} />
        <TopPartners topPartnersData={topPartnersData} />
      </ScrollView>
    </>
  );
};

const MemoeizedHome = React.memo(RenderHome);

export const HomeScreen = ({ ...props }) => {
  const { navigation } = props;
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

  const RenderWarning = () => {
    if (userData) {
      if (userData.expired) {
        return (
          <WarningBar
            msg={`Your card has already expired on ${moment(
              userData.expiry
            ).format("MMM YYYY")}. Please upload your new card.`}
          />
        );
      } else if (!closeWarning && !isSkip) {
        if (expireWarning) {
          return (
            <WarningBar
              canClose={true}
              msg={`Your card will expire in ${moment(userData.expiry).diff(
                moment(),
                "days"
              )} days. Please order a new card and upload it.`}
            />
          );
        } else if (moment(userData?.expiry).diff(moment(), "days") <= 10) {
          return (
            <WarningBar
              msg={`Your card will expire in ${calculateRemainingTime()}. Please order a new card and upload it.`}
            />
          );
        }
      }
    }

    return null;
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
    <SafeAreaView style={{ backgroundColor: "white", flex: 1 }}>
      <RenderWarning />
      <CustomModal showModal={showModal}>
        <OrderCardModal onClose={closeModal} />
      </CustomModal>
      <MemoeizedHome handleSearch={handleSearch} />
    </SafeAreaView>
  );
};
