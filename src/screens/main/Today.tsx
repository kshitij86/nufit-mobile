import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import ScreenScaffold from "../../components/ScreenScaffold";
import TopBar from "../../components/TopBar";
import { Body, Card, CheckBadge, ProgressBar } from "../../components/Primitives";
import ResourceState from "../../components/ResourceState";
import { useTodayPlan } from "../../services/diet";
import { useProgrammeStatus } from "../../services/journey";
import { moodById } from "../../data/moods";
import { useAppState } from "../../state/AppState";
import { TabNav } from "../../navigation/types";

export default function Today() {
  const navigation = useNavigation<TabNav>();
  const { data, toggleDayTask } = useAppState();
  const mood = moodById(data.mood);
  const plan = useTodayPlan(data.mood);
  const status = useProgrammeStatus().data;
  const items = plan.data?.items ?? [];
  const doneCount = items.filter((i) => data.dayTasksDone[i.id]).length;

  return (
    <ScreenScaffold header={<TopBar title="Today" subtitle={status ? `${status.weekday} · Day ${status.day}` : ""} />}>
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
            {data.water.toFixed(2)}L / 4L
          </Text>
          <ProgressBar progress={data.water / 4} color={colors.skyStrong} track={colors.sky} />
        </Card>
      </View>

      {!plan.data && <ResourceState resource={plan} />}
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
