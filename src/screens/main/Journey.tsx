import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import ScreenScaffold from "../../components/ScreenScaffold";
import TopBar from "../../components/TopBar";
import PillButton from "../../components/PillButton";
import { Body, Card, Divider, StatChip } from "../../components/Primitives";
import WeightChart from "../../components/WeightChart";
import { adherence14, inchesTable, weeklyWeights } from "../../data/journey";
import { TabNav } from "../../navigation/types";

const adherenceColor = { full: colors.sageStrong, partial: colors.amberStrong, missed: colors.hairline };

export default function Journey() {
  const navigation = useNavigation<TabNav>();
  const change = weeklyWeights[weeklyWeights.length - 1] - weeklyWeights[0];

  return (
    <ScreenScaffold header={<TopBar title="Journey" subtitle="Week 4 review" />}>
      <Card style={{ marginTop: 14, marginBottom: 16 }}>
        <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: colors.orange, marginBottom: 10 }}>
          Week 4 review
        </Text>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          <StatChip value="−0.9 kg" label="this week" />
          <StatChip value="−4.1 cm" label="inches" />
          <StatChip value="6/7" label="days on plan" />
        </View>
        <Body color={colors.ink} size={14} style={{ fontStyle: "italic" }}>
          “Inches are moving faster than the scale — that is fat loss with muscle retained. Nothing changes in
          week 5 except the evening snack.”
        </Body>
        <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 12, color: colors.muted, marginTop: 8 }}>
          — Dr. Kanika, reviewed 25 Aug
        </Text>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
          <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 15, color: colors.ink }}>Weight trend</Text>
          <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 14, color: colors.orangeDark }}>
            {change.toFixed(1)} kg
          </Text>
        </View>
        <WeightChart values={weeklyWeights} width={320} height={110} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
          <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 11, color: colors.muted }}>
            W1 · {weeklyWeights[0]} kg
          </Text>
          <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 11, color: colors.muted }}>
            W4 · {weeklyWeights[weeklyWeights.length - 1]} kg
          </Text>
        </View>
      </Card>

      <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: colors.muted, marginBottom: 10 }}>
        Last 14 days
      </Text>
      <View style={{ flexDirection: "row", gap: 4, marginBottom: 20 }}>
        {adherence14.map((state, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center", gap: 4 }}>
            <View style={{ width: "100%", height: 28, borderRadius: 6, backgroundColor: adherenceColor[state] }} />
            <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 9, color: colors.muted }}>{i + 1}</Text>
          </View>
        ))}
      </View>

      <Card style={{ marginBottom: 16 }}>
        <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 15, color: colors.ink, marginBottom: 12 }}>
          Inches · baseline vs today
        </Text>
        {inchesTable.map((row, i) => (
          <View key={row.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 }}>
              <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 14, color: colors.ink, flex: 1 }}>{row.label}</Text>
              <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 13, color: colors.muted }}>
                {row.baseline.toFixed(1)} → {row.today.toFixed(1)}
              </Text>
              <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 13, color: colors.sageStrong, marginLeft: 10, width: 46, textAlign: "right" }}>
                −{(row.baseline - row.today).toFixed(1)}
              </Text>
            </View>
            {i < inchesTable.length - 1 && <Divider />}
          </View>
        ))}
        <View style={{ marginTop: 14 }}>
          <PillButton
            label="Log this fortnight's measurements"
            variant="secondary"
            glow={false}
            onPress={() => navigation.navigate("Measure")}
          />
        </View>
      </Card>

      <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: colors.muted, marginBottom: 10 }}>
        Photo milestones
      </Text>
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
        {["Day 1", "Day 26"].map((label) => (
          <View key={label} style={{ flex: 1, aspectRatio: 1, borderRadius: 16, backgroundColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 12, color: colors.muted }}>{label}</Text>
          </View>
        ))}
        <View
          style={{
            flex: 1,
            aspectRatio: 1,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: colors.faint,
            borderStyle: "dashed",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 12, color: colors.muted, textAlign: "center" }}>
            + Day 30
          </Text>
        </View>
      </View>

      <Pressable onPress={() => navigation.navigate("Milestones")}>
        <Card bg={colors.amberTint}>
          <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 13, color: colors.amberInk, marginBottom: 4 }}>
            Milestones →
          </Text>
          <Body color={colors.amberInk} size={13}>
            Five markers reached so far. See what’s next.
          </Body>
        </Card>
      </Pressable>
    </ScreenScaffold>
  );
}
