import React from "react";
import { Text, View } from "react-native";
import { colors } from "../../theme/colors";
import Lotus from "./Lotus";

const NAME = "Dr Kanika Chauhan";

/** DIET | BODY | MIND, rose-text words with blush dividers. */
export function Tagline({ size = 11 }: { size?: number }) {
  const word = { fontFamily: "Nunito_800ExtraBold", fontSize: size, letterSpacing: size * 0.22, color: colors.roseText };
  const bar = { fontFamily: "Nunito_800ExtraBold", fontSize: size, color: colors.blush };
  return (
    <View style={{ flexDirection: "row", gap: size * 0.9 }}>
      <Text style={word}>DIET</Text>
      <Text style={bar}>|</Text>
      <Text style={word}>BODY</Text>
      <Text style={bar}>|</Text>
      <Text style={word}>MIND</Text>
    </View>
  );
}

/** Horizontal logo: lotus beside the name. For headers and sign-in. */
export function HorizontalLogo({ size = 52, gap = colors.cream, tagline = true }: { size?: number; gap?: string; tagline?: boolean }) {
  const k = size / 70; // design reference: 70px mark, 22px name
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 * k }}>
      <Lotus size={size} gap={gap} />
      <View style={{ gap: 5 * k }}>
        <Text style={{ fontFamily: "MarcellusSC_400Regular", fontSize: 22 * k, letterSpacing: 22 * k * 0.04, color: colors.roseInk }}>{NAME}</Text>
        <Text style={{ fontFamily: "Outfit_300Light", fontSize: 15 * k, letterSpacing: 15 * k * 0.2, color: colors.roseInk }}>360° Fitness</Text>
        {tagline && <Tagline size={9 * k} />}
      </View>
    </View>
  );
}
