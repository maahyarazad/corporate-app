import React, { useContext, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { LocationCards } from "../../../components/locationcards";
import { Skeleton } from "../../../components/skeleton";
import { Spacer } from "../../../components/spacer/spacer.component";
import { AuthContext } from "../../../services/auth/auth.context";
import { PartnerService } from "../../../services/location/location.service";

export const TopPartners = () => {
  const [topPartners, setTopPartners] = useState();
  const { isLogout } = useContext(AuthContext);

  useEffect(() => {
    let isMounted = true;

    const getTopPartners = async () => {
      console.log("partners");
      const result = await PartnerService.getTopPerCategories({ count: 5 });
      if (isMounted && result) {
        setTopPartners(result);
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
      {/* {topPartners ? ( */}
      {topPartners ? (
        Object.keys(topPartners).map((key) => {
          {
            /* console.log(topPartners[key]); */
          }
          return (
            <LocationCards
              key={key}
              locationList={topPartners[key]}
              label={key}
            />
          );
        })
      ) : (
        <RenderSkeleton />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {},
});
