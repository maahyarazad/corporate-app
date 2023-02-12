import { MaterialCommunityIcons } from "@expo/vector-icons";
import moment from "moment";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  // ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { BreakdownRow } from "../../components/breakdownRow";
import { Spacer } from "../../components/spacer/spacer.component";
import { Label } from "../../components/typography/label.component";
import { theme } from "../../infrastructure/theme";
import { AuthContext } from "../../services/auth/auth.context";
import {
  i18n,
  TranslationContext,
} from "../../services/translation/translation.context";
import { UserService } from "../../services/user/user.service";
import { config } from "../../utils/constants";

const TOGGLE_BUTTON_BREAKDOWN_HEIGHT = 40;

export const ProfRedeemHistory = () => {
  const { user, setUser } = useContext(AuthContext);
  const [headerList, setHeaderList] = useState();
  const [data, setData] = useState();
  const [overall, setOverall] = useState(null);

  useEffect(() => {
    let isMounted = true;
    UserService.getRedemptionHistory(user.user_id)
      .then((response) => {
        if (isMounted) {
          setData(response.rows);
          setHeaderList(response.headers);
          setOverall(response.overall);
        }
      })
      .catch((err) => {
        console.log(err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const renderRecord = (item) => {
    return <BreakdownRow item={item} />;
  };

  const renderTotal = (total) => {
    return (
      <View
        style={{
          alignSelf: "flex-end",
          justifyContent: "space-between",
          width: "40%",
          flexDirection: "row",
        }}
      >
        <Label weight={"bold"}>Total</Label>
        <Label>{parseFloat(total).toFixed(2)}</Label>
      </View>
    );
  };

  const renderHeader = (item) => {
    return (
      <>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 15,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Label weight={"bold"}>{item.title}</Label>
            <Spacer position={"left"} size="small" />
            <MaterialCommunityIcons
              name={
                item.total > 0 ? "emoticon-outline" : "emoticon-sad-outline"
              }
              size={25}
            />
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Label size={"mini"} weight={"regular"}>
              Total
            </Label>
            <Label weight={"bold"}>{item.total.toFixed(2)}</Label>
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

  const animatedValue = useRef(new Animated.Value(viewHeight)).current;

  const [displayBreakdown, setDisplayBreakdown] = useState(false);

  const showBreakdown = () => {
    Animated.timing(animatedValue, {
      toValue: TOGGLE_BUTTON_BREAKDOWN_HEIGHT,
      useNativeDriver: true,
      duration: 400,
    }).start(setDisplayBreakdown(!displayBreakdown));
  };

  const hideBreakdown = () => {
    Animated.timing(animatedValue, {
      toValue: viewHeight,
      useNativeDriver: true,
      duration: 400,
    }).start(setDisplayBreakdown(!displayBreakdown));
  };

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
        animatedValue.setValue(height);
      }}
    >
      <>
        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
            padding: 32,
            flex: 1,
          }}
        >
          <Label size="subtitle">{i18n.t("profile-tabs.savings-text")}</Label>
          <Label size="subtitle">({moment(new Date()).format("LL")})</Label>
          <View style={{ paddingVertical: 16 }}>
            {overall != undefined ? (
              <>
                <Label
                  weight={"bold"}
                  size="h4"
                  style={{
                    textAlign: "center",
                    color: theme.colors.icons.active,
                  }}
                >
                  {overall}
                </Label>
                <Label
                  weight={"bold"}
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
                size={"large"}
                color={theme.colors.icons.active}
              />
            )}
          </View>
        </View>

        <Animated.View
          style={{
            position: "absolute",
            bottom: TOGGLE_BUTTON_BREAKDOWN_HEIGHT,
            width: "100%",
            height: viewHeight,
            transform: [
              {
                translateY: animatedValue,
              },
            ],
          }}
        >
          <TouchableOpacity
            containerStyle={{}}
            onPress={toggleBreakdown}
            style={{
              alignItems: "center",
              justifyContent: "center",
              width: "auto",
              height: TOGGLE_BUTTON_BREAKDOWN_HEIGHT,
              backgroundColor: "#eee",
            }}
          >
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "row",
              }}
            >
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
            contentContainerStyle={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
            style={{
              alignSelf: "stretch",
              height: "100%",
              backgroundColor: "white",
            }}
          >
            {data ? (
              <ScrollView style={{ alignSelf: "stretch", height: "100%" }}>
                {data.map((item, index) => {
                  return <RenderRow key={index} item={item} />;
                })}
                <View
                  style={{
                    alignSelf: "stretch",
                    justifyContent: "center",
                    alignItems: "center",
                    paddingVertical: 16,
                  }}
                >
                  <Label style={{ color: "#aaa" }}>
                    -- {i18n.t("end-of-list")} --
                  </Label>
                </View>
              </ScrollView>
            ) : (
              <ActivityIndicator
                color={theme.colors.icons.active}
                size={"large"}
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
});
