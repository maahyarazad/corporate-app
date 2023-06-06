import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
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

  const animatedValue = useRef(new Animated.Value(initialHeight)).current;

  const expand = () => {
    Animated.timing(animatedValue, {
      toValue: OFFER_COMPONENT_HEIGHT * offers.length,
      useNativeDriver: false,
      duration: 300,
    }).start(() => {});
  };

  const collapse = () => {
    Animated.timing(animatedValue, {
      toValue: OFFER_COMPONENT_HEIGHT * minItems,
      useNativeDriver: false,
      duration: 300,
    }).start(() => {
      setShowAll(!showAll);
    });
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
    <View>
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
        size={"heading"}
        weight={"bold"}
      >
        {i18n.t("offer-details.offers")}
      </Label>
      {/* <Offer /> */}
      {shortOfferList != undefined && (
        <Animated.View style={{ overflow: "hidden", height: animatedValue }}>
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
            <Label style={{ color: "#006EFF" }} size={"subtitle"} weight="bold">
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
