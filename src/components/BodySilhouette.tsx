import React, { useEffect, useState } from "react";
import { Animated, View, Text } from "react-native";
import Svg, { Polygon, Circle, Rect, Line, Ellipse } from "react-native-svg";
import { colors } from "../theme/colors";
import { MeasureSite } from "../types";

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

type Region = MeasureSite["region"];

const regionBox: Record<Region, { x: number; y: number; w: number; h: number }> = {
  arm: { x: 136, y: 100, w: 38, h: 55 },
  torsoUpper: { x: 76, y: 92, w: 68, h: 24 },
  torsoMid: { x: 74, y: 138, w: 72, h: 24 },
  torsoLower: { x: 76, y: 160, w: 68, h: 20 },
  hip: { x: 70, y: 193, w: 82, h: 26 },
  thigh: { x: 74, y: 224, w: 74, h: 48 },
};

export default function BodySilhouette({ region, gender }: { region: Region; gender: "female" | "male" }) {
  const [sway] = useState(() => new Animated.Value(0));
  const [glow] = useState(() => new Animated.Value(0.3));
  const [wiggle] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const swayLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 2600, useNativeDriver: true }),
        Animated.timing(sway, { toValue: -1, duration: 2600, useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: 1300, useNativeDriver: true }),
      ])
    );
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 0.6, duration: 900, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0.28, duration: 900, useNativeDriver: false }),
      ])
    );
    const wiggleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(wiggle, { toValue: 1, duration: 1100, useNativeDriver: false }),
        Animated.timing(wiggle, { toValue: -1, duration: 1100, useNativeDriver: false }),
      ])
    );
    swayLoop.start();
    glowLoop.start();
    wiggleLoop.start();
    return () => {
      swayLoop.stop();
      glowLoop.stop();
      wiggleLoop.stop();
    };
  }, [sway, glow, wiggle]);

  const rotate = sway.interpolate({ inputRange: [-1, 1], outputRange: ["-1.4deg", "1.4deg"] });
  const box = regionBox[region];
  const guideY = box.y + box.h / 2;
  const ellipseCx = wiggle.interpolate({ inputRange: [-1, 1], outputRange: [110 - 5, 110 + 5] });

  const shoulderW = gender === "male" ? 44 : 36;
  const hipW = gender === "male" ? 34 : 42;

  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: "100%" }}>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Svg width={200} height={330} viewBox="0 0 220 420">
          {/* legs */}
          <Polygon
            points={`${110 - hipW / 2 + 5},210 ${110 + 5},210 ${100},400 ${78},400`}
            fill={colors.hairline}
            stroke={colors.faint}
            strokeWidth={1.5}
          />
          <Polygon
            points={`${110 - 5},210 ${110 + hipW / 2 - 5},210 ${142},400 ${120},400`}
            fill={colors.hairline}
            stroke={colors.faint}
            strokeWidth={1.5}
          />
          {/* arms */}
          <Polygon points="58,85 78,85 68,210 50,210" fill={colors.hairline} stroke={colors.faint} strokeWidth={1.5} />
          <Polygon points="142,85 162,85 170,210 152,210" fill={colors.hairline} stroke={colors.faint} strokeWidth={1.5} />
          {/* torso */}
          <Polygon
            points={`${110 - shoulderW / 2},80 ${110 + shoulderW / 2},80 ${110 + hipW / 2},210 ${110 - hipW / 2},210`}
            fill={colors.hairline}
            stroke={colors.faint}
            strokeWidth={1.5}
          />
          {/* head + neck */}
          <Rect x={100} y={62} width={20} height={14} rx={4} fill={colors.hairline} stroke={colors.faint} strokeWidth={1.5} />
          <Circle cx={110} cy={42} r={24} fill={colors.hairline} stroke={colors.faint} strokeWidth={1.5} />

          {/* highlight band */}
          <AnimatedRect
            x={box.x}
            y={box.y}
            width={box.w}
            height={box.h}
            rx={10}
            fill={colors.orange}
            opacity={glow}
          />

          {/* dashed guide line */}
          <Line x1={20} y1={guideY} x2={200} y2={guideY} stroke={colors.orangeDark} strokeWidth={1.5} strokeDasharray="4,5" />

          {/* tape ellipse */}
          <AnimatedEllipse
            cx={ellipseCx}
            cy={guideY}
            rx={box.w / 2 + 14}
            ry={8}
            fill="none"
            stroke={colors.orangeDark}
            strokeWidth={1.5}
            strokeDasharray="3,4"
          />
          <Circle cx={box.x + box.w + 12} cy={guideY} r={4} fill={colors.orangeDark} />
        </Svg>
      </Animated.View>
      <Text
        style={{
          position: "absolute",
          bottom: 6,
          left: 6,
          fontFamily: "Nunito_800ExtraBold",
          fontSize: 10,
          letterSpacing: 0.6,
          color: colors.muted,
        }}
      >
        FRONT VIEW · TAPE POSITION
      </Text>
    </View>
  );
}
