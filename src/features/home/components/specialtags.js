import React, { memo, useCallback, useContext, useMemo } from "react";
import {
  FlatList,
  Image,
  ImageBackground,
  Platform,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Label } from "../../../components/typography/label.component";
import { specialsLogo } from "../../../utils/constants";
import { itemSeparatorVM } from "../../../components/styles";
import { TranslationContext } from "../../../services/translation/translation.context";
import { REMOVE_CLIPPED_SUBVIEWS } from "../../../utils/listPerf";

const ITEM_WIDTH = 93;

// Horizontal padding the column wrapper adds, subtracted before the per-item
// margin is shared out.
const ROW_PADDING = 24;

// A tile-sized copy of the login background, not the login background itself.
// The original is 1380x920 / 258KB - a full-screen asset that was being decoded
// to fill a 93pt square, once per tag. This is 279x279 (93pt at @3x) and 16KB.
//
// ifza-login-bg.webp is still the real thing on login-verify-info.screen.js,
// which genuinely needs it full-bleed, so it could not be shrunk in place.
const TILE_BACKGROUND = require("../../../../assets/tile-bg.webp");

const keyExtractor = (item) => String(item.id);

// One tile, memoized on its three props. The onPress arrow has to close over
// `item`, but because the tile does not re-render while `item`, `onSelect` and
// `containerStyle` hold their identities, that arrow is never rebuilt.
//
// It lives at module scope deliberately. The four styled-components this file
// used to declare were all defined *inside* SpecialTags, which makes them a new
// component type on every render - React unmounts and remounts the whole
// subtree each time and no memo can ever hit.
const SpecialTagItem = memo(({ item, containerStyle, onSelect }) => (
  <TouchableOpacity onPress={() => onSelect(item)}>
    <View style={containerStyle}>
      <View style={styles.tileShadow}>
        <ImageBackground
          resizeMode="stretch"
          source={TILE_BACKGROUND}
          style={styles.tile}
          imageStyle={styles.tileImage}
        >
          <Image
            style={styles.image}
            resizeMode="cover"
            source={specialsLogo[item.id]}
          />
        </ImageBackground>
      </View>

      <View style={styles.spacer} />

      <View style={styles.labelContainer}>
        <Label style={styles.label}>{item.specialtags_en}</Label>
      </View>
    </View>
  </TouchableOpacity>
));

SpecialTagItem.displayName = "SpecialTagItem";

const SpecialTagsComponent = ({ data, handlePress }) => {
  const { i18n } = useContext(TranslationContext);

  // Dimensions.get("window") read at module scope is a snapshot taken once when
  // the file is first imported - it never updates, so the grid kept its
  // original column count through a rotation. Same fix as commit 31f4bff.
  const { width } = useWindowDimensions();

  const numColumns = useMemo(
    () => Math.max(1, Math.floor(width / ITEM_WIDTH)),
    [width]
  );

  // Memoized as one array rather than a bare number: this is handed to every
  // tile, and a fresh style array per render would defeat SpecialTagItem's memo.
  const itemContainerStyle = useMemo(() => {
    const margin = (width - numColumns * ITEM_WIDTH - ROW_PADDING) / numColumns;

    return [styles.itemContainer, { marginRight: Math.max(0, margin) }];
  }, [width, numColumns]);

  const renderItem = useCallback(
    ({ item }) => (
      <SpecialTagItem
        item={item}
        containerStyle={itemContainerStyle}
        onSelect={handlePress}
      />
    ),
    [itemContainerStyle, handlePress]
  );

  return (
    <View>
      <Label size="heading" weight="bold" style={styles.heading}>
        {i18n.t("offer-details.offers")}
      </Label>

      <FlatList
        // FlatList cannot change numColumns in place - RN throws "Changing
        // numColumns on the fly is not supported". Keying on it forces the
        // remount a rotation needs.
        key={numColumns}
        removeClippedSubviews={REMOVE_CLIPPED_SUBVIEWS}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        scrollEnabled={false}
        nestedScrollEnabled={true}
        numColumns={numColumns}
        style={styles.list}
        columnWrapperStyle={styles.columnWrapper}
        ItemSeparatorComponent={itemSeparatorVM}
      />
    </View>
  );
};

SpecialTagsComponent.displayName = "SpecialTags";

export const SpecialTags = memo(SpecialTagsComponent);

const styles = StyleSheet.create({
  heading: {
    marginLeft: 16,
  },
  list: {
    paddingVertical: 16,
  },
  columnWrapper: {
    justifyContent: "flex-start",
    paddingHorizontal: 16,
  },
  itemContainer: {
    width: ITEM_WIDTH,
  },
  // Platform.select resolves once at module load, replacing the two runtime
  // Platform.OS branches the styled-component and the inline style each did per
  // render.
  tileShadow: {
    backgroundColor: "black",
    borderRadius: 4,
    elevation: 6,
    shadowColor: "black",
    shadowOffset: {
      width: 3,
      height: 4,
    },
    shadowOpacity: Platform.select({ ios: 0.3, default: 1 }),
  },
  tile: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    borderRadius: 10,
    backgroundColor: "black",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: { elevation: 6 },
    }),
  },
  tileImage: {
    borderRadius: 10,
  },
  image: {
    width: 80,
    height: 80,
    tintColor: "white",
  },
  spacer: {
    marginTop: 6,
  },
  labelContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    textAlign: "center",
    textAlignVertical: "center",
  },
});
