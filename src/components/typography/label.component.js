import React from "react";
import styled from "styled-components/native";
import { Text } from "react-native";
import { useTheme } from "styled-components/native";

// StyledText now receives numeric styles
const StyledText = styled(Text)`
  ${({ variant }) => variant};
  ${({ shadow }) =>
    shadow
      ? `
        elevation: 10;
        text-shadow: 1px 1.5px 3px rgba(0,0,0,0.8);
      `
      : ""}
`;

// getVariant now ensures fontSize is a number
const getVariant = (size, weight, color, theme) => {
  const fontSize =
    typeof size === "string" ? theme.fontSizes[size] : Number(size);

  const fontWeight = theme.fontWeights[weight] || theme.fontWeights.regular;

  const textColor = color || "black";

  return {
    fontWeight,
    fontSize, // numeric!
    color: textColor,
  };
};

export const Label = ({
  size,
  weight,
  children,
  shadow,
  style,
  numberOfLines,
  ellipsizeMode,
  onPress,
  color,
}) => {
  const theme = useTheme();
  const variant = getVariant(size, weight, color, theme);

  return (
    <StyledText
      onPress={onPress}
      shadow={shadow}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      style={[style, { includeFontPadding: false }, variant]} // variant merged as object
    >
      {children}
    </StyledText>
  );
};

Label.defaultProps = {
  size: "body",
  weight: "regular",
  color: "black",
};