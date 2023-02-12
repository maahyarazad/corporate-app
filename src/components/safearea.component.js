import React from "react";
import { StatusBar, SafeAreaView, Platform, StyleSheet } from "react-native";
import styled from "styled-components/native";

const StyledSafeArea = styled(SafeAreaView)`
  flex: 1;
  ${Platform.OS === "android" && `padding-top: ${StatusBar.currentHeight}px`}
`;

export const SafeArea = ({ style, children, pointerEvents }) => {
  return (
    <StyledSafeArea
      style={[styles.default, style]}
      pointerEvents={pointerEvents}
    >
      {children}
    </StyledSafeArea>
  );
};

const styles = StyleSheet.create({
  default: {},
});
