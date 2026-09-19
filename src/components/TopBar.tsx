import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { useAppState } from "../state/AppState";
import { TabNav } from "../navigation/types";

export default function TopBar({ title, subtitle }: { title: string; subtitle: string }) {
  const navigation = useNavigation<TabNav>();
  const { data } = useAppState();
  const initials = data.profileName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <View>
        <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 22, color: colors.ink }}>{title}</Text>
        <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 13, color: colors.muted, marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable
          onPress={() => navigation.navigate("Streak")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: colors.orangeTint,
            borderRadius: 999,
            paddingVertical: 7,
            paddingHorizontal: 12,
          }}
        >
          <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.orange }} />
          <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 12, color: colors.orangeDark }}>
            {data.streak} steady
          </Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate("Profile")}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: colors.ink,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontFamily: "Outfit_700Bold", fontSize: 13 }}>{initials}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function IconIonicon(props: { name: keyof typeof Ionicons.glyphMap; size?: number; color?: string }) {
  return <Ionicons name={props.name} size={props.size ?? 20} color={props.color ?? colors.ink} />;
}
