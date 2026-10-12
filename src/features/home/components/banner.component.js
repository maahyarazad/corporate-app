import React, { useState } from "react";
import { View, Dimensions, TouchableOpacity, Platform, Linking, StyleSheet } from "react-native";
import styled from "styled-components/native";
import { showToast } from "../../../Toast";
import { LoadingOverlay } from "../../../components/loading/loading.component";
import * as WebBrowser from "expo-web-browser";
import { config } from "../../../utils/constants";
import { isValidURL } from "../../../utils/isValidURL";
import { CacheImage } from "../../../components/cacheImage";

const SIZE_RATIO = 9 / 16;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BANNER_HEIGHT = Math.floor(SCREEN_WIDTH * SIZE_RATIO);

// Styled Components
const ListContainer = styled(View)({
  height: BANNER_HEIGHT,
});

const BannerContainer = styled(View)({
  flex: 1,
  borderRadius: 10,
  backgroundColor: "grey",
  ...(Platform.OS === "ios"
    ? {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      }
    : { elevation: 6 }),
});

const BannerPressable = styled(TouchableOpacity)(({ screenWidth }) => ({
  width: screenWidth,
  height: BANNER_HEIGHT,
  borderRadius: 10,
  borderLeftWidth: 0,
  borderRightWidth: 0,
  borderColor: "rgba(0,0,0,0.05)",
  justifyContent: "center",
  paddingHorizontal: 16,
  backgroundColor: "#eee",
}));

const BannerImageStyled = styled(CacheImage)({
  width: "100%",
  height: "100%",
  borderRadius: 10,
  resizeMode: "cover",
});

// Render Banner Item
const renderBanner = ({ item, screenWidth, loading, setLoading }) => {
  const bannerLoaded = () => setLoading(false);

  const handleClick = async () => {
    try {
      if (!item.withLink) return;
      if (item.withLink === 1 && isValidURL(item.url_link)) {
        await WebBrowser.openBrowserAsync(item.url_link);
      } else if (item.withLink === 2) {
        await Linking.openURL(item.url_link);
      }
    } catch (err) {
      console.err("Banner click error:", err);
      showToast("error", "Banner Error", "Can't open the link");
    }
  };

  return (
    <BannerPressable
      onPress={handleClick}
      disabled={item.withLink === 0}
      activeOpacity={0.5}
      screenWidth={screenWidth}
    >
      <BannerContainer>
        <LoadingOverlay display={loading} />
        <BannerImageStyled
          onLoad={bannerLoaded}
          uri={`${config.SERVER_HOST}/banners/${item.banner_image}`}
        />
      </BannerContainer>
    </BannerPressable>
  );
};

// Main Component
const FeaturedBanner = ({ bannerData }) => {
  const [loading, setLoading] = useState(true);
  const screenWidth = SCREEN_WIDTH;

  if (!bannerData || bannerData.length === 0) return <View style={styles.sizeBox} />;

  return (
    <>
       <View style={styles.spacer} />
      <ListContainer>
        <Carousel
          width={screenWidth}
          height={BANNER_HEIGHT}
          data={bannerData}
          autoPlay={bannerData.length > 1}
          loop={bannerData.length > 1}
          panGestureHandlerProps={{ activeOffsetX: [-10, 10] }}
          autoPlayInterval={5000}
          renderItem={({ item }) =>
            renderBanner({ item, screenWidth, loading, setLoading })
          }
        />
      </ListContainer>
    </>
  );
};

export default React.memo(FeaturedBanner);

const styles = StyleSheet.create({
  sizeBox: {
    height: 16,
  },
  spacer: {
    marginTop: 8,
  },
});
