import React from "react";
import { View } from "react-native";
import styled from "styled-components/native";
import { LoadingOverlay } from "../components/loading/loading.component";

// use "screen" not "window"

const SplashScreenContainer = styled(View)`
  position: absolute;
  top: 0;
  left: 0;
  width: ${width}px;
  height: ${height}px;
  background-color: #999;
  justify-content: center;
  align-items: center;
`;

const LoadingContainer = styled(View)`
  width: 150px;
  height: 150px;
  border-radius: 25px;
  overflow: hidden;
`;

export const SplashScreen = () => {
  return (
    <SplashScreenContainer>
      <LoadingContainer>
        <LoadingOverlay display={true} />
      </LoadingContainer>
    </SplashScreenContainer>
  );
};