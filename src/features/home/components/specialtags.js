import React, { useContext } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Platform,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import { Spacer } from "../../../components/spacer/spacer.component";
import styled from "styled-components/native";
import { Label } from "../../../components/typography/label.component";
import { offersData } from "./testdata";
import { specialsLogo, typeEnum } from "../../../utils/constants";
import { navigate } from "../../../navigation/navigate";
import { StackActions } from "@react-navigation/native";
import { itemSeparatorVM } from "../../../components/styles";
import { TranslationContext } from "../../../services/translation/translation.context";

const screenWidth = Dimensions.get("window").width;
const offerItemWidth = (screenWidth - (16 * 2 + 8 * 3)) / 4;

const OffersContentView = styled(View)``;

const OffersItemLabelContainer = styled(View)`
  justify-content: center;
  align-items: center;
`;

const { height } = Dimensions.get("window");

export const SpecialTags = ({ data, handlePress }) => {
  const OffersHeaderView = styled(View)``;
  const itemWidth = 93;
  const numcol = Math.floor(screenWidth / itemWidth);
  const { i18n } = useContext(TranslationContext);

  const marginPerItem = (screenWidth - numcol * itemWidth - 24) / numcol;
  const OfferItemContainer = styled(View)`
    width: ${itemWidth}px;
    margin-right: ${marginPerItem}px;
  `;

  const OfferItemImageContainer = styled(ImageBackground)`
    ${() => {
      return `
        width: ${itemWidth}px;
        height: ${itemWidth}px;
      `;
    }}
    border-radius: 10px;
    background-color: black;
    /* background-color: lightblue; */
    elevation: 6;
    box-shadow: 3px 4px 4px rgba(0, 0, 0, ${Platform.OS === "ios" ? 0.3 : 1});
    overflow: hidden;
    justify-content: center;
    align-items: center;
    background-color: black;
    padding: 10px;
  `;

  const renderOffers = ({ item }) => {
    return (
      <TouchableOpacity onPress={() => handlePress(item)}>
        <OfferItemContainer>
          <View
            style={{
              elevation: 6,
              backgroundColor: "black",
              shadowColor: "black",
              shadowOpacity: Platform.OS === "ios" ? 0.3 : 1,
              shadowOffset: { width: 3, height: 4 },
              borderRadius: 4,
            }}
          >
            <OfferItemImageContainer
              resizeMode="stretch"
              source={require("../../../../assets/ifza-login-bg.webp")}
            >
              <Image
                style={{
                  width: 80,
                  height: 80,
                  tintColor: "white",
                }}
                resizeMode="cover"
                source={specialsLogo[item.id]}
              />
            </OfferItemImageContainer>
          </View>
          <Spacer position={"top"} size={"small"}>
            <OffersItemLabelContainer>
              <Label
                style={{ textAlign: "center", textAlignVertical: "center" }}
              >
                {item.specialtags_en}
              </Label>
              <Text></Text>
            </OffersItemLabelContainer>
          </Spacer>
        </OfferItemContainer>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <OffersHeaderView>
        <Spacer position="left" size="medium">
          <Label size="heading" weight="bold">
            {i18n.t("offer-details.offers")}
          </Label>
        </Spacer>
      </OffersHeaderView>
      <OffersContentView>
        <FlatList
          data={data}
          renderItem={renderOffers}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          nestedScrollEnabled={true}
          numColumns={numcol}
          style={{ paddingVertical: 16 }}
          contentContainerStyle={{}}
          columnWrapperStyle={{
            justifyContent: "flex-start",
            paddingHorizontal: 16,
          }}
          ItemSeparatorComponent={itemSeparatorVM}
        ></FlatList>
      </OffersContentView>
    </View>
  );
};
