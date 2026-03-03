import { Dimensions } from "react-native";

const SCREEN_WIDTH = Dimensions.get("screen").width - 32; // safe padding
const SIZE_RATIO = 9 / 16;

// Hotpick calculations
const HOTPICK_ITEM_WIDTH = Math.min(SCREEN_WIDTH * 0.8);
const HOTPICK_ITEM_HEIGHT = Math.min(HOTPICK_ITEM_WIDTH * SIZE_RATIO);

// Partner card calculations
const PARTNER_IMAGE_HEIGHT = Math.min(SCREEN_WIDTH * SIZE_RATIO);
const PARTNER_CARD_HEIGHT = 250;

export const CARD_SIZE = {
  partner: {
    type: 1,
    image: {
      width: SCREEN_WIDTH,
      height: PARTNER_IMAGE_HEIGHT,
    },
    card: {
      width: SCREEN_WIDTH, // fully numeric
      height: PARTNER_CARD_HEIGHT,
    },
  },

  hotpick: {
    type: 2,
    image: {
      width: HOTPICK_ITEM_WIDTH,
      height: HOTPICK_ITEM_HEIGHT,
    },
    card: {
      width: HOTPICK_ITEM_WIDTH,
      height: HOTPICK_ITEM_HEIGHT + 200, // numeric total
    },
  },
};