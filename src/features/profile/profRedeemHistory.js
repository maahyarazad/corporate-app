import { MaterialCommunityIcons } from "@expo/vector-icons";
import moment from "moment";
import React, { useContext, useEffect, useState } from "react";
import {
  // ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ActivityIndicator } from "react-native-paper";
import { BreakdownRow } from "../../components/breakdownRow";
import { Label } from "../../components/typography/label.component";
import { theme } from "../../infrastructure/theme";
import { AuthContext } from "../../services/auth/auth.context";
import {
  i18n,
  TranslationContext,
} from "../../services/translation/translation.context";
import { config } from "../../utils/constants";
import useRequest from "../../../hooks/useRequest";
import useUser from "../../../hooks/useUser";
import useMath from "../../../hooks/useMath";
import { isCancel } from "../../utils/cancellation";

const TOGGLE_BUTTON_BREAKDOWN_HEIGHT = 40;

export const ProfRedeemHistory = () => {
  const { user, setUser } = useContext(AuthContext);
  const [headerList, setHeaderList] = useState();
  const [data, setData] = useState();
  const [overall, setOverall] = useState(null);
  const request = useRequest();
  const { userData } = useUser();
  const { lang } = useContext(TranslationContext);

  useEffect(() => {
    const controller = new AbortController();

    const getUserTransactions = async () => {
      try {
        const response = await request(
          `/v2/user/history?lang=${lang}`,
          "get",
          undefined,
          undefined,
          controller.signal
        );

        if (response.success) {
          setData(response.data.rows);
          setHeaderList(response.data.headers);
          setOverall(response.data.overall);
        }
      } catch (error) {
        if (isCancel(error)) return;
        console.log("Failed to get redemption history:", error);
      }
    };

    getUserTransactions();

    return () => controller.abort();
  }, []);

  const renderRecord = (item) => {
    return <BreakdownRow item={item} />;
  };

  const renderTotal = (total) => {
    return (
      <View style={styles.rowBetween}>
        <Label weight="bold">Total</Label>
        <Label>{parseFloat(total).toFixed(2)}</Label>
      </View>
    );
  };

  const renderHeader = (item) => {
    return (
      <>
        <View style={styles.rowBetween2}>
          <View style={styles.rowCenter}>
            <Label weight="bold">{item.title}</Label>
            <View style={styles.spacer} />
            
            <MaterialCommunityIcons
              name={
                item.total > 0 ? "emoticon-outline" : "emoticon-sad-outline"
              }
              size={25}
            />
          </View>
          <View style={styles.box}>
            <Label size="mini" weight="regular">
              Total
            </Label>
            <Label weight="bold">{item.total.toFixed(2)}</Label>
          </View>
        </View>
      </>
    );
  };

  const RenderRow = ({ item }) => {
    return (
      <View
        style={{
          backgroundColor: item.type === 0 ? item.color : "white",
        }}
      >
        {item.type === 0
          ? renderHeader(item)
          : item.type === 1
          ? renderRecord(item)
          : renderTotal(item.total)}
      </View>
    );
  };

  const [viewHeight, setViewHeight] = useState(0);

  const animatedValue = useSharedValue(viewHeight);

  const [displayBreakdown, setDisplayBreakdown] = useState(false);
  const { limitToTwoDecimalPlaces } = useMath();

  // Defect D3, behaviour preserved deliberately: the original wrote
  // `.start(setDisplayBreakdown(...))`, which invokes the setter immediately
  // and passes its undefined return as the completion callback, so the state
  // flipped at animation START rather than end. Kept as-is rather than
  // silently changing UX inside a refactor - see T045 for the follow-up.
  const showBreakdown = () => {
    setDisplayBreakdown(!displayBreakdown);
    animatedValue.value = withTiming(TOGGLE_BUTTON_BREAKDOWN_HEIGHT, {
      duration: 400,
      easing: Easing.inOut(Easing.ease),
    });
  };

  const hideBreakdown = () => {
    setDisplayBreakdown(!displayBreakdown);
    animatedValue.value = withTiming(viewHeight, {
      duration: 400,
      easing: Easing.inOut(Easing.ease),
    });
  };

  const breakdownAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: animatedValue.value }],
  }));

  const toggleBreakdown = () => {
    if (displayBreakdown) {
      hideBreakdown();
    } else {
      showBreakdown();
    }
  };

  return (
    <View
      style={styles.container}
      onLayout={(event) => {
        const { x, y, width, height } = event.nativeEvent.layout;
        // console.log(x, y, width, height);
        setViewHeight(height);
        animatedValue.value = height;
      }}
    >
      <>
        <View style={styles.centerBox}>
          <Label size="subtitle">{i18n.t("profile-tabs.savings-text")}</Label>
          <Label size="subtitle">
            ({moment(new Date()).format("DD.MMM YYYY")})
          </Label>
          <View style={styles.pad}>
            {overall != undefined ? (
              <>
                <Label
                  weight="bold"
                  size="h4"
                  style={{
                    textAlign: "center",
                    color: theme.colors.icons.active,
                  }}
                >
                  {limitToTwoDecimalPlaces(overall)}
                </Label>
                <Label
                  weight="bold"
                  size="h5"
                  style={{
                    textAlign: "center",
                    color: theme.colors.icons.active,
                  }}
                >
                  {config.CURRENCY}
                </Label>
              </>
            ) : (
              <ActivityIndicator
                animating={true}
                size="large"
                color={theme.colors.icons.active}
              />
            )}
          </View>
        </View>

        <Animated.View
          style={[
            {
              position: "absolute",
              bottom: TOGGLE_BUTTON_BREAKDOWN_HEIGHT,
              width: "100%",
              height: viewHeight,
            },
            breakdownAnimatedStyle,
          ]}
        >
          <TouchableOpacity
            containerStyle={{}}
            onPress={toggleBreakdown}
            style={[styles.centerBox3, { height: TOGGLE_BUTTON_BREAKDOWN_HEIGHT }]}
          >
            <View style={styles.rowCenter2}>
              <MaterialCommunityIcons
                name={displayBreakdown ? "chevron-down" : "chevron-up"}
                size={25}
              />
              <Label>
                {displayBreakdown
                  ? i18n.t("profile-tabs.history-breakdown.hide")
                  : i18n.t("profile-tabs.history-breakdown.show")}
                {` `}
                {i18n.t("profile-tabs.history-breakdown.breakdown")}
              </Label>
            </View>
          </TouchableOpacity>
          <ScrollView
            stickyHeaderIndices={headerList}
            contentContainerStyle={styles.contentContainerCenterBox}
            style={styles.box2}
          >
            {data ? (
              <ScrollView style={styles.box3}>
                {data.map((item, index) => {
                  return <RenderRow key={index} item={item} />;
                })}
                <View style={styles.centerBox2}>
                  <Label style={styles.label}>
                    -- {i18n.t("end-of-list")} --
                  </Label>
                </View>
              </ScrollView>
            ) : (
              <ActivityIndicator
                color={theme.colors.icons.active}
                size="large"
                animating={true}
              />
            )}
          </ScrollView>
        </Animated.View>
      </>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },
  rowBetween: {
    alignSelf: "flex-end",
    justifyContent: "space-between",
    width: "40%",
    flexDirection: "row",
  },
  rowBetween2: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  spacer: {
    marginLeft: 6,
  },
  box: {
    alignItems: "flex-end",
  },
  centerBox: {
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    flex: 1,
  },
  pad: {
    paddingVertical: 16,
  },
  rowCenter2: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  contentContainerCenterBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  box2: {
    alignSelf: "stretch",
    height: "100%",
    backgroundColor: "white",
  },
  box3: {
    alignSelf: "stretch",
    height: "100%",
  },
  centerBox2: {
    alignSelf: "stretch",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
  },
  label: {
    color: "#aaa",
  },
  centerBox3: {
    alignItems: "center",
    justifyContent: "center",
    width: "auto",
    backgroundColor: "#eee",
  },
});
