import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import ScreenScaffold from "../../components/ScreenScaffold";
import TopBar from "../../components/TopBar";
import { Body, Card } from "../../components/Primitives";
import { sessions } from "../../data/sessions";
import { TabNav } from "../../navigation/types";
import { useAppState } from "../../state/AppState";

export default function Move() {
  const navigation = useNavigation<TabNav>();
  const { data } = useAppState();
  const featured = sessions[0];
  const hasKneePain = data.intake.limits.includes("Knees");

  return (
    <ScreenScaffold header={<TopBar title="Move" subtitle="This week's movement" />}>
      <Card bg={colors.sky} style={{ marginTop: 14, marginBottom: 14 }}>
        <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: colors.skyInk, marginBottom: 8 }}>
          Today’s session
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 19, color: colors.ink, marginBottom: 4 }}>
              {featured.name}
            </Text>
            <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 13, color: colors.skyInk }}>
              {featured.kind} · {featured.minutes} min · {featured.kit}
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate("Player", { sessionId: featured.id })}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.skyStrong,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="play" size={24} color="#fff" />
          </Pressable>
        </View>
      </Card>

      {hasKneePain && (
        <Card bg={colors.amberTint} style={{ marginBottom: 14 }}>
          <Body color={colors.amberInk} size={13}>
            Knee pain flagged in your intake — squat depth stays capped at chair height this week. Stop if
            anything sharpens.
          </Body>
        </Card>
      )}

      <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: colors.muted, marginBottom: 10 }}>
        This week · 4 sessions
      </Text>
      <View style={{ gap: 10, marginBottom: 18 }}>
        {sessions.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => navigation.navigate("Player", { sessionId: s.id })}
            style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: 16, padding: 12, gap: 12 }}
          >
            <View style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: s.tint }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 15, color: colors.ink }}>{s.name}</Text>
              <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 12, color: colors.muted, marginTop: 2 }}>
                {s.kind} · {s.minutes} mins · {s.kit}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: "Nunito_800ExtraBold",
                fontSize: 12,
                color: s.state === "Today" ? colors.orangeDark : colors.muted,
              }}
            >
              {s.state}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => navigation.navigate("Sleep")}>
        <Card bg={colors.lilac}>
          <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 13, color: colors.lilacInk, marginBottom: 4 }}>
            Wind-down & sleep →
          </Text>
          <Body color={colors.lilacInk} size={13}>
            Your metabolism is rebuilt while you sleep.
          </Body>
        </Card>
      </Pressable>
    </ScreenScaffold>
  );
}
