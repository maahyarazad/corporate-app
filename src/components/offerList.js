import React, { useContext, useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Offer } from "../features/offers/components/offer.component";
import { OfferModalInfo } from "../features/offers/components/offerModalForm";
import { TranslationContext } from "../services/translation/translation.context";
import { CustomModal } from "./modal/customModal.component";
import { itemSeparatorVS } from "./styles";
import { Label } from "./typography/label.component";
import { LinearGradient } from "expo-linear-gradient";

const OFFER_COMPONENT_HEIGHT = 120;

export const OfferList = ({ offers, location, distance, minItems }) => {
  const [showAll, setShowAll] = useState(false);
  const [shortOfferList, setShortOfferList] = useState();
  const [showModal, setShowModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState();
  const { i18n } = useContext(TranslationContext);
  const toggleShowAll = async () => {
    if (!showAll) {
      await setShowAll(!showAll);
      expand();
    } else {
      collapse();
    }
  };

  const initialHeight =
    offers.length > 2
      ? OFFER_COMPONENT_HEIGHT * minItems
      : OFFER_COMPONENT_HEIGHT * offers.length;

  const animatedValue = useSharedValue(initialHeight);

  // useSharedValue only reads its argument once, but initialHeight is
  // recomputed from offers.length on every render. Resync when it changes.
  useEffect(() => {
    if (!showAll) {
      animatedValue.value = initialHeight;
    }
  }, [initialHeight]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    overflow: "hidden",
    height: animatedValue.value,
  }));

  const expand = () => {
    animatedValue.value = withTiming(OFFER_COMPONENT_HEIGHT * offers.length, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
  };

  const collapse = () => {
    animatedValue.value = withTiming(
      OFFER_COMPONENT_HEIGHT * minItems,
      { duration: 300, easing: Easing.inOut(Easing.ease) },
      (finished) => {
        // Completion callbacks run on the UI thread, so the state setter must
        // hop back to JS. Guarded on `finished` so an interrupted collapse
        // does not commit a transition that never visually happened.
        if (finished) {
          runOnJS(setShowAll)(false);
        }
      }
    );
  };

  // useEffect(() => {
  //   if (showAll) {
  //     expand();
  //   }
  //     collapse();

  // }, [showAll]);

  useEffect(() => {
    setShortOfferList(offers.slice(0, minItems));
  }, []);

  const onSelectOffer = (item) => {
    setSelectedOffer(item);
    setShowModal(true);
  };

  const onCloseModal = () => {
    setShowModal(false);
  };

  return (
    <View style={{ gap: 8 }}>
      <CustomModal showModal={showModal}>
        <OfferModalInfo
          offerInfo={selectedOffer}
          onCloseModal={onCloseModal}
          location={location}
          distance={distance}
        />
      </CustomModal>
      
      <Label
        style={{
            
          paddingHorizontal: 16,
        }}
        size="heading"
        weight="bold"
      >
        {i18n.t("offer-details.offers")}
      </Label>
      {/* <Offer /> */}
      {shortOfferList != undefined && (
        <Animated.View style={containerAnimatedStyle}>
          <FlatList
            collapsable={true}
            data={showAll ? offers : shortOfferList}
            scrollEnabled={false}
            style={{
              paddingHorizontal: 16,
              paddingTop: 0,
            }}
            ItemSeparatorComponent={itemSeparatorVS}
            renderItem={({ item, index }) => {
              return (
                <Offer
                  key={index}
                  onPress={() => onSelectOffer(item)}
                  offer={item}
                />
              );
            }}
          />
          {/* <View style={{ backgroundColor: "red", flex: 1, height: 300 }}></View>
          <LinearGradient
            colors={["red", "green"]}
            styles={{ flex: 1, height: 300 }}
          ></LinearGradient> */}
          {!showAll && offers.length > 2 && (
            <LinearGradient
              colors={["#efefef00", "#efefef"]}
              style={{
                flex: 1,
                position: "absolute",
                width: "100%",
                height: 140,
                bottom: 0,
                // backgroundColor: "red",
              }}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 0.7 }}
            ></LinearGradient>
          )}
        </Animated.View>
      )}
      {offers.length > 2 && (
        <Animated.View
          style={{
            padding: 16,
            paddingTop: 0,
          }}
        >
          <TouchableOpacity
            onPress={toggleShowAll}
            style={{
              margin: 16,
              marginTop: 0,
              borderRadius: 4,
              justifyContent: "flex-start",
              alignItems: "flex-end",
              // shadowOpacity: 0.3,
              shadowOffset: {
                height: 3,
                width: 2,
              },
              shadowRadius: 4,
            }}
          >
            <Label style={{ color: "#006EFF" }} size="subtitle" weight="bold">
              {showAll ? "Show less" : "Show all"}
            </Label>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
});
