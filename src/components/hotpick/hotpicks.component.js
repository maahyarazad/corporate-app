import React, { useContext, useEffect, useState } from "react";
// import Carousel from "react-native-snap-carousel";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import { Card, Chip, TouchableRipple } from "react-native-paper";
import { TranslationContext } from "../../services/translation/translation.context";
import { MyCard } from "../myCard.component";
import { Spacer } from "../spacer/spacer.component";
import { Label } from "../typography/label.component";
import Carousel from "react-native-reanimated-carousel";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { OfferService } from "../../services/offer/offer.service";
import {
  adminFileBaseURL,
  config,
  mycard_size,
  offerStamps,
} from "../../utils/constants";
import { navigate } from "../../navigation/navigate";
import { width } from "../styles";
import useRequest from "../../../hooks/useRequest";
import { theme } from "../../infrastructure/theme";

const test_data = [
  { outlet_name: "Merchant A" },
  { outlet_name: "Merchant B" },
  { outlet_name: "Merchant C" },
];

export const Hotpicks = () => {
  const { i18n } = useContext(TranslationContext);
  const progressValue = useSharedValue(0);
  const [isVertical, setIsVertical] = useState(false);
  const [hotpickList, setHotpickList] = useState([]);
  const { lang } = useContext(TranslationContext);
  const [reverse, setReverse] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const request = useRequest();

  useEffect(() => {
    let isMounted = true;

    const getHotpicks = async () => {
      const data = {
        app_id: config.APP_ID,
        lang: lang,
        limit: 10,
      };
      const response = await request(
        `/v2/offer/hotpicks?app_id=${config.APP_ID}&lang=${lang}&limit=10`,
        "get"
      );

      if (isMounted) {
        // setHotpickList(response.data.slice(0, 5));
        setHotpickList(response.data);
      }
    };

    getHotpicks();

    return () => {
      isMounted = true;
    };
  }, []);

  const PaginationItem = ({
    animValue,
    index,
    length,
    backgroundColor,
    isRotate,
  }) => {
    const width = 10;

    const animStyle = useAnimatedStyle(() => {
      let inputRange = [index - 1, index, index + 1];
      let outputRange = [-width, 0, width];

      if (index === 0 && animValue?.value > length - 1) {
        inputRange = [length - 1, length, length + 1];
        outputRange = [-width, 0, width];
      }

      return {
        transform: [
          {
            translateX: interpolate(
              animValue?.value,
              inputRange,
              outputRange,
              Extrapolate.CLAMP
            ),
          },
        ],
      };
    }, [animValue, index, length]);

    return (
      <View
        style={{
          backgroundColor: "white",
          width,
          height: width,
          borderRadius: 50,
          marginHorizontal: 6,
          overflow: "hidden",
          transform: [
            {
              rotateZ: isRotate ? "90deg" : "0deg",
            },
          ],
        }}
      >
        <Animated.View
          style={[
            {
              borderRadius: 50,
              backgroundColor,
              flex: 1,
            },
            animStyle,
          ]}
        />
      </View>
    );
  };

  const handlePress = (id) => {
    navigate("Location View", {
      locId: id,
    });
  };

  const renderItem = ({ item }) => {
    return (
      <View key={item.outlet_name} style={styles.slideContainer}>
        {/* <TouchableHighlight onPress={() => {}}> */}
        <MyCard
          //ADD ONPRESS FUNCTION HERE
          onPress={() => {
            handlePress(item.partner_id);
          }}
          size={"hotpick"}
          stamp={offerStamps[item.premium_id - 1]}
          offer_name={item.offer_name}
          // offer_name={item.offer_name}
          outlet_name={item.outlet_name}
          imgUrl={`${item.file}`}
        />
      </View>
    );
  };

  return (
    <>
      {!!hotpickList && hotpickList.length > 0 && (
        <View style={styles.container}>
          <View style={styles.header}>
            <Label style={{ marginTop: 16 }} size="heading" weight="bold">
              {/* {i18n.t("categories")} */}
              Hot Picks
            </Label>
          </View>
          <View style={styles.hotpickContent}>
            {hotpickList.length > 2 ? (
              <Carousel
                style={{
                  flex: 1,
                  alignContent: "center",
                  justifyContent: "center",
                  alignItems: "center",
                  flexDirection: "column",
                  margin: -10,
                  padding: -10,
                }}
                windowSize={3}
                data={hotpickList}
                renderItem={renderItem}
                autoPlay={true}
                snapEnabled={true}
                autoPlayInterval={3000}
                width={Dimensions.get("screen").width}
                height={Dimensions.get("screen").width * 0.6}
                mode="parallax"
                pagingEnabled={true}
                onProgressChange={(_, absoluteProgress) => {
                  progressValue.value = absoluteProgress;
                  if (
                    Math.floor(absoluteProgress + 1) /
                      (absoluteProgress + 1) ===
                    1
                  ) {
                    setCurrentIndex(absoluteProgress + 1);
                  }
                }}
                panGestureHandlerProps={{
                  activeOffsetX: [-10, 10],
                }}
                withAnimation={{
                  type: "timing",
                  config: {
                    duration: 500,
                  },
                }}
                modeConfig={{
                  parallaxScrollingScale: 0.8,
                  parallaxScrollingOffset: 205,
                }}
              />
            ) : hotpickList.length === 1 ? (
              <>
                {/* Show only 1 card */}
                <MyCard
                  //ADD ONPRESS FUNCTION HERE
                  onPress={() => {
                    handlePress(hotpickList[0].partner_id);
                  }}
                  size={"hotpick"}
                  width={"100%"}
                  imgWidth={"100%"}
                  imgHeight={Dimensions.get("screen").width * 0.5}
                  stamp={offerStamps[hotpickList[0].premium_id - 1]}
                  offer_name={hotpickList[0].offer_name}
                  imgUrl={`${hotpickList[0].file}`}
                  // imgUrl={`${item.file}`}
                  outlet_name={hotpickList[0].outlet_name}
                  style={{ padding: 16, paddingTop: 26 }}
                />
              </>
            ) : (
              <>
                {/* Show only 2 cards */}
                <Carousel
                  style={{
                    flex: 1,
                    alignContent: "center",
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "column",
                  }}
                  data={hotpickList}
                  renderItem={renderItem}
                  autoPlay={true}
                  autoPlayReverse={reverse}
                  loop={false}
                  snapEnabled={true}
                  autoPlayInterval={3000}
                  width={Dimensions.get("screen").width}
                  height={Dimensions.get("screen").width * 0.64}
                  mode="parallax"
                  pagingEnabled={true}
                  onProgressChange={(_, absoluteProgress) => {
                    progressValue.value = absoluteProgress;
                    if (absoluteProgress === 0) {
                      setReverse(false);
                    } else if (absoluteProgress === 1) {
                      setReverse(true);
                    }
                  }}
                  withAnimation={{
                    type: "timing",
                    config: {
                      duration: 500,
                    },
                  }}
                  modeConfig={{
                    parallaxScrollingScale: 0.8,
                    parallaxScrollingOffset: 150,
                  }}
                />
              </>
            )}

            {hotpickList && hotpickList.length > 1 && !!progressValue && (
              <View
                style={[
                  { marginBottom: 2 },
                  isVertical
                    ? {
                        flexDirection: "column",
                        justifyContent: "space-between",
                        width: 10,
                        alignSelf: "center",
                        position: "absolute",
                        right: 5,
                        top: 40,
                      }
                    : {
                        flexDirection: "row",
                        justifyContent: "center",
                        width: 100,
                        alignSelf: "center",
                      },
                ]}
              >
                {hotpickList && (
                  <Chip
                    style={{
                      // width: 130,
                      backgroundColor: theme.colors.icons.active,
                      borderRadius: 50,
                    }}
                    textStyle={{ width: 105, textAlign: "center" }}
                  >
                    <Label
                      weight={"bold"}
                      color={"white"}
                    >{`${currentIndex} out of ${hotpickList.length}`}</Label>
                  </Chip>
                )}

                {/* {hotpickList &&
                  hotpickList.map((_, index) => {
                    return (
                      <PaginationItem
                        backgroundColor={"#ccc"}
                        animValue={progressValue}
                        index={index}
                        key={index}
                        isRotate={isVertical}
                        length={hotpickList.length}
                      />
                    );
                  })} */}
              </View>
            )}
          </View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: -12,
  },
  header: {
    marginLeft: 16,
    marginTop: 0,
    marginBottom: -16,
  },
  hotpickContent: {
    // backgroundColor: "green",
    // backgroundColor: "red",
  },
  slideContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 500,
    // width: 400,
    // width: 200,
    // backgroundColor: "red",
  },
});
