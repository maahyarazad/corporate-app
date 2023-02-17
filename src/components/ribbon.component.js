import * as React from "react";
import { Svg, Path } from "react-native-svg";

export default function RibbonSVG({ fill }) {
  return (
    <Svg height="24" width="90">
      <Path d="M0 0 L88 0 L77 12 L88 24 L0 30 Z" fill="#efefef" />
      <Path d="M0 2 L84 2 L74 12 L84 22 L0 22 Z" fill={fill} />
    </Svg>
  );
}
