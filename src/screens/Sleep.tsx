import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import PillButton from "../components/PillButton";
import { BackButton, Body, Card, CheckBadge, Heading } from "../components/Primitives";
import { sleepDays, sleepWeek } from "../data/journey";
import { useAppState } from "../state/AppState";
import { RootNav } from "../navigation/types";

const routine = [
  { id: "screens", title: "Screens off", detail: "Phone charges outside the bedroom", time: "10:00 pm" },
  { id: "milk", title: "Turmeric milk", detail: "150 ml toned milk, no sugar", time: "10:15 pm" },
  { id: "breath", title: "Six-minute breath", detail: "Inhale 4, hold 4, exhale 6", time: "10:30 pm" },
  { id: "lights", title: "Lights out", detail: "Room cool and fully dark", time: "10:45 pm" },
];

const lavender = "#F4F1FF";

export default function Sleep() {
  const navigation = useNavigation<RootNav>();
  const { data, toggleSleepStep } = useAppState();
  const maxBar = Math.max(...sleepWeek);

  return (
    <ScreenScaffold
      bg={lavender}
      header={<BackButton />}
      footer={
        <PillButton
          label="Start 6-minute breath"
          onPress={() => navigation.navigate("Player", { sessionId: "breath" })}
        />
      }
    >
      <Heading size={26}>Wind-down</Heading>
      <Body style={{ marginTop: 10, marginBottom: 20 }}>
        Your metabolism is rebuilt while you sleep. This is part of the programme, not a bonus.
      </Body>

      <Card style={{ marginBottom: 20 }}>
        <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 17, color: colors.ink, marginBottom: 2 }}>
          Tonight’s target
        </Text>
        <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 22, color: colors.lilacInk, marginTop: 6 }}>
          10:45 pm → 6:15 am
        </Text>
        <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: 18 }}>
          7 h 30 m · lights out, phone outside the room
        </Text>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, height: 70 }}>
          {sleepWeek.map((v, i) => (
            <View key={i} style={{ flex: 1, alignItems: "center", gap: 6 }}>
              <View
                style={{
                  width: "100%",
                  height: (v / maxBar) * 56,
                  borderRadius: 6,
                  backgroundColor: colors.lilacStrong,
                }}
              />
              <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 10, color: colors.muted }}>
                {sleepDays[i]}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: colors.muted, marginBottom: 10 }}>
        Tonight’s routine
      </Text>
      <View style={{ gap: 10 }}>
        {routine.map((step) => {
          const done = !!data.sleepChecklist[step.id];
          return (
            <Pressable
              key={step.id}
              onPress={() => toggleSleepStep(step.id)}
              style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: 16, padding: 14, gap: 12 }}
            >
              <CheckBadge checked={done} bg={colors.lilacStrong} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: "Outfit_700Bold",
                    fontSize: 15,
                    color: done ? colors.faint : colors.ink,
                    textDecorationLine: done ? "line-through" : "none",
                  }}
                >
                  {step.title}
                </Text>
                <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 12, color: colors.muted, marginTop: 2 }}>
                  {step.detail}
                </Text>
              </View>
              <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 12, color: colors.muted }}>{step.time}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScreenScaffold>
  );
}
