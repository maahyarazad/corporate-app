import { Dimensions } from "react-native";

const SCREEN_WIDTH = Dimensions.get("screen").width;
const HOTPICK_ITEM_WIDTH = SCREEN_WIDTH * 0.8;
const HOTPICK_ITEM_HEIGHT = HOTPICK_ITEM_WIDTH * 0.5625;

export const CARD_SIZE = {
  partner: {
    type: 1,
    image: {
      width: "100%",
      height: 250,
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
