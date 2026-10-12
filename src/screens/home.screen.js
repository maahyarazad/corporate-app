import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  RefreshControl,
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

import { SafeArea } from "../components/safearea.component";
import FeaturedBanner from "../features/home/components/banner.component";
import { HomeCategory } from "../features/home/components/category.component";
import TopPartners from "../features/home/components/toppartners.component";
import Hotpicks from "../components/hotpick/hotpicks.component";
import { UrlListener } from "../utils/urlRouter";
import { config } from "../utils/constants";
import { TranslationContext } from "../services/translation/translation.context";
import { Label } from "../components/typography/label.component";
import CustomButton from "../components/customButton.component";
import { theme } from "../infrastructure/theme";
import { CustomModal } from "../components/modal/customModal.component";
import { OrderCardModal } from "../features/offers/components/offerModalForm";
import useAuth from "../../hooks/useAuth";
import useUser from "../../hooks/useUser";
import useRequest from "../../hooks/useRequest";
import { ignoreCancel } from "../utils/cancellation";

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

// ---- static styles (hoisted so they aren't rebuilt on every render) --------
const scrollViewStyle = { backgroundColor: "#eee", flex: 1 };
const safeAreaStyle = { backgroundColor: "white", flex: 1 };
const warningBarStyle = {
  backgroundColor: "red",
  padding: 12,
  flexDirection: "row",
  justifyContent: "space-between",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.4,
  shadowRadius: 5,
  zIndex: 1,
};
const warningRowStyle = { flexDirection: "row", gap: 8, flex: 1 };
const warningMsgStyle = { flex: 1 };
const warningCloseWrapStyle = { justifyContent: "center" };
const orderButtonStyle = {
  backgroundColor: theme.colors.icons.active,
  borderWidth: 0,
  shadowOpacity: 0.5,
  shadowColor: "black",
  shadowOffset: { width: 2, height: 2 },
  shadowRadius: 5,
};
const orderButtonLabelStyle = { color: "white" };

// ---- WarningBar ------------------------------------------------------------
// Lifted out of HomeScreen. Defining it inside a component recreates the type
// on every render, which remounts the subtree; as a module-level memoized
// component it only re-renders when its props actually change.
const WarningBar = React.memo(
  ({ msg, canClose = false, onOrderCard, onCloseWarning }) => (
    <View style={warningBarStyle}>
      <View style={warningRowStyle}>
        <View style={warningMsgStyle}>
          <Label color="white">{msg}</Label>
        </View>

        <CustomButton
          onPress={onOrderCard}
          style={orderButtonStyle}
          label="Order Card"
          labelStyle={orderButtonLabelStyle}
        />

        {canClose && (
          <View style={warningCloseWrapStyle}>
            <TouchableOpacity onPress={onCloseWarning}>
              <MaterialCommunityIcons name="close" size={25} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  )
);

export const RenderHome = () => {
  const [bannerData, setBannerData] = useState([]);
  const [hotpickData, setHotpickData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topPartnersData, setTopPartnersData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const { lang } = useContext(TranslationContext);
  const { userData } = useUser();
  const request = useRequest();

  const lastLoadedKey = useRef("");

  const fetchData = useCallback(
    async (signal) => {
      if (!userData?.user_id || !lang) return;

      try {
        setRefreshing(true);

        const payload = {
          id: config.APP_ID,
          status: 1,
          user_id: userData.user_id,
        };

        const results = await Promise.allSettled([
          request(`/v2/app/get-banners`, "post", payload, undefined, signal),
          request(
            `/v2/offer/hotpicks?app_id=${config.APP_ID}&lang=${lang}&limit=10`,
            "get",
            undefined,
            undefined,
            signal
          ),
          request(
            `/v2/partner/category-available2?app_id=${config.APP_ID}&lang=${lang}`,
            "get",
            undefined,
            undefined,
            signal
          ),
          request(
            `/v2/partner/top-per-category?app_id=${config.APP_ID}&lang=${lang}&count=5`,
            "get",
            undefined,
            undefined,
            signal
          ),
        ]);

        // `allSettled` never rejects, so an abort surfaces as four rejected
        // results rather than a thrown CanceledError. Without this bail-out the
        // handlers below would read that as "every request failed" and blank
        // the screen out from under a fresher load.
        if (signal?.aborted) return;

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
        // An aborted run has been superseded; leave `refreshing` to the run that
        // replaced it, otherwise the spinner clears while a load is still going.
        if (!signal?.aborted) {
          setRefreshing(false);
        }
      }
    },
    [userData?.user_id, lang, request]
  );

  // Keep a live reference to fetchData so the trigger effect and pull-to-refresh
  // always call the latest version without re-subscribing the effect whenever
  // `request` gets a new identity.
  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    if (!userData?.user_id || !lang) return;

    const currentKey = `${userData.user_id}-${lang}`;
    if (lastLoadedKey.current === currentKey) return;

    lastLoadedKey.current = currentKey;

    const controller = new AbortController();
    fetchDataRef.current(controller.signal).catch(ignoreCancel);

    return () => controller.abort();
  }, [userData?.user_id, lang]);

  // Pull-to-refresh runs outside any effect, so it carries its own controller:
  // a second pull supersedes the first, and unmounting aborts whatever is live.
  const refreshControllerRef = useRef(null);

  const onRefresh = useCallback(() => {
    refreshControllerRef.current?.abort();

    const controller = new AbortController();
    refreshControllerRef.current = controller;
    fetchDataRef.current(controller.signal).catch(ignoreCancel);
  }, []);

  useEffect(() => () => refreshControllerRef.current?.abort(), []);

  const refreshControl = useMemo(
    () => <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />,
    [refreshing, onRefresh]
  );

  return (
    <>
      <UrlListener />
      <StatusBar style="dark" />
      <ScrollView
        refreshControl={refreshControl}
        style={scrollViewStyle}
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

  const getLocalExpireWarning = useCallback(async () => {
    try {
      const value = await SecureStore.getItemAsync("expireWarning");
      return parseInt(value ?? "0", 10);
    } catch (error) {
      console.log("Failed to get local storage [Home]:", error);
      return 0;
    }
  }, []);

  const saveWarning = useCallback(async (value) => {
    try {
      await SecureStore.setItemAsync("expireWarning", value.toString());
    } catch (error) {
      console.log("Failed to save local storage [Home]:", error);
    }
  }, []);

  useEffect(() => {
    // SecureStore reads can't be aborted, so this only stops a resolved-but-
    // stale read from writing state after the effect has been superseded.
    let cancelled = false;

    const checkExpireWarning = async () => {
      if (!userData?.expiry) return;

      const remainingDays = moment(userData.expiry).diff(moment(), "days");

      if (remainingDays > 10 && remainingDays <= 40) {
        const localExpireWarning = await getLocalExpireWarning();
        if (cancelled) return;
        if (!localExpireWarning) {
          setExpireWarning(1);
        }
      } else {
        setExpireWarning(0);
        saveWarning(0);
      }
    };

    checkExpireWarning();

    return () => {
      cancelled = true;
    };
  }, [userData?.expiry, getLocalExpireWarning, saveWarning]);

  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleCloseWarning = useCallback(() => {
    setCloseWarning(true);
    saveWarning(1);
  }, [saveWarning]);

  const handleOrderCard = useCallback(() => {
    setShowModal(true);
  }, []);

  const calculateRemainingTime = useCallback(() => {
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
  }, [userData?.expiry]);

  // Was <RenderWarning />, a component redefined every render. Now a memoized
  // element that only recomputes when the values it depends on change.
  const warningContent = useMemo(() => {
    if (!userData) return null;

    if (userData.expired) {
      return (
        <WarningBar
          onOrderCard={handleOrderCard}
          onCloseWarning={handleCloseWarning}
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
            canClose
            onOrderCard={handleOrderCard}
            onCloseWarning={handleCloseWarning}
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
            onOrderCard={handleOrderCard}
            onCloseWarning={handleCloseWarning}
            msg={`Your card will expire in ${calculateRemainingTime()}. Please order a new card and upload it.`}
          />
        );
      }
    }

    return null;
  }, [
    userData,
    isSkip,
    closeWarning,
    expireWarning,
    calculateRemainingTime,
    handleOrderCard,
    handleCloseWarning,
  ]);

  return (
    <SafeArea style={safeAreaStyle}>
      {warningContent}
      <CustomModal showModal={showModal}>
        <OrderCardModal onClose={closeModal} />
      </CustomModal>
      <MemoizedHome />
    </SafeArea>
  );
};