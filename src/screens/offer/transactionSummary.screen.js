import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import moment from "moment";
import React, { useContext, useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { Label } from "../../components/typography/label.component";
import { theme } from "../../infrastructure/theme";
import { TranslationContext } from "../../services/translation/translation.context";
import { config } from "../../utils/constants";

export const TransactionSummaryScreen = () => {
  const animatedOpacity = useRef(new Animated.Value(0)).current;
  const animatedOpacity2 = useRef(new Animated.Value(0)).current;
  const animatedOpacity3 = useRef(new Animated.Value(0.6)).current;
  const route = useRoute();
  const navigation = useNavigation();
  const { i18n } = useContext(TranslationContext);
  const { discount, merchant, paid, prodname, transactDate, refCode } =
    route.params;

  const translateInterpolation = animatedOpacity.interpolate({
    inputRange: [0.5, 1],
    outputRange: [100, 0],
  });

  const opacityInterpolation = animatedOpacity3.interpolate({
    inputRange: [0.3, 1],
    outputRange: [0, 1],
  });

  useEffect(() => {
    let isMounted = true;

    Animated.sequence([
      Animated.timing(animatedOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        delay: 200,
      }).start(animatedOpacity.setValue(0)),
      Animated.timing(animatedOpacity2, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        delay: 700,
      }).start(animatedOpacity2.setValue(0)),
      Animated.spring(animatedOpacity3, {
        toValue: 1,
        useNativeDriver: true,
        delay: 1000,
      }).start(animatedOpacity3.setValue(0)),
    ]);

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDone = () => {
    navigation.reset({
      routes: [{ name: "Main" }],
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          justifyContent: "center",
          flexDirection: "column",
        }}
        centerContent={true}
      >
        <Animated.View
          style={[
            styles.rectangle,
            {
              opacity: animatedOpacity,
              transform: [{ translateY: translateInterpolation }],
            },
          ]}
        >
          <MaterialCommunityIcons
            name="check-decagram"
            size={80}
            color={theme.colors.ui.green}
          />
          <View
            style={{ paddingVertical: 8, alignItems: "center", width: "100%" }}
          >
            <Label
              style={{ textAlign: "center" }}
              weight={"bold"}
              size={"heading"}
            >
              {i18n.t("redemption-success.success")}
            </Label>
            <Label
              style={{ color: theme.colors.ui.lightGray, textAlign: "center" }}
              weight={"medium"}
              size={"subtitle"}
            >
              {moment(transactDate).format("LLL")}
            </Label>
            <View
              style={{
                borderTopWidth: 2,
                width: "80%",
                marginVertical: 16,
                borderColor: theme.colors.ui.lighterGray,
              }}
            ></View>

            <Label style={{ textAlign: "center" }}>
              {i18n.t("redemption-success.text1")}
            </Label>
            <View style={{ marginVertical: 12 }}>
              <Label
                style={{ textAlign: "center" }}
                weight={"bold"}
                size={"heading"}
              >
                {`${discount} ${config.CURRENCY}`}
              </Label>
            </View>
            <Label style={{ textAlign: "center" }}>
              {i18n.t("redemption-success.text2", {
                amount: parseFloat(paid).toFixed(2),
                currency: config.CURRENCY,
                partner: merchant,
              })}
            </Label>
          </View>
        </Animated.View>
        <Animated.View
          style={[styles.secondary, { opacity: animatedOpacity2 }]}
        >
          <Label
            style={{
              color: theme.colors.ui.lightGray,
              textAlign: "center",
            }}
            weight={"bold"}
            size={"heading"}
          >
            {prodname}
          </Label>
          <Label
            style={{ textAlign: "center", marginVertical: 12 }}
            weight={"bold"}
            size={"h5"}
          >
            {refCode}
          </Label>
          <View style={{ width: "80%" }}>
            <Label style={{ textAlign: "center" }}>
              {i18n.t("redemption-success.text3", { partner: merchant })}
            </Label>
          </View>
        </Animated.View>
        <Animated.View
          style={{
            opacity: opacityInterpolation,
            transform: [{ scale: animatedOpacity3 }],
          }}
        >
          <Button
            mode="contained"
            contentStyle={{ paddingVertical: 12 }}
            buttonColor={theme.colors.icons.active}
            onPress={handleDone}
          >
            <Label color={"white"} weight={"bold"} size={"title"}>
              {i18n.t("redemption-success.done")}
            </Label>
          </Button>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  rectangle: {
    backgroundColor: "white",
    shadowOpacity: 0.4,
    shadowOffset: {
      height: 3,
      width: 3,
    },
    shadowRadius: 5,
    elevation: 10,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  secondary: {
    // backgroundColor: "red",
    flex: 1,
    paddingVertical: 24,
    alignItems: "center",
  },
});
