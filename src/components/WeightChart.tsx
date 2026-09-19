import React from "react";
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { colors } from "../theme/colors";

export default function WeightChart({ values, width = 320, height = 120 }: { values: number[]; width?: number; height?: number }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const padding = 10;
  const stepX = (width - padding * 2) / (values.length - 1);

  const points = values.map((v, i) => {
    const x = padding + i * stepX;
    const y = padding + (1 - (v - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.orange} stopOpacity={0.28} />
          <Stop offset="1" stopColor={colors.orange} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={areaPath} fill="url(#areaFill)" />
      <Path d={linePath} stroke={colors.orange} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={5} fill={colors.orange} />
    </Svg>
  );
}
