import React, { useContext, useState } from "react";
// import Carousel from "react-native-snap-carousel";
import { Dimensions, StyleSheet, View } from "react-native";
import { Chip } from "react-native-paper";
import { TranslationContext } from "../../services/translation/translation.context";
import { MyCard } from "../myCard.component";
import { Label } from "../typography/label.component";
import Carousel from "react-native-reanimated-carousel";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { offerStamps } from "../../utils/constants";
import { navigate } from "../../navigation/navigate";
import useRequest from "../../../hooks/useRequest";
import { theme } from "../../infrastructure/theme";

const test_data = [
  { outlet_name: "Merchant A" },
  { outlet_name: "Merchant B" },
  { outlet_name: "Merchant C" },
];

const Hotpicks = ({ hotpickData }) => {
  const { i18n } = useContext(TranslationContext);
  const progressValue = useSharedValue(0);
  const [isVertical, setIsVertical] = useState(false);
  const { lang } = useContext(TranslationContext);
  const [reverse, setReverse] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const request = useRequest();


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
              Extrapolation.CLAMP
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
          size="hotpick"
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
      {!!hotpickData && hotpickData.length > 0 && (
        <View style={styles.container}>
          <View style={styles.header}>
            <Label style={{ marginTop: 16 }} size="heading" weight="bold">
              {/* {i18n.t("categories")} */}
              Hot Picks
            </Label>
          </View>
          <View style={styles.hotpickContent}>
            {hotpickData.length > 2 ? (
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
                data={hotpickData}
                renderItem={renderItem}
                autoPlay={true}
                snapEnabled={true}
                autoPlayInterval={3000}
                width={Math.min(Dimensions.get("screen").width)}
                height={Math.min(Dimensions.get("screen").width * 0.6)}
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
            ) : hotpickData.length === 1 ? (
              <>
                {/* Show only 1 card */}
                <View style={{ padding: 16 }}>
                  <MyCard
                    //ADD ONPRESS FUNCTION HERE
                    onPress={() => {
                      handlePress(hotpickData[0].partner_id);
                    }}
                    size="hotpick"
                    width="100%"
                    imgWidth="100%"
                    imgHeight={Math.min(Dimensions.get("screen").width * 0.5)}
                    stamp={offerStamps[hotpickData[0].premium_id - 1]}
                    offer_name={hotpickData[0].offer_name}
                    imgUrl={`${hotpickData[0].file}`}
                    // imgUrl={`${item.file}`}
                    outlet_name={hotpickData[0].outlet_name}
                    style={{ padding: 16, paddingTop: 26 }}
                  />
                </View>
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
                  data={hotpickData}
                  renderItem={renderItem}
                  autoPlay={true}
                  autoPlayReverse={reverse}
                  loop={false}
                  snapEnabled={true}
                  autoPlayInterval={3000}
                  width={Math.min(Dimensions.get("screen").width)}
                  height={Math.min(Dimensions.get("screen").width * 0.64)}
                  mode="parallax"
                  pagingEnabled={true}
                  onProgressChange={(_, absoluteProgress) => {
                    progressValue.value = absoluteProgress;
                    if (absoluteProgress === 0) {
                      setReverse(false);
                    } else if (absoluteProgress === 1) {
                      setReverse(true);
                    }
                    if (
                      Math.floor(absoluteProgress + 1) /
                        (absoluteProgress + 1) ===
                      1
                    ) {
                      setCurrentIndex(absoluteProgress + 1);
                    }
                  }}
                  withAnimation={{
                    type: "timing",
                    config: {
                      duration: 500,
                    },
                  }}
                  modeConfig={{
                    parallaxScrollingScale: 0.9,
                    parallaxScrollingOffset: 150,
                  }}
                />
              </>
            )}

            {hotpickData && hotpickData.length > 1 && !!progressValue && (
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
                {hotpickData && (
                  <Chip
                    style={{
                      // width: 130,
                      backgroundColor: theme.colors.icons.active,
                      borderRadius: 50,
                    }}
                    textStyle={{ width: 105, textAlign: "center" }}
                  >
                    <Label
                      weight="bold"
                      color="white"
                    >{`${currentIndex} out of ${hotpickData.length}`}</Label>
                  </Chip>
                )}

                {/* {hotpickData &&
                  hotpickData.map((_, index) => {
                    return (
                      <PaginationItem
                        backgroundColor="#ccc"
                        animValue={progressValue}
                        index={index}
                        key={index}
                        isRotate={isVertical}
                        length={hotpickData.length}
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

export default React.memo(Hotpicks);
