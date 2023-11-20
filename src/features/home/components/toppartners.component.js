import React, { useContext, useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { LocationCards } from "../../../components/locationcards";
import { Skeleton } from "../../../components/skeleton";
import { Spacer } from "../../../components/spacer/spacer.component";
import { AuthContext } from "../../../services/auth/auth.context";
import { PartnerService } from "../../../services/location/location.service";
import { TranslationContext } from "../../../services/translation/translation.context";
import useRequest from "../../../../hooks/useRequest";
import { config } from "../../../utils/constants";

const MemoizedLocationCard = React.memo(LocationCards);

export const TopPartners = () => {
  const [topPartners, setTopPartners] = useState();
  const { isLogout } = useContext(AuthContext);
  const { lang } = useContext(TranslationContext);
  const request = useRequest();

  useEffect(() => {
    let isMounted = true;

    const getTopPartners = async () => {
      const topPartners = await request(
        `/v2/partner/top-per-category?app_id=${config.APP_ID}&lang=${lang}&count=5`,
        "get"
      );
      if (isMounted && topPartners) {
        setTopPartners(topPartners.result);
        // console.log("Partners", topPartners.result);
      }
    };
    if (!isLogout.current) {
      getTopPartners();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const RenderSkeleton = () => {
    return (
      <>
        <View style={{ paddingHorizontal: 16, paddingBottom: 18 }}>
          <Skeleton
            variant={"square"}
            borderRadius={25}
            height={30}
            width={200}
            opacityMin={0.1}
            opacityMax={0.2}
          />
          <Spacer position={"top"} size="medium" />
          <Skeleton
            variant={"square"}
            borderRadius={10}
            height={330}
            width={"100%"}
            opacityMin={0.1}
            opacityMax={0.2}
          />
        </View>
      </>
    );
  };

  return (
    <>
      <View removeClippedSubviews={true}>
        {topPartners ? (
          <FlatList
            scrollEnabled={false}
            data={Object.values(topPartners)}
            renderItem={({ item, index }) => (
              <LocationCards
                key={item.id}
                locationList={topPartners[Object.keys(topPartners)[index]]}
                label={Object.keys(topPartners)[index]}
              />
            )}
          />
        ) : (
          <RenderSkeleton />
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {},
});
