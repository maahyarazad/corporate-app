import React from "react";
import {
  Dimensions,
  Image,
  ImageBackground,
  Pressable,
  Text,
  TextInput,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import styled from "styled-components/native";

import { theme } from "../infrastructure/theme";
import { Spacer } from "./spacer/spacer.component";

const { colors } = theme;

export const { width, height } = Dimensions.get("window");

export const TopHalf = styled(View)`
  flex: 1;
  justify-content: center;
  padding: 20px;
`;

export const BottomHalf = styled(TopHalf)`
  width: 100%;
  justify-content: flex-start;
  align-items: center;
  padding: 32px;
`;

export const IconBg = styled(View)`
  width: ${width * 0.7}px;
  height: ${width * 0.7}px;
  background-color: ${colors.ui.primary};
  border-radius: 250px;
  justify-content: center;
  align-items: center;
`;

//------------------------------------------------------

export const CodeInputContainer = styled(View)`
  background-color: "palegreen";
  align-items: center;
  justify-content: center;
  margin: 16px 0;
`;

export const HiddenTextInput = styled(TextInput)`
  background-color: white;
  text-align: center;
  border-radius: 10px;
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  /* height: 1px; */
`;

export const CodeInputPressLayer = styled(Pressable)`
  flex-direction: row;
  justify-content: space-around;
  width: 100%;
`;

export const CodeInputBox = styled(View)`
  width: ${width * 0.17}px;
  height: ${width * 0.17}px;
  border-radius: ${width * 0.17}px;
  border-width: 2px;
  border-color: ${colors.ui.secondary};
  align-items: center;
  justify-content: center;
  background-color: white;
`;

export const CodeInputBoxText = styled(Text)`
  font-size: ${width * 0.08}px;
  font-weight: bold;
`;

export const VerifyButton = styled(TouchableOpacity)`
  width: 100%;
  /* background-color: #22CE80; */
  border-radius: 10px;
  padding: 20px;
  align-items: center;
  margin: 16px;
`;

// Request Approval Screen

export const ApprovalContainer = styled(View)`
  flex: 1;
`;

export const ApprovalBackground = styled(ImageBackground)`
  flex: 1;
`;

export const AddImage = styled(TouchableHighlight)`
  /* height: ${width * (4 / 6)}px;
  margin: 20px 20px;
  background-color: #aaa;
  border-radius: 25px;
  justify-content: center;
  align-items: center; */
  flex-direction: row;
  flex: 1;
`;
export const CompanyLogo = styled(Image)`
  width: 100px;
  height: 50px;
  position: relative;
  top: 0;
`;

export const itemSeparatorHS = () => {
  return <Spacer position={"left"} size="small" />;
};

export const itemSeparatorVS = () => {
  return <Spacer position={"top"} size={"small"} />;
};

export const itemSeparatorHM = () => {
  return <Spacer position={"left"} size="medium" />;
};

export const itemSeparatorVM = () => {
  return <Spacer position={"top"} size={"medium"} />;
};

export const itemSeparatorHL = () => {
  return <Spacer position={"left"} size="large" />;
};

export const itemSeparatorVL = () => {
  return <Spacer position={"top"} size={"large"} />;
};
