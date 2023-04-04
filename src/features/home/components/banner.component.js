import React, { useContext, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  View,
  Dimensions,
  TouchableOpacity,
  Platform,
  Linking,
} from "react-native";
import styled from "styled-components/native";
import { LoadingOverlay } from "../../../components/loading/loading.component";
import { Spacer } from "../../../components/spacer/spacer.component";
import * as WebBrowser from "expo-web-browser";
import { itemSeparatorHL } from "../../../components/styles";
import { config } from "../../../utils/constants";
import { isValidURL } from "../../../utils/isValidURL";
import { AppServices } from "../../../services/app/app.services";
import { AuthContext } from "../../../services/auth/auth.context";
import Carousel from "react-native-reanimated-carousel";
import { CacheImage } from "../../../components/cacheImage";

const SIZE_RATIO = 9 / 16;
// const SIZE_RATIO = 9 / 16;

const BannerList = styled(FlatList)`
  padding-top: 10px;
  /* background-color: red; */
`;

const ListContainerHeight = () => {
  const screenWidth = Dimensions.get("window").width;
  const imageHeight = screenWidth * SIZE_RATIO;
  return imageHeight;
};

const ListContainer = styled(View)`
  height: ${ListContainerHeight}px;
  margin-top: 8px;
`;

const BannerImage = styled(Image)`
  border-radius: 10px;
  flex: 1;
  width: 100%;
`;

const Pressable = styled(TouchableOpacity)`
  width: ${({ screenWidth }) => screenWidth}px;
  height: ${({ screenWidth }) => (screenWidth - 20) * SIZE_RATIO}px;
  border-radius: 10px;
  border-left-width: 0px;
  border-right-width: 0px;
  border-color: rgba(0, 0, 0, 0.05);
  box-shadow: 4px 4px 4px rgba(0, 0, 0, ${Platform.OS === "ios" ? 0.3 : 1});
  justify-content: center;
  padding-left: 16px;
  padding-right: 16px;
  /* elevation: 6; */
`;

const BannerContainer = styled(View)`
  overflow: hidden;
  border-radius: 10px;
  flex: 1;
  background-color: grey;
`;

const renderBanner = ({ item, screenWidth, setLoading, loading }) => {
  const bannerLoaded = () => setLoading(false);

  const handleClick = async () => {
    try {
      if (item.withLink != undefined) {
        switch (item.withLink) {
          //Website Link
          case 1:
            if (isValidURL(item.url_link)) {
              await WebBrowser.openBrowserAsync(item.url_link);
            }
            break;
          case 2:
            await Linking.openURL(item.url_link);
            break;
        }
      }
    } catch (error) {
      Alert.alert("Banner Error", "Can't open the link");
    }
  };

  return (
    <>
      <Pressable
        onPress={handleClick}
        disabled={item.withLink === 0}
        activeOpacity={0.5}
        screenWidth={screenWidth}
      >
        <BannerContainer>
          <LoadingOverlay display={loading} />

          <CacheImage
            onLoad={bannerLoaded}
            style={{ width: screenWidth, height: "100%", resizeMode: "cover" }}
            uri={`${config.SERVER_HOST}/banners/${item.banner_image}`}
          />
        </BannerContainer>
      </Pressable>
    </>
  );
};

export const FeaturedBanner = ({ bannerData }) => {
  const [loading, setLoading] = useState(true);
  const screenWidth = Math.floor(Dimensions.get("window").width);
  const [bannerList, setBannerList] = useState();
  const { isLogout } = useContext(AuthContext);

  useEffect(() => {
    let isMounted = true;

    const getBanners = async (count) => {
      const banners = await AppServices.getBanners({
        id: config.APP_ID,
        status: 1,
      });

      if (isMounted && banners.success) {
        setBannerList(banners.data);
      }
    };
    if (!isLogout.current) {
      getBanners();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      {bannerList && bannerList.length > 0 ? (
        <>
          <Spacer position={"top"} size={"small"} />
          <ListContainer>
            <Carousel
              width={Dimensions.get("screen").width}
              height={Dimensions.get("screen").width * (9 / 16)}
              data={bannerList}
              autoPlay={true}
              autoPlayInterval={5000}
              renderItem={({ item }) =>
                renderBanner({ item, screenWidth, setLoading, loading })
              }
            />
          </ListContainer>
        </>
      ) : (
        <View style={{ height: 16 }}></View>
      )}
    </>
  );
};
