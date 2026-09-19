import React from "react";
import { View, Text, ViewStyle, TextStyle, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../theme/colors";

export function Card({
  children,
  style,
  bg = colors.card,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  bg?: string;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: 22,
          padding: 18,
          shadowColor: "#2B2735",
          shadowOpacity: 0.05,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Eyebrow({ children, color = colors.orange }: { children: React.ReactNode; color?: string }) {
  return (
    <Text
      style={{
        color,
        fontFamily: "Nunito_800ExtraBold",
        fontSize: 12,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        marginBottom: 8,
      }}
    >
      {children}
    </Text>
  );
}

export function Heading({ children, size = 26 }: { children: React.ReactNode; size?: number }) {
  return (
    <Text style={{ color: colors.ink, fontFamily: "Outfit_700Bold", fontSize: size, lineHeight: size * 1.2 }}>
      {children}
    </Text>
  );
}

export function Body({
  children,
  color = colors.secondary,
  size = 15,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  size?: number;
  style?: TextStyle;
}) {
  return (
    <Text style={[{ color, fontFamily: "Nunito_400Regular", fontSize: size, lineHeight: size * 1.5 }, style]}>
      {children}
    </Text>
  );
}

export function BackButton({ onPress }: { onPress?: () => void }) {
  const navigation = useNavigation();
  return (
    <Pressable
      onPress={onPress ?? (() => navigation.goBack())}
      hitSlop={10}
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.card,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#2B2735",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 1,
      }}
    >
      <Ionicons name="arrow-back" size={20} color={colors.ink} />
    </Pressable>
  );
}

export function ProgressBar({ progress, color = colors.orange, track = colors.hairline, height = 6 }: {
  progress: number;
  color?: string;
  track?: string;
  height?: number;
}) {
  return (
    <View style={{ height, borderRadius: 999, backgroundColor: track, overflow: "hidden", width: "100%" }}>
      <View
        style={{
          height: "100%",
          width: `${Math.max(0, Math.min(100, progress * 100))}%`,
          backgroundColor: color,
          borderRadius: 999,
        }}
      />
    </View>
  );
}

export function StatChip({ value, label, tint = colors.orangeTint, ink = colors.orangeDark }: {
  value: string;
  label: string;
  tint?: string;
  ink?: string;
}) {
  return (
    <View
      style={{
        backgroundColor: tint,
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 12,
        alignItems: "center",
        flex: 1,
      }}
    >
      <Text style={{ color: ink, fontFamily: "Outfit_700Bold", fontSize: 16 }}>{value}</Text>
      <Text style={{ color: ink, fontFamily: "Nunito_600SemiBold", fontSize: 11, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

export function CheckBadge({ size = 20, bg = colors.orange, checked = true }: { size?: number; bg?: string; checked?: boolean }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: checked ? bg : "transparent",
        borderWidth: checked ? 0 : 1.5,
        borderColor: colors.hairline,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {checked && <Ionicons name="checkmark" size={size * 0.65} color="#FFFFFF" />}
    </View>
  );
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.hairline, width: "100%" }} />;
}
