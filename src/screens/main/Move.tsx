import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import ScreenScaffold from "../../components/ScreenScaffold";
import TopBar from "../../components/TopBar";
import { Body, Card } from "../../components/Primitives";
import ResourceState from "../../components/ResourceState";
import { useWeekSessions } from "../../services/workouts";
import { TabNav } from "../../navigation/types";
import { useReloadOnFocus } from "../../navigation/useReloadOnFocus";
import { useAppState } from "../../state/AppState";

/** YYYY-MM-DD in the device's time zone, comparable with session ids. */
function localIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Move() {
  const navigation = useNavigation<TabNav>();
  const { data } = useAppState();
  const sessions = useWeekSessions();
  useReloadOnFocus(sessions.reload);
  const week = sessions.data ?? [];
  const todayIndex = week.findIndex((s) => s.state === "Today");
  // Today's session, else the next one this week. `week` is in date order.
  const featured = todayIndex >= 0 ? week[todayIndex] : week.find((s) => s.id > localIsoDate(new Date()));
  const hasKneePain = data.intake.limits.includes("Knees");

  return (
    <ScreenScaffold header={<TopBar title="Move" subtitle="This week's movement" />}>
      {!sessions.data && <ResourceState resource={sessions} />}
      {sessions.data && week.length === 0 && (
        <Card style={{ marginTop: 14, marginBottom: 14 }}>
          <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 16, color: colors.ink, marginBottom: 6 }}>
            No workouts this week
          </Text>
          <Body color={colors.muted} size={14}>
            Your workouts show here once your care team publishes your plan.
          </Body>
        </Card>
      )}
      {featured && (
        <Card bg={colors.sky} style={{ marginTop: 14, marginBottom: 14 }}>
          <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: colors.skyInk, marginBottom: 8 }}>
            {featured.state === "Today" ? "Today’s session" : `Next session · ${featured.state}`}
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
      )}

      {hasKneePain && (
        <Card bg={colors.amberTint} style={{ marginBottom: 14 }}>
          <Body color={colors.amberInk} size={13}>
            Knee pain flagged in your intake — squat depth stays capped at chair height this week. Stop if
            anything sharpens.
          </Body>
        </Card>
      )}

      <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: colors.muted, marginBottom: 10 }}>
        This week · {week.length} {week.length === 1 ? "session" : "sessions"}
      </Text>
      <View style={{ gap: 10, marginBottom: 18 }}>
        {week.map((s) => (
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
