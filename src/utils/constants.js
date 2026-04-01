import Constants from "expo-constants";
export const honorificList = ["Mr.", "Mrs.", "Ms.", "Dr.", "Engr."];

export const offerChipIcon = {
  1: "percent",
  2: "tag-multiple",
};

export const offerChipColor = {
  1: "#FFD892",
  2: "#9FD8FF",
};

export const config = {
  BASE_URL: process.env.EXPO_PUBLIC_BASE_URL,
  SERVER_HOST: process.env.EXPO_PUBLIC_SERVER_HOST,
  SERVICES_BASE_URL:process.env.EXPO_PUBLIC_SERVICES_BASE_URL,
  SERVICES_HOST: process.env.EXPO_PUBLIC_SERVICES_HOST,

  APP_ID: 2,
  CURRENCY: "AED",
  DEV: process.env.EXPO_PUBLIC_DEV === "true",
};

export const EULAPrivacyLink = `https://www.buenapublica.com/privacy-policy`;
export const DELETE_ACCOUNT = `https://services.german-emirates-club.com/account-deletion`;

export const loginBGImage = require("../../assets/ifza-login-bg2.jpg");

export const companyLogo = require("../../assets/GE-LOGO-GOLD.png");

export const keywordIcon = {
  1: "store",
  2: "format-list-text",
  3: "tag-multiple",
  4: "food-fork-drink",
};

export const searchSource = {
  searchbar: 0,
  suggestion: 1,
};

export const genderEnum = {
  m: "Male",
  f: "Female",
};

export const offerStamps = [
  require("../../assets/stamps/GEC_1_Off_Discount.png"),
  require("../../assets/stamps/GEC_2_Off_Discount.png"),
  require("../../assets/stamps/GEC_3_Off_Discount.png"),
  require("../../assets/stamps/GEC_4_Off_Discount.png"),
  require("../../assets/stamps/GEC_5_Off_Discount.png"),
  require("../../assets/stamps/GEC_6_Off_Discount.png"),
  require("../../assets/stamps/GEC_7_Off_Discount.png"),
  require("../../assets/stamps/GEC_8_Off_Discount.png"),
  require("../../assets/stamps/GEC_9_Off_Discount.png"),
  require("../../assets/stamps/GEC_10_Off_Discount.png"),
  require("../../assets/stamps/GEC_11_Off_Discount.png"),
  require("../../assets/stamps/GEC_12_Off_Discount.png"),
  require("../../assets/stamps/GEC_13_Off_Discount.png"),
  require("../../assets/stamps/GEC_14_Off_Discount.png"),
  require("../../assets/stamps/GEC_15_Off_Discount.png"),
  require("../../assets/stamps/GEC_16_Off_Discount.png"),
  require("../../assets/stamps/GEC_17_Off_Discount.png"),
  require("../../assets/stamps/GEC_18_Off_Discount.png"),
  require("../../assets/stamps/GEC_19_Off_Discount.png"),
  require("../../assets/stamps/GEC_20_Off_Discount.png"),
  require("../../assets/stamps/GEC_25_Off_Discount.png"),
  require("../../assets/stamps/GEC_30_Off_Discount.png"),
  require("../../assets/stamps/GEC_35_Off_Discount.png"),
  require("../../assets/stamps/GEC_40_Off_Discount.png"),
  require("../../assets/stamps/GEC_45_Off_Discount.png"),
  require("../../assets/stamps/GEC_50_Off_Discount.png"),
  require("../../assets/stamps/GEC_55_Off_Discount.png"),
  require("../../assets/stamps/GEC_60_Off_Discount.png"),
  require("../../assets/stamps/GEC_65_Off_Discount.png"),
  require("../../assets/stamps/GEC_70_Off_Discount.png"),
  require("../../assets/stamps/GEC_75_Off_Discount.png"),
  require("../../assets/stamps/GEC_80_Off_Discount.png"),
  require("../../assets/stamps/GEC_85_Off_Discount.png"),
  require("../../assets/stamps/GEC_90_Off_Discount.png"),
  require("../../assets/stamps/GEC_95_Off_Discount.png"),
  require("../../assets/stamps/GEC_100_Off_Discount.png"),
  // require("../../assets/stamps/GEC_Best_Offer.png"),
  require("../../assets/stamps/GEC_2_for_1.png"),
  require("../../assets/stamps/GEC_3_for_2.png"),
  require("../../assets/stamps/GEC_4_for_3.png"),
  require("../../assets/stamps/GEC_5_for_4.png"),
  require("../../assets/stamps/GEC_6_for_5.png"),
  require("../../assets/stamps/GEC_7_for_6.png"),
  require("../../assets/stamps/GEC_Freebie.png"),
  // require("../../assets/stamps/GEC_Special_Offer.png"),
];

export const adminFileBaseURL = `https://www.german-emirates-club.com/uploads/sys/`;

export const categorylogo = {
  1: require("../../assets/Food_Drinks.png"),
  2: require("../../assets/Beauty_Fitness.png"),
  3: require("../../assets/Attraction_Leisure.png"),
  4: require("../../assets/Fashion_Retail.png"),
  5: require("../../assets/EverydayServices.png"),
  6: require("../../assets/Travel.png"),
  7: require("../../assets/Education.png"),
  8: require("../../assets/Healthcare.png"),
  9: require("../../assets/FinancialServices.png"),
  10: require("../../assets/RealEstate.png"),
  11: require("../../assets/Consulting.png"),
};

export const specialsLogo = {
  1: require("../../assets/specials/Summer_Super_Sale.png"),
  2: require("../../assets/specials/Brand_New.png"),
  3: require("../../assets/specials/Monthly_Offers.png"),
  4: require("../../assets/specials/Trending_Offers.png"),
  5: require("../../assets/specials/Flash_Sale.png"),
  6: require("../../assets/specials/Hot_Pick.png"),
  7: require("../../assets/specials/Breakfast.png"),
  8: require("../../assets/specials/Brunches.png"),
  9: require("../../assets/specials/Buffet.png"),
  10: require("../../assets/specials/Gourmet.png"),
  11: require("../../assets/specials/Cuisine.png"),
  12: require("../../assets/specials/Shisha_Offers.png"),
  13: require("../../assets/specials/Takeaway.png"),
  14: require("../../assets/specials/Delivery.png"),
  15: require("../../assets/specials/Adrenaline.png"),
  16: require("../../assets/specials/Staycations.png"),
  17: require("../../assets/specials/Daycations.png"),
  18: require("../../assets/specials/Workspace.png"),
  19: require("../../assets/specials/Kids.png"),
  20: require("../../assets/specials/Pet_Friendly.png"),
};

export const typeEnum = {
  category: 0,
  specialtags: 1,
};
