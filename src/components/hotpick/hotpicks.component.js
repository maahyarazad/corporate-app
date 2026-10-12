import React, { memo, useCallback, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Chip } from "react-native-paper";
import Carousel from "react-native-reanimated-carousel";
import { useSharedValue } from "react-native-reanimated";
import { MyCard } from "../myCard.component";
import { Label } from "../typography/label.component";
import { offerStamps } from "../../utils/constants";
import { navigate } from "../../navigation/navigate";
import { theme } from "../../infrastructure/theme";

// Reads nothing from props or state - only its own argument and the imported
// `navigate` - so module scope is the right home. It was briefly a useCallback,
// which crashed twice over: `useCallback` was never imported, and the dependency
// array `[id]` referenced the callback's own parameter, which does not exist in
// the component body. That is the same mistake map.screen.js records as FIX 1.
const handlePress = (id) => {
  navigate("Location View", { locId: id });
};

// One slide, memoized on `item` alone.
//
// This is what makes MyCard's own memo pay. The onPress arrow below is
// unavoidable - it has to close over this item - but because the slide is
// memoized and `item` is stable between fetches, the slide does not re-render,
// so the arrow is never rebuilt and MyCard sees identical props. Wrapping the
// arrow in useCallback instead would not have worked: it would still be a new
// function for every item on every render of the list.
//
// Same shape as PartnerMarker in map.screen.js, and it must live at module
// scope for the same reason - a component declared during render is a new type
// each time, so React remounts the subtree and memo can never hit.
const HotpickSlide = memo(({ item }) => (
  <View style={styles.slideContainer}>
    <MyCard
      onPress={() => handlePress(item.partner_id)}
      size="hotpick"
      stamp={offerStamps[item.premium_id - 1]}
      offer_name={item.offer_name}
      outlet_name={item.outlet_name}
      imgUrl={`${item.file}`}
    />
  </View>
));

HotpickSlide.displayName = "HotpickSlide";

const renderItem = ({ item }) => <HotpickSlide item={item} />;

// Static configuration for the carousels. These were inline literals, so a new
// object crossed to the native animated component on every single render.
const CAROUSEL_ANIMATION = { type: "timing", config: { duration: 500 } };
const PAN_GESTURE_PROPS = { activeOffsetX: [-10, 10] };
const PARALLAX_MANY = {
  parallaxScrollingScale: 0.8,
  parallaxScrollingOffset: 205,
};
const PARALLAX_PAIR = {
  parallaxScrollingScale: 0.9,
  parallaxScrollingOffset: 150,
};

const Hotpicks = ({ hotpickData }) => {
  const progressValue = useSharedValue(0);
  const [reverse, setReverse] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // `Dimensions.get("screen")` read during render is a snapshot, not a
  // subscription: it never re-renders on its own, so the carousel kept its
  // original size through a rotation. Same fix as commit 31f4bff on the map
  // screen.
  const { width } = useWindowDimensions();

  // These three are where useCallback actually earns its place in this file:
  // each closes over component state or props, each is handed to a
  // Reanimated-backed component, and each was previously rebuilt on every
  // render. The item handlers are not here on purpose - see HotpickSlide.

  // Shared by both carousels. `progressValue` is a shared value and the setters
  // are stable, so this never needs rebuilding.
  const handleProgress = useCallback(
    (_, absoluteProgress) => {
      progressValue.value = absoluteProgress;

      // True only when absoluteProgress + 1 lands on an exact integer, i.e. at
      // a snap point rather than every animation frame.
      if (Math.floor(absoluteProgress + 1) / (absoluteProgress + 1) === 1) {
        setCurrentIndex(absoluteProgress + 1);
      }
    },
    [progressValue]
  );

  // The two-card carousel bounces instead of looping, so it also flips
  // direction at the ends.
  const handleProgressBouncing = useCallback(
    (_, absoluteProgress) => {
      if (absoluteProgress === 0) {
        setReverse(false);
      } else if (absoluteProgress === 1) {
        setReverse(true);
      }

      handleProgress(_, absoluteProgress);
    },
    [handleProgress]
  );

  // The single-card branch renders MyCard directly rather than through
  // HotpickSlide, so its onPress needs stabilising here for MyCard's memo to
  // hold.
  const handleSinglePress = useCallback(
    () => handlePress(hotpickData?.[0]?.partner_id),
    [hotpickData]
  );

  return (
    <>
      {!!hotpickData && hotpickData.length > 0 && (
        <View style={styles.container}>
          <View style={styles.header}>
            <Label style={styles.label} size="heading" weight="bold">
              Hot Picks
            </Label>
          </View>
          <View style={styles.hotpickContent}>
            {hotpickData.length > 2 ? (
              <Carousel
                style={styles.carousel}
                windowSize={3}
                data={hotpickData}
                renderItem={renderItem}
                autoPlay={true}
                snapEnabled={true}
                autoPlayInterval={3000}
                width={width}
                height={width * 0.6}
                mode="parallax"
                pagingEnabled={true}
                onProgressChange={handleProgress}
                panGestureHandlerProps={PAN_GESTURE_PROPS}
                withAnimation={CAROUSEL_ANIMATION}
                modeConfig={PARALLAX_MANY}
              />
            ) : hotpickData.length === 1 ? (
              <>
                {/* Show only 1 card */}
                <View style={styles.pad}>
                  <MyCard
                    onPress={handleSinglePress}
                    size="hotpick"
                    width="100%"
                    imgWidth="100%"
                    imgHeight={width * 0.5}
                    stamp={offerStamps[hotpickData[0].premium_id - 1]}
                    offer_name={hotpickData[0].offer_name}
                    imgUrl={`${hotpickData[0].file}`}
                    outlet_name={hotpickData[0].outlet_name}
                    style={styles.myCard}
                  />
                </View>
              </>
            ) : (
              <>
                {/* Show only 2 cards */}
                <Carousel
                  style={styles.carousel2}
                  data={hotpickData}
                  renderItem={renderItem}
                  autoPlay={true}
                  autoPlayReverse={reverse}
                  loop={false}
                  snapEnabled={true}
                  autoPlayInterval={3000}
                  width={width}
                  height={width * 0.64}
                  mode="parallax"
                  pagingEnabled={true}
                  onProgressChange={handleProgressBouncing}
                  withAnimation={CAROUSEL_ANIMATION}
                  modeConfig={PARALLAX_PAIR}
                />
              </>
            )}

            {hotpickData.length > 1 && (
              <View style={styles.pagination}>
                <Chip style={styles.indexChip} textStyle={styles.chipText}>
                  <Label
                    weight="bold"
                    color="white"
                  >{`${currentIndex} out of ${hotpickData.length}`}</Label>
                </Chip>
              </View>
            )}
          </View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: -12,
  },
  header: {
    marginLeft: 16,
    marginTop: 0,
    marginBottom: -16,
  },
  hotpickContent: {},
  slideContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 500,
  },
  label: {
    marginTop: 16,
  },
  carousel: {
    flex: 1,
    alignContent: "center",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column"
  },
  pad: {
    padding: 16,
  },
  myCard: {
    padding: 16,
    paddingTop: 26,
  },
  carousel2: {
    flex: 1,
    alignContent: "center",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
  },
  // The container previously branched on an `isVertical` state that nothing
  // ever set, so only this branch was ever reachable.
  pagination: {
    marginBottom: 2,
    flexDirection: "row",
    justifyContent: "center",
    width: 100,
    alignSelf: "center",
  },
  indexChip: {
    backgroundColor: theme.colors.icons.active,
    borderRadius: 50,
  },
  chipText: {
    width: 105,
    textAlign: "center",
  },
});

export default React.memo(Hotpicks);
