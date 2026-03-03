import React from "react";
import { View } from "react-native";
import { useTheme } from "styled-components/native";
import styled from "styled-components/native";

const StyledView = styled(View)`
  background-color: transparent;
`;

const positionVariation = {
  top: "marginTop",
  bottom: "marginBottom",
  left: "marginLeft",
  right: "marginRight",
};

const sizeVariation = {
  small: 1,
  medium: 2,
  large: 3,
};

const getVariant = (position, size, theme) => {
  return `${positionVariation[position]}: ${theme.space[sizeVariation[size]]}`;
};

export const Spacer = ({ position, size, children, style }) => {
  const theme = useTheme();
  const variant = getVariant(position, size, theme); 

  return (
    <StyledView style={[variant, style]}>
      {children}
    </StyledView>
  );
};