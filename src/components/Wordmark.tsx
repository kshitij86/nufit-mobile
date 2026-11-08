import React from "react";
import { Text, View, ViewStyle } from "react-native";
import { colors } from "../theme/colors";

/** The app's logo: "360° fitness" large, with the byline set smaller underneath. `size` is the large line's font size. */
export default function Wordmark({ size, align = "flex-start", style }: { size: number; align?: "flex-start" | "center"; style?: ViewStyle }) {
  return (
    <View style={[{ alignItems: align }, style]}>
      <Text style={{ fontFamily: "Outfit_800ExtraBold", fontSize: size, color: colors.ink, letterSpacing: -1 }}>
        360<Text style={{ color: colors.orange }}>°</Text> fitness
      </Text>
      <Text style={{ fontFamily: "Outfit_600SemiBold", fontSize: Math.round(size * 0.38), color: colors.secondary, marginTop: 2 }}>
        by dr. kanika chauhan
      </Text>
    </View>
  );
}
