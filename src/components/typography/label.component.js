import React from "react";
import styled from "styled-components/native";
import { Text } from "react-native";
import { useTheme } from "styled-components/native";

/*
  All typography styling is handled inside styled-components.
  Inline `style` prop will ALWAYS override defaults.
*/

const StyledText = styled(Text)`
  font-size: ${({ theme, size }) =>
    typeof size === "string" ? theme.fontSizes[size] : `${Number(size)}px`};

  font-weight: ${({ theme, weight }) =>
    theme.fontWeights[weight] || theme.fontWeights.regular};

  color: ${({ color }) => color || "black"};

  ${({ shadow }) =>
    shadow
      ? `
        elevation: 10;
        text-shadow-color: rgba(0,0,0,0.8);
        text-shadow-offset: 1px 1.5px;
        text-shadow-radius: 3px;
      `
      : ""}
`;

export const Label = ({
  size = "body",
  weight = "regular",
  color = "black",
  shadow = false,
  children,
  style,
  numberOfLines,
  ellipsizeMode,
  onPress,
}) => {
  const theme = useTheme();

  return (
    <StyledText
      theme={theme}
      size={size}
      weight={weight}
      color={color}
      shadow={shadow}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      onPress={onPress}
      style={[{ includeFontPadding: false }, style]}
    >
      {children}
    </StyledText>
  );
};
