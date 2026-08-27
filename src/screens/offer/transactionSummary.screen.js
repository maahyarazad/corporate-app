import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import moment from "moment";
import React, { useContext, useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Button } from "react-native-paper";
import { Label } from "../../components/typography/label.component";
import { theme } from "../../infrastructure/theme";
import { TranslationContext } from "../../services/translation/translation.context";
import { config } from "../../utils/constants";

export const TransactionSummaryScreen = () => {
  const animatedOpacity = useSharedValue(0);
  const animatedOpacity2 = useSharedValue(0);
  const animatedOpacity3 = useSharedValue(0);
  const route = useRoute();
  const navigation = useNavigation();
  const { i18n } = useContext(TranslationContext);
  const { discount, merchant, paid, prodname, transactDate, refCode } =
    route.params;



  useEffect(() => {
    // The original wrapped these in a legacy RN sequence() that was never
    // started - each .start() had already fired independently, and each
    // `.start(value.setValue(0))` reset its value first because JS evaluates
    // arguments before the call. Net effect preserved: three independent
    // animations from 0, staggered by their own delays.
    animatedOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
    );

    animatedOpacity2.value = withDelay(
      700,
      withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) })
    );

    animatedOpacity3.value = withDelay(1000, withSpring(1));
  }, []);

  const rectangleStyle = useAnimatedStyle(() => ({
    opacity: animatedOpacity.value,
    transform: [
      { translateY: interpolate(animatedOpacity.value, [0.5, 1], [100, 0]) },
    ],
  }));

  const secondaryStyle = useAnimatedStyle(() => ({
    opacity: animatedOpacity2.value,
  }));

  const tertiaryStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedOpacity3.value, [0.3, 1], [0, 1]),
    transform: [{ scale: animatedOpacity3.value }],
  }));

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
            rectangleStyle,
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
              weight="bold"
              size="heading"
            >
              {i18n.t("redemption-success.success")}
            </Label>
            <Label
              style={{ color: theme.colors.ui.lightGray, textAlign: "center" }}
              weight="medium"
              size="subtitle"
            >
              {moment(transactDate).format("DD.MMMM YYYY H:mm A")}
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
                weight="bold"
                size="heading"
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
          style={[styles.secondary, secondaryStyle]}
        >
          <Label
            style={{
              color: theme.colors.ui.lightGray,
              textAlign: "center",
            }}
            weight="bold"
            size="heading"
          >
            {prodname}
          </Label>
          <Label
            style={{ textAlign: "center", marginVertical: 12 }}
            weight="bold"
            size="h5"
          >
            {refCode}
          </Label>
          <View style={{ width: "80%" }}>
            <Label style={{ textAlign: "center" }}>
              {i18n.t("redemption-success.text3", { partner: merchant })}
            </Label>
          </View>
        </Animated.View>
        <Animated.View style={tertiaryStyle}>
          <Button
            mode="contained"
            contentStyle={{ paddingVertical: 12 }}
            buttonColor={theme.colors.icons.active}
            onPress={handleDone}
          >
            <Label color="white" weight="bold" size="title">
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
