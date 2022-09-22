import React from "react";
import styled from "styled-components/native";
import { Text } from "react-native";
import { useTheme } from "styled-components";

const StyledText = styled(Text)`
  ${({ variant }) => {
    return variant;
  }}
  ${({ shadow }) => {
    if (shadow) {
      return `
              elevation: 10;
              text-shadow: 1px 1.5px 3px rgba(0,0,0,0.8);
              `;
    }
  }}
`;

const getVariant = (size, weight, theme) => {
  return `
        font-weight: ${theme.fontWeights[weight]};
        font-size: ${theme.fontSizes[size]};
    `;
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
}) => {
  const theme = useTheme();
  const variant = getVariant(size, weight, theme);
  return (
    <StyledText
      onPress={onPress}
      shadow={shadow}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      style={[style, { includeFontPadding: false }]}
      variant={variant}
    >
      {children}
    </StyledText>
  );
};

Label.defaultProps = {
  size: "body",
  weight: "regular",
};
