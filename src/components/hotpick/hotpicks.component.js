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
import { Card, TouchableRipple } from "react-native-paper";
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

  useEffect(() => {
    let isMounted = true;

    const getHotpicks = async () => {
      const data = {
        app_id: config.APP_ID,
        lang: lang,
        limit: 2,
      };
      const response = await OfferService.getHotpicks(data);
      if (isMounted) {
        setHotpickList(response.data);
        console.log(response.data);
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
          imgUrl={`${adminFileBaseURL}${item.file}`}
          outlet_name={item.outlet_name}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Label style={{ marginTop: 8 }} size="heading" weight="bold">
          {/* {i18n.t("categories")} */}
          Hot Picks
        </Label>
      </View>
      <View style={styles.hotpickContent}>
        {/* <MyCard
            size="hotpick"
            imgUrl={`https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fi.stack.imgur.com%2FpzSVV.jpg%3Fs%3D328%26g%3D1&f=1&nofb=1&ipt=7f817033da4b51dadf56417a4410244101c557fd7458bb1fc3b1910eca835fa9&ipo=images`}
          /> */}
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
          snapEnabled={true}
          autoPlayInterval={3000}
          width={Dimensions.get("screen").width}
          height={Dimensions.get("screen").width * 0.6}
          mode="parallax"
          pagingEnabled={true}
          onProgressChange={(_, absoluteProgress) => {
            progressValue.value = absoluteProgress;
          }}
          withAnimation={{
            type: "timing",
            config: {
              duration: 500,
            },
          }}
          modeConfig={{
            parallaxScrollingScale: 0.8,
            parallaxScrollingOffset: 185,
          }}
        />

        {hotpickList && hotpickList.length > 1 && !!progressValue && (
          <View
            style={
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
                    // justifyContent: "space-between",
                    width: 100,
                    alignSelf: "center",
                  }
            }
          >
            {hotpickList &&
              hotpickList.map((_, index) => {
                return (
                  <PaginationItem
                    backgroundColor={"#ccc"}
                    animValue={progressValue}
                    index={index}
                    key={index}
                    isRotate={isVertical}
                    length={test_data.length}
                  />
                );
              })}
          </View>
        )}

        {/* <Card>
            <Card.Cover
              resizeMethod={"resize"}
              resizeMode={"cover"}
              style={{ height: 110 }}
              source={{
                uri: `https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fi.stack.imgur.com%2FpzSVV.jpg%3Fs%3D328%26g%3D1&f=1&nofb=1&ipt=7f817033da4b51dadf56417a4410244101c557fd7458bb1fc3b1910eca835fa9&ipo=images`,
              }}
            />
            <Card.Title title={"Eyowt"}>
              
            </Card.Title>
            <Card.Content>
              <Label>Hmmmm</Label>
            </Card.Content>
          </Card> */}
      </View>
    </View>
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
