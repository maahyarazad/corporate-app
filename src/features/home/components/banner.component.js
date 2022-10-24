import React, { useContext, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  View,
  Dimensions,
  TouchableOpacity,
  Platform,
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

const BannerList = styled(FlatList)`
  padding-top: 10px;
`;

const ListContainerHeight = () => {
  const screenWidth = Dimensions.get("window").width;
  const imageHeight =
    (screenWidth + (Platform.OS === "ios" ? 40 : 10)) * (3 / 4);
  return imageHeight;
};

const ListContainer = styled(View)`
  height: ${ListContainerHeight}px;
`;

const BannerImage = styled(Image)`
  border-radius: 10px;
  flex: 1;
  width: 100%;
`;

const Pressable = styled(TouchableOpacity)`
  width: ${({ screenWidth }) => screenWidth - 32}px;
  height: ${({ screenWidth }) => (screenWidth - 32) * (3 / 4)}px;
  border-radius: 10px;
  border-left-width: 0px;
  border-right-width: 0px;
  border-color: rgba(0, 0, 0, 0.05);
  box-shadow: 4px 4px 4px rgba(0, 0, 0, ${Platform.OS === "ios" ? 0.3 : 1});
  elevation: 6;
`;

const BannerContainer = styled(View)`
  overflow: hidden;
  border-radius: 10px;
  flex: 1;
`;

const renderBanner = ({ item, screenWidth, setLoading, loading }) => {
  const bannerLoaded = () => setLoading(false);

  const openBrowser = async () => {
    if (isValidURL(item.url_link)) {
      await WebBrowser.openBrowserAsync(item.url_link);
    }
  };

  return (
    <>
      <Pressable
        onPress={openBrowser}
        disabled={!isValidURL(item.url_link)}
        activeOpacity={0.5}
        screenWidth={screenWidth}
      >
        <BannerContainer>
          <LoadingOverlay display={loading} />
          {console.log(`${config.SERVER_HOST}/banners/${item.banner_image}`)}
          <BannerImage
            onLoad={bannerLoaded}
            screenWidth={screenWidth}
            resizeMode="cover"
            source={{
              uri: `${config.SERVER_HOST}/banners/${item.banner_image}`,
            }}
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

    const getBanners = async () => {
      console.log("banners");
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
      <Spacer position={"top"} size={"small"} />
      {bannerList && bannerList.length > 0 ? (
        <ListContainer>
          <BannerList
            data={bannerList}
            horizontal
            disableIntervalMomentum
            decelerationRate={"fast"}
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToAlignment="start"
            snapToInterval={screenWidth}
            renderItem={({ item }) =>
              renderBanner({ item, screenWidth, setLoading, loading })
            }
            contentContainerStyle={{ paddingHorizontal: 16 }}
            ItemSeparatorComponent={itemSeparatorHL}
            keyExtractor={(item) => item.id}
          />
        </ListContainer>
      ) : (
        <View style={{ height: 30 }}></View>
      )}
    </>
  );
};
