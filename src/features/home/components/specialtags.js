import React, { useContext } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Platform,
  Text,
  TouchableOpacity,
  View, StyleSheet,
} from "react-native";
import styled from "styled-components/native";
import { Label } from "../../../components/typography/label.component";
import { specialsLogo } from "../../../utils/constants";
import { itemSeparatorVM } from "../../../components/styles";
import { TranslationContext } from "../../../services/translation/translation.context";
import { REMOVE_CLIPPED_SUBVIEWS } from "../../../utils/listPerf";

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
  width: ${({ itemWidth }) => itemWidth}px;
  height: ${({ itemWidth }) => itemWidth}px;
  border-radius: 10px;
  background-color: black;
  overflow: hidden;
  justify-content: center;
  align-items: center;
  padding: 10px;

  /* Shadow for iOS */
  ${Platform.OS === "ios" &&
  `
    shadow-color: #000;
    shadow-offset: 0px 4px;
    shadow-opacity: 0.3;
    shadow-radius: 4px;
  `}

  /* Shadow for Android */
  ${Platform.OS === "android" && `elevation: 6;`}
`;
  const renderOffers = ({ item }) => {
    return (
      <TouchableOpacity onPress={() => handlePress(item)}>
        <OfferItemContainer>
          <View
            style={[
              styles.bordered,
              {
                shadowOpacity: Platform.OS === "ios" ? 0.3 : 1,
              },
            ]}
          >
            <OfferItemImageContainer
              resizeMode="stretch"
              source={require("../../../../assets/ifza-login-bg.webp")}
            >
              <Image
                style={styles.image}
                resizeMode="cover"
                source={specialsLogo[item.id]}
              />
            </OfferItemImageContainer>
          </View>
           <View style={styles.spacer} />
            <OffersItemLabelContainer>
              <Label style={styles.label}>
                {item.specialtags_en}
              </Label>
              <Text></Text>
            </OffersItemLabelContainer>
          
        </OfferItemContainer>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <OffersHeaderView>
         
          <Label size="heading" weight="bold" style={styles.label2}>
            {i18n.t("offer-details.offers")}
          </Label>
        
      </OffersHeaderView>
      <OffersContentView>
        <FlatList
          removeClippedSubviews={REMOVE_CLIPPED_SUBVIEWS}
          data={data}
          renderItem={renderOffers}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          nestedScrollEnabled={true}
          numColumns={numcol}
          style={styles.flatList}
          contentContainerStyle={{}}
          columnWrapperStyle={styles.flatListColumnWrapper}
          ItemSeparatorComponent={itemSeparatorVM}
        ></FlatList>
      </OffersContentView>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    width: 80,
    height: 80,
    tintColor: "white",
  },
  spacer: {
    marginTop: 6,
  },
  label: {
    textAlign: "center",
    textAlignVertical: "center",
  },
  label2: {
    marginLeft: 16,
  },
  flatList: {
    paddingVertical: 16,
  },
  flatListColumnWrapper: {
    justifyContent: "flex-start",
    paddingHorizontal: 16,
  },
  bordered: {
    elevation: 6,
    backgroundColor: "black",
    shadowColor: "black",
    shadowOffset: {
      width: 3,
      height: 4,
    },
    borderRadius: 4,
  },
});
