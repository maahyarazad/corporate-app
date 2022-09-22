import React from "react";
import { StatusBar, SafeAreaView, Platform, StyleSheet } from "react-native";
import styled from "styled-components/native";

const StyledSafeArea = styled(SafeAreaView)`
  flex: 1;
  ${Platform.OS === "android" && `padding-top: ${StatusBar.currentHeight}px`}
`;

export const SafeArea = ({ style, children }) => {
  return (
    <StyledSafeArea style={[styles.default, style]}>{children}</StyledSafeArea>
  );
};

const styles = StyleSheet.create({
  default: {},
});
