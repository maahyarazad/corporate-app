import styled from "styled-components/native";
import {
  Platform,
  View,
  TouchableOpacity,
  Image,
  ImageBackground,
} from "react-native";
import { Label } from "../../../components/typography/label.component";
import { LinearGradient } from "expo-linear-gradient";

export const CategoryHeaderView = styled(View)`
  /* ${Platform.OS === "ios" && `margin-top: -20px`}; */
  flex-direction: row;
`;

export const CategoryContentView = styled(View)`
  flex: 1;
`;

export const CategoryItemContainer = styled(View)`
  width: 100px;
  height: 140px;
  border-radius: 10px;
  background-color: "white";
`;

export const Pressable = styled(TouchableOpacity)`
  elevation: 6;
  width: 100px;
  border-radius: 10px;
  background-color: white;
  box-shadow: 3px 4px 5px rgba(0, 0, 0, ${Platform.OS === "ios" ? 0.3 : 1});
`;

export const CategoryItemImages = styled(Image)`
  flex: 1;
  width: 80px;
  height: 80px;
`;

export const CategoryItemLabels = styled(Label)`
  text-align: center;
  padding: 0px 10px;
`;

export const CategoryLabelContainer = styled(View)`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: white;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
`;

export const CategoryImageContainer = styled(ImageBackground)`
  width: 100px;
  height: 100px;
  align-items: center;
  justify-content: center;
  background-color: black;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  overflow: hidden;
`;
// export const CategoryImageContainer = styled(LinearGradient)`
//   width: 100px;
//   height: 100px;
//   align-items: center;
//   justify-content: center;
//   background-color: yellow;
//   border-top-left-radius: 10px;
//   border-top-right-radius: 10px;
// `;
