import React, { useContext } from "react";
// import Carousel from "react-native-snap-carousel";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { Card } from "react-native-paper";
import { TranslationContext } from "../../services/translation/translation.context";
import { MyCard } from "../myCard.component";
import { Spacer } from "../spacer/spacer.component";
import { Label } from "../typography/label.component";
import Carousel from "react-native-reanimated-carousel";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const test_data = [
  { outlet_name: "Merchant A" },
  { outlet_name: "Merchant B" },
  { outlet_name: "Merchant C" },
];

export const Hotpicks = () => {
  const { i18n } = useContext(TranslationContext);

  const renderItem = ({ item }) => {
    return (
      <View style={styles.slideContainer}>
        <MyCard
          size="hotpick"
          imgUrl={`https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fi.stack.imgur.com%2FpzSVV.jpg%3Fs%3D328%26g%3D1&f=1&nofb=1&ipt=7f817033da4b51dadf56417a4410244101c557fd7458bb1fc3b1910eca835fa9&ipo=images`}
          outlet_name={item.outlet_name}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Label style={{ marginTop: 8 }} size="heading" weight="bold">
          {i18n.t("categories")}
        </Label>
        <View style={styles.hotpickContent}>
          {/* <MyCard
            size="hotpick"
            imgUrl={`https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fi.stack.imgur.com%2FpzSVV.jpg%3Fs%3D328%26g%3D1&f=1&nofb=1&ipt=7f817033da4b51dadf56417a4410244101c557fd7458bb1fc3b1910eca835fa9&ipo=images`}
          /> */}
          <GestureHandlerRootView>
            <Carousel
              style={{
                alignContent: "center",
                justifyContent: "center",
                alignItems: "center",
              }}
              data={test_data}
              renderItem={renderItem}
              autoPlay={true}
              snapEnabled={true}
              autoPlayInterval={1500}
              width={Dimensions.get("screen").width}
              height={300}
              mode="parallax"
              modeConfig={{
                parallaxScrollingScale: 0.9,
                parallaxScrollingOffset: 50,
              }}
            />
          </GestureHandlerRootView>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: -12,
  },
  header: {
    margin: 16,
    marginTop: 0,
  },
  hotpickContent: {
    // backgroundColor: "red",
  },
  slideContainer: {
    flex: 1,
    maxWidth: 200,
    width: 200,
    backgroundColor: "red",
  },
});
