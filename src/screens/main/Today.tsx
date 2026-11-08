import React, { useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import ScreenScaffold from "../../components/ScreenScaffold";
import TopBar from "../../components/TopBar";
import { Body, Card, CheckBadge, ProgressBar } from "../../components/Primitives";
import ResourceState from "../../components/ResourceState";
import { useTodayPlan } from "../../services/diet";
import { ProgrammeState, ProgrammeStatus, useProgrammeStatus } from "../../services/journey";
import { moodById } from "../../data/moods";
import { useAppState } from "../../state/AppState";
import { TabNav } from "../../navigation/types";
import { useReloadOnFocus } from "../../navigation/useReloadOnFocus";
import { formatCalendarDay } from "../../utils/format";

const DEFAULT_WATER_LITRES = 4;

/** What Today says when there's nothing on it. `reason` is null on an active day with no items. */
function emptyMessage(reason: ProgrammeState | null, status: ProgrammeStatus | undefined) {
  switch (reason) {
    case "awaiting_plan":
      return {
        icon: "hourglass-outline" as const,
        title: "Your plan is being prepared",
        body: "Your care team is building your diet chart and workouts. We'll let you know as soon as it's ready.",
      };
    case "scheduled":
      return {
        title: `Your plan starts ${status?.startDate ? formatCalendarDay(status.startDate) : "soon"}`,
        body: "Your meals and workouts will show here from day 1.",
      };
    case "completed":
      return { title: "Programme complete", body: "Well done. Your care team will be in touch about what comes next." };
    case "none":
      return { title: "No programme yet", body: "Once you've chosen a programme and your plan is ready, your day shows here." };
    default:
      return { title: "Nothing planned today", body: "Take it easy — your plan picks up again tomorrow." };
  }
}

export default function Today() {
  const navigation = useNavigation<TabNav>();
  const { data, toggleDayTask } = useAppState();
  const mood = moodById(data.mood);
  const plan = useTodayPlan();
  const programme = useProgrammeStatus();
  const status = programme.data;
  const { reload: reloadPlan } = plan;
  const { reload: reloadProgramme } = programme;
  useReloadOnFocus(
    useCallback(() => {
      reloadPlan();
      reloadProgramme();
    }, [reloadPlan, reloadProgramme])
  );
  const items = plan.data?.items ?? [];
  const doneCount = items.filter((i) => data.dayTasksDone[i.id]).length;
  const waterTarget = plan.data?.guidance?.waterLitres || DEFAULT_WATER_LITRES;
  const empty = plan.data && items.length === 0 ? emptyMessage(plan.data.reason, status) : null;
  const subtitle = !status ? "" : status.status === "active" ? `${status.weekday} · Day ${status.day}` : status.weekday;

  return (
    <ScreenScaffold header={<TopBar title="Today" subtitle={subtitle} />}>
      <Pressable onPress={() => navigation.navigate("Mood")}>
        <Card bg={mood.bg} style={{ marginTop: 14, marginBottom: 14 }}>
          <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: colors.ink, marginBottom: 6 }}>
            Checked in · {mood.label}
          </Text>
          <Body color={colors.ink} size={14} style={{ marginBottom: 10 }}>{mood.note}</Body>
          <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 13, color: colors.orangeDark }}>
            Change how I feel →
          </Text>
        </Card>
      </Pressable>

      <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
        <Card style={{ flex: 1 }}>
          <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 12, color: colors.muted, marginBottom: 8 }}>Day</Text>
          <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 20, color: colors.ink, marginBottom: 10 }}>
            {doneCount} of {items.length} done
          </Text>
          <ProgressBar progress={items.length ? doneCount / items.length : 0} />
        </Card>
        <Card style={{ flex: 1 }}>
          <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 12, color: colors.muted, marginBottom: 8 }}>Water</Text>
          <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 20, color: colors.ink, marginBottom: 10 }}>
            {data.water.toFixed(2)}L / {waterTarget}L
          </Text>
          <ProgressBar progress={Math.min(1, data.water / waterTarget)} color={colors.skyStrong} track={colors.sky} />
        </Card>
      </View>

      {!plan.data && <ResourceState resource={plan} />}
      {empty && (
        <Card style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
            {"icon" in empty && <Ionicons name={empty.icon} size={18} color={colors.orange} />}
            <Text style={{ flex: 1, fontFamily: "Outfit_700Bold", fontSize: 16, color: colors.ink }}>{empty.title}</Text>
          </View>
          <Body color={colors.muted} size={14}>{empty.body}</Body>
        </Card>
      )}
      {plan.data?.bands.map((band) => {
        const bandItems = items.filter((i) => i.band === band);
        if (bandItems.length === 0) return null;
        return (
          <View key={band} style={{ marginBottom: 18 }}>
            <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: colors.muted, marginBottom: 10 }}>
              {band}
            </Text>
            <View style={{ gap: 10 }}>
              {bandItems.map((item) => {
                const done = !!data.dayTasksDone[item.id];
                if (item.isSession) {
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => navigation.navigate("Player", { sessionId: item.sessionId! })}
                      style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: 16, padding: 14, gap: 12 }}
                    >
                      <View style={{ width: 50 }}>
                        <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 12, color: colors.muted }}>{item.time}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 15, color: colors.ink }}>{item.title}</Text>
                        <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 12, color: colors.muted, marginTop: 2 }}>
                          {item.subtitle}
                        </Text>
                      </View>
                      <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 12, color: colors.orangeDark }}>
                        Open session →
                      </Text>
                    </Pressable>
                  );
                }
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleDayTask(item.id)}
                    style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: 16, padding: 14, gap: 12 }}
                  >
                    <CheckBadge checked={done} />
                    <View style={{ width: 50 }}>
                      <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 12, color: colors.muted }}>{item.time}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: "Outfit_700Bold",
                          fontSize: 15,
                          color: done ? colors.faint : colors.ink,
                          textDecorationLine: done ? "line-through" : "none",
                        }}
                      >
                        {item.title}
                      </Text>
                      <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 12, color: colors.muted, marginTop: 2 }}>
                        {item.subtitle}
                      </Text>
                      {item.note && (
                        <Text style={{ fontFamily: "Nunito_600SemiBold", fontStyle: "italic", fontSize: 11, color: colors.muted, marginTop: 4 }}>
                          {item.note}
                        </Text>
                      )}
                    </View>
                    {item.macro && (
                      <View style={{ backgroundColor: colors.orangeTint, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10 }}>
                        <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 10, color: colors.orangeDark }}>
                          {item.macro}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}

      {!!plan.data?.guidance?.notes.length && (
        <Card style={{ marginBottom: 14 }}>
          <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 12, color: colors.orangeDark, marginBottom: 6 }}>
            From your care team
          </Text>
          {plan.data.guidance.notes.map((n, i) => (
            <Body key={i} color={colors.ink} size={14} style={{ marginTop: i ? 6 : 0 }}>
              • {n}
            </Body>
          ))}
          {plan.data.guidance.avoid.length > 0 && (
            <Body color={colors.muted} size={13} style={{ marginTop: 10 }}>
              Avoid: {plan.data.guidance.avoid.join(", ")}
            </Body>
          )}
        </Card>
      )}

      {plan.data?.note && (
        <Card bg={colors.sage} style={{ marginBottom: 14 }}>
          <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 12, color: colors.sageInk, marginBottom: 6 }}>
            Note from {plan.data.note.author}
          </Text>
          <Body color={colors.sageInk} size={14}>
            {plan.data.note.text}
          </Body>
        </Card>
      )}

      <Pressable onPress={() => navigation.navigate("Circle")}>
        <Card bg={colors.lilac}>
          <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 13, color: colors.lilacInk, marginBottom: 4 }}>
            August circle
          </Text>
          <Body color={colors.lilacInk} size={14}>
            Your group is 71% through the 20-day movement streak.
          </Body>
        </Card>
      </Pressable>
    </ScreenScaffold>
  );
}
