import { Dimensions } from "react-native";

const SCREEN_WIDTH = Dimensions.get("screen").width - 32;
const HOTPICK_ITEM_WIDTH = SCREEN_WIDTH * 0.8;
const SIZE_RATIO = 9 / 16;
const HOTPICK_ITEM_HEIGHT = HOTPICK_ITEM_WIDTH * SIZE_RATIO;

export const CARD_SIZE = {
  partner: {
    type: 1,
    image: {
      width: SCREEN_WIDTH,
      height: SCREEN_WIDTH * SIZE_RATIO,
    },
    card: {
      width: "100%",
      height: 250,
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
      height: HOTPICK_ITEM_HEIGHT + 200,
    },
  },
};
