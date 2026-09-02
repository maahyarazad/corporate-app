import React, { useCallback, useContext, useEffect, useState } from "react";
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
import { REMOVE_CLIPPED_SUBVIEWS } from "../utils/listPerf";

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
  }, [offers, minItems]);

  const onSelectOffer = useCallback((item) => {
    setSelectedOffer(item);
    setShowModal(true);
  }, []);

  const keyExtractor = useCallback((item) => String(item.id), []);

  // Passes onSelectOffer directly rather than a per-item closure, so the
  // memoized Offer can actually hit. See contracts/list-api.md C1.
  const renderOffer = useCallback(
    ({ item }) => <Offer onPress={onSelectOffer} offer={item} />,
    [onSelectOffer]
  );

  const onCloseModal = () => {
    setShowModal(false);
  };

  return (
    <View style={styles.box}>
      <CustomModal showModal={showModal}>
        <OfferModalInfo
          offerInfo={selectedOffer}
          onCloseModal={onCloseModal}
          location={location}
          distance={distance}
        />
      </CustomModal>
      
      <Label style={styles.label} size="heading" weight="bold">
        {i18n.t("offer-details.offers")}
      </Label>
      {/* <Offer /> */}
      {shortOfferList != undefined && (
        <Animated.View style={containerAnimatedStyle}>
          <FlatList
            removeClippedSubviews={REMOVE_CLIPPED_SUBVIEWS}
            collapsable={true}
            data={showAll ? offers : shortOfferList}
            scrollEnabled={false}
            style={styles.flatList}
            ItemSeparatorComponent={itemSeparatorVS}
            keyExtractor={keyExtractor}
            renderItem={renderOffer}
          />
          {/* <View style={{ backgroundColor: "red", flex: 1, height: 300 }}></View>
          <LinearGradient
            colors={["red", "green"]}
            styles={{ flex: 1, height: 300 }}
          ></LinearGradient> */}
          {!showAll && offers.length > 2 && (
            <LinearGradient
              colors={["#efefef00", "#efefef"]}
              style={styles.linearGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 0.7 }}
            ></LinearGradient>
          )}
        </Animated.View>
      )}
      {offers.length > 2 && (
        <Animated.View style={styles.pad}>
          <TouchableOpacity
            onPress={toggleShowAll}
            style={styles.bordered}
          >
            <Label style={styles.label2} size="subtitle" weight="bold">
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
  box: {
    gap: 8,
  },
  label: {
    paddingHorizontal: 16,
  },
  flatList: {
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  linearGradient: {
    flex: 1,
    position: "absolute",
    width: "100%",
    height: 140,
    bottom: 0,
  },
  pad: {
    padding: 16,
    paddingTop: 0,
  },
  bordered: {
    margin: 16,
    marginTop: 0,
    borderRadius: 4,
    justifyContent: "flex-start",
    alignItems: "flex-end",
    shadowOffset: {
      height: 3,
      width: 2,
    },
    shadowRadius: 4,
  },
  label2: {
    color: "#006EFF",
  },
});
