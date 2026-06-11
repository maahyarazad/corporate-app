import React, { useContext, useEffect, useRef, useState } from "react";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  TouchableHighlight,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import styled from "styled-components/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import moment from "moment";
import * as SecureStore from "expo-secure-store";

import FeaturedBanner from "../features/home/components/banner.component";
import { HomeCategory } from "../features/home/components/category.component";
import TopPartners from "../features/home/components/toppartners.component";
import Hotpicks from "../components/hotpick/hotpicks.component";
import { UrlListener } from "../utils/urlRouter";
import { navigate } from "../navigation/navigate";
import { config, typeEnum } from "../utils/constants";
import { TranslationContext } from "../services/translation/translation.context";
import { LocationContext } from "../services/location/location.context";
import { Label } from "../components/typography/label.component";
import CustomButton from "../components/customButton.component";
import { theme } from "../infrastructure/theme";
import { CustomModal } from "../components/modal/customModal.component";
import { OrderCardModal } from "../features/offers/components/offerModalForm";
import useAuth from "../../hooks/useAuth";
import useUser from "../../hooks/useUser";
import useRequest from "../../hooks/useRequest";

export const NearMeButton = styled(TouchableHighlight)`
  background-color: white;
  padding: 10px 20px;
  justify-content: center;
  align-items: center;
  border-radius: 5px;

  ${Platform.OS === "ios" &&
  `
    shadow-color: #000;
    shadow-offset: 2px 2px;
    shadow-opacity: 0.4;
    shadow-radius: 2px;
  `}

  ${Platform.OS === "android" && `elevation: 3;`}
`;

export const RenderHome = () => {
  const [bannerData, setBannerData] = useState([]);
  const [hotpickData, setHotpickData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topPartnersData, setTopPartnersData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const { lang } = useContext(TranslationContext);
  const { userData } = useUser();
  const request = useRequest();

  const isMounted = useRef(false);
  const lastLoadedKey = useRef("");

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchData = async () => {
    if (!userData?.user_id || !lang) return;

    try {
      if (isMounted.current) {
        setRefreshing(true);
      }

      const payload = {
        id: config.APP_ID,
        status: 1,
        user_id: userData.user_id,
      };

      const results = await Promise.allSettled([
        request(`/v2/app/get-banners`, "post", payload),
        request(
          `/v2/offer/hotpicks?app_id=${config.APP_ID}&lang=${lang}&limit=10`,
          "get"
        ),
        request(
          `/v2/partner/category-available2?app_id=${config.APP_ID}&lang=${lang}`,
          "get"
        ),
        request(
          `/v2/partner/top-per-category?app_id=${config.APP_ID}&lang=${lang}&count=5`,
          "get"
        ),
      ]);

      if (!isMounted.current) return;

      const [bannerResult, hotpickResult, categoryResult, topPartnersResult] =
        results;

      if (bannerResult.status === "fulfilled") {
        if (bannerResult.value?.success) {
          setBannerData(bannerResult.value?.data ?? []);
        } else {
        //   console.log("Banner request unsuccessful:", bannerResult.value);
          setBannerData([]);
        }
      } else {
        // console.log("Banner request failed:", bannerResult.reason);
        setBannerData([]);
      }

      if (hotpickResult.status === "fulfilled") {
        if (hotpickResult.value?.success) {
          setHotpickData(hotpickResult.value?.data ?? []);
        } else {
        //   console.log("Hotpicks request unsuccessful:", hotpickResult.value);
          setHotpickData([]);
        }
      } else {
        // console.log("Hotpicks request failed:", hotpickResult.reason);
        setHotpickData([]);
      }

      if (categoryResult.status === "fulfilled") {
        if (categoryResult.value?.success) {
          setCategoryData(categoryResult.value?.result ?? []);
        } else {
        //   console.log("Category request unsuccessful:", categoryResult.value);
          setCategoryData([]);
        }
      } else {
        // console.log("Category request failed:", categoryResult.reason);
        setCategoryData([]);
      }

      if (topPartnersResult.status === "fulfilled") {
        if (topPartnersResult.value?.success) {
          setTopPartnersData(topPartnersResult.value?.result ?? []);
        } else {
        //   console.log(
        //     "Top partners request unsuccessful:",
        //     topPartnersResult.value
        //   );
          setTopPartnersData([]);
        }
      } else {
        // console.log("Top partners request failed:", topPartnersResult.reason);
        setTopPartnersData([]);
      }
    } catch (error) {
      console.log("Home fetch unexpected error:", error);
    } finally {
      if (isMounted.current) {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    if (!userData?.user_id || !lang) return;

    const currentKey = `${userData.user_id}-${lang}`;
    if (lastLoadedKey.current === currentKey) return;

    lastLoadedKey.current = currentKey;
    fetchData();
  }, [userData?.user_id, lang]);

  const onRefresh = async () => {
    await fetchData();
  };

  return (
    <>
      <UrlListener />
      <StatusBar style="dark" />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={{ backgroundColor: "#eee", flex: 1 }}
        nestedScrollEnabled
      >
        <FeaturedBanner bannerData={bannerData} />
        <Hotpicks hotpickData={hotpickData} />
        <HomeCategory categoryData={categoryData} />
        <TopPartners topPartnersData={topPartnersData} />
      </ScrollView>
    </>
  );
};

const MemoizedHome = React.memo(RenderHome);

export const HomeScreen = (props) => {
  const { i18n } = useContext(TranslationContext);
  const { isSkip } = useAuth();
  const { userData } = useUser();

  const [showModal, setShowModal] = useState(false);
  const [closeWarning, setCloseWarning] = useState(false);
  const [expireWarning, setExpireWarning] = useState(0);

  useEffect(() => {
    const checkExpireWarning = async () => {
      if (!userData?.expiry) return;

      const remainingDays = moment(userData.expiry).diff(moment(), "days");

      if (remainingDays > 10 && remainingDays <= 40) {
        const localExpireWarning = await getLocalExpireWarning();
        if (!localExpireWarning) {
          setExpireWarning(1);
        }
      } else {
        setExpireWarning(0);
        saveWarning(0);
      }
    };

    checkExpireWarning();
  }, [userData?.expiry]);

  const getLocalExpireWarning = async () => {
    try {
      const value = await SecureStore.getItemAsync("expireWarning");
      return parseInt(value ?? "0", 10);
    } catch (error) {
      console.log("Failed to get local storage [Home]:", error);
      return 0;
    }
  };

  const saveWarning = async (value) => {
    try {
      await SecureStore.setItemAsync("expireWarning", value.toString());
    } catch (error) {
      console.log("Failed to save local storage [Home]:", error);
    }
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
          return "less than a minute";
        }

        return `${remainingMinutes} minutes`;
      }

      return `${remainingHours} hours`;
    }

    return `${remainingDays} days`;
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
          <View style={{ flex: 1 }}>
            <Label color="white">{msg}</Label>
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
            label="Order Card"
            labelStyle={{ color: "white" }}
          />

          {canClose && (
            <View style={{ justifyContent: "center" }}>
              <TouchableOpacity onPress={handleCloseWarning}>
                <MaterialCommunityIcons
                  name="close"
                  size={25}
                  color="white"
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const RenderWarning = () => {
    if (!userData) return null;

    if (userData.expired) {
      return (
        <WarningBar
          msg={`Your card has already expired on ${moment(
            userData.expiry
          ).format("MMM YYYY")}. Please upload your new card.`}
        />
      );
    }

    if (!closeWarning && !isSkip) {
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
      }

      if (moment(userData?.expiry).diff(moment(), "days") <= 10) {
        return (
          <WarningBar
            msg={`Your card will expire in ${calculateRemainingTime()}. Please order a new card and upload it.`}
          />
        );
      }
    }

    return null;
  };

  return (
    <SafeAreaView style={{ backgroundColor: "white", flex: 1 }}>
      <RenderWarning />
      <CustomModal showModal={showModal}>
        <OrderCardModal onClose={closeModal} />
      </CustomModal>
      <MemoizedHome />
    </SafeAreaView>
  );
};