import React from "react";
import Svg, { Path } from "react-native-svg";
import { colors } from "../../theme/colors";

/**
 * The brand mark — "Lotus, refined in rose quartz" (logo sheet 2026).
 * Master SVGs live in /brand at the repo root; keep the geometry here in sync with them.
 * Petals step in tone from the outside in; `gap` must match the surface behind the mark.
 */
const PETAL = "M50,80 C36,64 38,40 50,22 C62,40 64,64 50,80 Z";
const PETALS: { t?: string; ring: "far" | "near" | "core" }[] = [
  { t: "rotate(-62) scale(0.72)", ring: "far" },
  { t: "rotate(62) scale(0.72)", ring: "far" },
  { t: "rotate(-31) scale(0.9)", ring: "near" },
  { t: "rotate(31) scale(0.9)", ring: "near" },
  { ring: "core" },
];

export type LotusTone = "default" | "reverse" | "icon";
const TONES: Record<LotusTone, { far: string; near: string; core: string; gap: string }> = {
  default: { far: colors.blush, near: colors.rose, core: colors.roseText, gap: colors.cream }, // on cream / white
  reverse: { far: colors.rose, near: colors.blush, core: colors.blushTint, gap: colors.roseInk }, // on rose ink
  icon: { far: colors.blushTint, near: colors.white, core: colors.roseInk, gap: colors.rose }, // on a rose tile
};

export default function Lotus({ size = 32, tone = "default", gap }: { size?: number; tone?: LotusTone; gap?: string }) {
  const c = TONES[tone];
  return (
    <Svg viewBox="0 0 100 100" width={size} height={size} accessibilityLabel="Dr Kanika Chauhan 360° Fitness">
      {PETALS.map((p, i) => (
        <Path
          key={i}
          d={PETAL}
          transform={p.t ? `translate(50 80) ${p.t} translate(-50 -80)` : undefined}
          fill={c[p.ring]}
          stroke={gap ?? c.gap}
          strokeWidth={3}
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
