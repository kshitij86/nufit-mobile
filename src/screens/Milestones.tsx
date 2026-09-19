import React from "react";
import { View, Text } from "react-native";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import { BackButton, Body, CheckBadge, Heading } from "../components/Primitives";
import { milestones } from "../data/milestones";

export default function Milestones() {
  return (
    <ScreenScaffold header={<BackButton />}>
      <Heading size={24}>Milestones</Heading>
      <Body style={{ marginTop: 8, marginBottom: 20 }}>
        No points, no badges to chase. Just the markers that mean something clinically.
      </Body>

      <View style={{ gap: 12 }}>
        {milestones.map((m) => (
          <View
            key={m.title}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              padding: 16,
              borderRadius: 18,
              backgroundColor: m.reached ? colors.card : "transparent",
              opacity: m.reached ? 1 : 0.55,
            }}
          >
            {m.reached ? (
              <CheckBadge />
            ) : (
              <View style={{ width: 20, height: 20, alignItems: "center", justifyContent: "center" }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.faint }} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 15, color: colors.ink }}>{m.title}</Text>
              <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 12, color: colors.muted, marginTop: 3 }}>
                {m.detail}
              </Text>
            </View>
            <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 12, color: colors.muted }}>{m.date}</Text>
          </View>
        ))}
      </View>
    </ScreenScaffold>
  );
}
