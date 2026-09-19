import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import { BackButton, Body, Heading } from "../components/Primitives";
import { programmes } from "../data/programmes";
import { useAppState } from "../state/AppState";
import { RootNav } from "../navigation/types";

export default function Plans() {
  const navigation = useNavigation<RootNav>();
  const { update } = useAppState();

  return (
    <ScreenScaffold header={<BackButton />}>
      <Heading size={26}>All programmes</Heading>
      <Body style={{ marginTop: 8, marginBottom: 20 }}>
        Every track is rewritten around your intake before day one.
      </Body>

      <View style={{ gap: 12 }}>
        {programmes.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => {
              update({ programmeId: p.id });
              navigation.navigate("Match");
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.card,
              borderRadius: 18,
              padding: 12,
              gap: 12,
              shadowColor: "#2B2735",
              shadowOpacity: 0.05,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 3 },
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                backgroundColor: p.tintBg,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: p.tintInk,
                  fontFamily: "Nunito_800ExtraBold",
                  fontSize: 10,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  marginBottom: 3,
                }}
              >
                {p.category}
              </Text>
              <Text style={{ color: colors.ink, fontFamily: "Outfit_700Bold", fontSize: 16 }}>{p.name}</Text>
              <Text style={{ color: colors.muted, fontFamily: "Nunito_600SemiBold", fontSize: 13, marginTop: 2 }}>
                {p.weeksLabel} · {p.priceLabel}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.faint} />
          </Pressable>
        ))}
      </View>
    </ScreenScaffold>
  );
}
