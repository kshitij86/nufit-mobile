import React from "react";
import { View, ViewStyle } from "react-native";
import { HorizontalLogo } from "./brand/BrandLockup";

/** The app's logo — the rose lotus lockup. `size` is the lotus mark's size. Prefer `brand/BrandLockup` directly. */
export default function Wordmark({ size = 56, align = "flex-start", style }: { size?: number; align?: "flex-start" | "center"; style?: ViewStyle }) {
  return (
    <View style={[{ alignItems: align }, style]}>
      <HorizontalLogo size={size} />
    </View>
  );
}
