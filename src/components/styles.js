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
  View, StyleSheet,
} from "react-native";
import styled from "styled-components/native";

import { theme } from "../infrastructure/theme";

const { colors } = theme;
export const { width, height } = Dimensions.get("window");

// Helpers for responsive sizes
const w = (factor) => Math.round(width * factor);

// Layout Containers
export const TopHalf = styled(View)({
  flex: 1,
  justifyContent: "center",
  padding: 20,
});

export const BottomHalf = styled(TopHalf)({
  width: "100%",
  justifyContent: "flex-start",
  alignItems: "center",
  padding: 32,
});

export const IconBg = styled(View)({
  width: w(0.7),
  height: w(0.7),
  backgroundColor: colors.ui.primary,
  borderRadius: 250,
  justifyContent: "center",
  alignItems: "center",
});

// Code Input Components
export const CodeInputContainer = styled(View)({
  backgroundColor: "palegreen",
  alignItems: "center",
  justifyContent: "center",
  marginVertical: 16,
});

export const HiddenTextInput = styled(TextInput)({
  backgroundColor: "white",
  textAlign: "center",
  borderRadius: 10,
  position: "absolute",
  width: 1,
  height: 1,
  opacity: 0,
});

export const CodeInputPressLayer = styled(Pressable)({
  flexDirection: "row",
  justifyContent: "space-around",
  width: "100%",
});

export const CodeInputBox = styled(View)({
  width: w(0.17),
  height: w(0.17),
  borderRadius: w(0.17),
  borderWidth: 3,
  borderColor: colors.ui.secondary,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#eee",
});

export const CodeInputBoxText = styled(Text)({
  fontSize: w(0.08), // numeric now
  fontWeight: "bold",
});

export const VerifyButton = styled(TouchableOpacity)({
  width: "100%",
  borderRadius: 10,
  padding: 20,
  alignItems: "center",
  margin: 16,
});

// Request Approval Screen
export const ApprovalContainer = styled(View)({
  flex: 1,
});

export const ApprovalBackground = styled(ImageBackground)({
  flex: 1,
});

export const AddImage = styled(TouchableHighlight)({
  flexDirection: "row",
  flex: 1,
});

export const CompanyLogo = styled(Image)({
  width: 100,
  height: 50,
  position: "relative",
  top: 0,
});

// Spacer Helpers
export const itemSeparatorHS = () => <View  style={styles.spacer}/>;
export const itemSeparatorVS = () => <View style={styles.spacer2} />;
export const itemSeparatorHM = () => <View  style={styles.spacer3} />;
export const itemSeparatorVM = () => <View style={styles.spacer4}/>;
export const itemSeparatorHL = () => <View style={styles.spacer5}/>;
export const itemSeparatorVL = () => <View style={styles.spacer6} />;

const styles = StyleSheet.create({
  spacer: {
    marginLeft: 6,
  },
  spacer2: {
    marginTop: 6,
  },
  spacer3: {
    marginLeft: 8,
  },
  spacer4: {
    marginTop: 8,
  },
  spacer5: {
    marginLeft: 10,
  },
  spacer6: {
    marginTop: 10,
  },
});
