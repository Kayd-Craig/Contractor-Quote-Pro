import React from "react";
import { View } from "react-native";
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from "react-native-svg";

interface Props {
  size?: number;
  color?: string;
}

export function QuickQuoteLogo({ size = 28, color = "#E87722" }: Props) {
  const scale = size / 28;
  const w = 220 * scale;
  const h = 42 * scale;

  return (
    <View style={{ width: w, height: h }}>
      <Svg width={w} height={h} viewBox="0 0 220 42">
        {/* ===== First Q — hammer built into the letter ===== */}
        <G>
          {/* Q circle */}
          <Circle
            cx="15"
            cy="17"
            r="13"
            fill="none"
            stroke={color}
            strokeWidth="4"
          />
          {/* Hammer handle — extends from Q as the tail, going down-right */}
          <Line
            x1="24"
            y1="27"
            x2="36"
            y2="39"
            stroke={color}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Hammer head — wide block at end of handle */}
          <Rect
            x="26.5"
            y="33"
            width="13"
            height="6.5"
            rx="1.5"
            fill={color}
            transform="rotate(-45, 33, 36.25)"
          />
          {/* Claw fork on the hammer head */}
          <Path
            d="M 20.5 29 L 17 32.5"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Path
            d="M 18.5 27 L 15 30.5"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </G>

        {/* "uick" text */}
        <SvgText
          x="33"
          y="28"
          fontSize="26"
          fontWeight="800"
          fontFamily="Inter_700Bold, system-ui, sans-serif"
          fill={color}
        >
          uick
        </SvgText>

        {/* Small nail accent as word separator */}
        <G opacity={0.4}>
          <Circle cx="105" cy="10" r="2.2" fill={color} />
          <Line
            x1="105"
            y1="12"
            x2="105"
            y2="25"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </G>

        {/* "Quote" text */}
        <SvgText
          x="113"
          y="28"
          fontSize="26"
          fontWeight="800"
          fontFamily="Inter_700Bold, system-ui, sans-serif"
          fill={color}
        >
          Quote
        </SvgText>
      </Svg>
    </View>
  );
}
