import React from "react";
import { View } from "react-native";
import styled from "styled-components/native";
import { LoadingOverlay } from "../components/loading/loading.component";

const SplashScreenContainer = styled(View)`
  flex: 1;
  background: #999;
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
