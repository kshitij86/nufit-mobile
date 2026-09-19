import React, { useState } from "react";
import { View, Text, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import { BackButton, Body, Card, Heading } from "../components/Primitives";

const initialToggles = [
  { id: "meals", icon: "restaurant" as const, name: "Meal windows", desc: "15 minutes before each slot", default: true },
  { id: "water", icon: "water" as const, name: "Water", desc: "Every 2 hours, 8 am – 8 pm", default: true },
  { id: "movement", icon: "barbell" as const, name: "Movement", desc: "At your session time", default: true },
  { id: "wind-down", icon: "moon" as const, name: "Wind-down", desc: "10:00 pm, screens off", default: false },
];

export default function Reminders() {
  const [state, setState] = useState<Record<string, boolean>>(
    Object.fromEntries(initialToggles.map((t) => [t.id, t.default]))
  );

  return (
    <ScreenScaffold header={<BackButton />}>
      <Heading size={24}>Nudges</Heading>
      <Body style={{ marginTop: 8, marginBottom: 20 }}>
        Quiet by default. Turn on only what you will actually act on.
      </Body>

      <View style={{ gap: 12, marginBottom: 20 }}>
        {initialToggles.map((t) => (
          <View
            key={t.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              backgroundColor: colors.card,
              borderRadius: 18,
              padding: 14,
            }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.orangeTint, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={t.icon} size={18} color={colors.orangeDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 15, color: colors.ink }}>{t.name}</Text>
              <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 12, color: colors.muted, marginTop: 2 }}>
                {t.desc}
              </Text>
            </View>
            <Switch
              value={state[t.id]}
              onValueChange={(v) => setState((s) => ({ ...s, [t.id]: v }))}
              trackColor={{ false: colors.hairline, true: colors.orange }}
              thumbColor="#fff"
            />
          </View>
        ))}
      </View>

      <Card bg={colors.lilac}>
        <Body color={colors.lilacInk} size={13}>
          Nothing between 10:45 pm and 6:00 am — your wind-down window is protected.
        </Body>
      </Card>
    </ScreenScaffold>
  );
}
