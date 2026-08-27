import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { LocationCards } from "../../../components/locationcards";
import { Skeleton } from "../../../components/skeleton";
import { Spacer } from "../../../components/spacer/spacer.component";

const MemoizedLocationCard = React.memo(LocationCards);

const TopPartners = ({ topPartnersData }) => {
  // Was data={Object.values(topPartnersData)} with key={item.id} on the element -
  // each `item` is an ARRAY of locations, so item.id was always undefined, and a
  // key on the element returned from renderItem is ignored anyway. Iterating the
  // group labels gives both a real key and a simpler render.
  const groupLabels = useMemo(
    () => (topPartnersData ? Object.keys(topPartnersData) : []),
    [topPartnersData]
  );

  const keyExtractor = useCallback((label) => String(label), []);

  const renderGroup = useCallback(
    ({ item: label }) => (
      <MemoizedLocationCard
        locationList={topPartnersData[label]}
        label={label}
      />
    ),
    [topPartnersData]
  );

  const RenderSkeleton = () => {
    return (
      <>
        <View style={{ paddingHorizontal: 16, paddingBottom: 18 }}>
          <Skeleton
            variant="square"
            borderRadius={25}
            height={30}
            width={200}
            opacityMin={0.1}
            opacityMax={0.2}
          />
           <View style={{marginTop: 8}} />
          <Skeleton
            variant="square"
            borderRadius={10}
            height={330}
            width="100%"
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
            data={groupLabels}
            keyExtractor={keyExtractor}
            renderItem={renderGroup}
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
