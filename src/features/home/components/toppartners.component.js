import React, { useContext, useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { LocationCards } from "../../../components/locationcards";
import { Skeleton } from "../../../components/skeleton";
import { Spacer } from "../../../components/spacer/spacer.component";

const MemoizedLocationCard = React.memo(LocationCards);

const TopPartners = ({ topPartnersData }) => {
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
        {topPartnersData ? (
          <FlatList
            scrollEnabled={false}
            data={Object.values(topPartnersData)}
            renderItem={({ item, index }) => (
              <LocationCards
                key={item.id}
                locationList={
                  topPartnersData[Object.keys(topPartnersData)[index]]
                }
                label={Object.keys(topPartnersData)[index]}
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

export default React.memo(TopPartners);
