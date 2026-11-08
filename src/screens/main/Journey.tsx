import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import ScreenScaffold from "../../components/ScreenScaffold";
import TopBar from "../../components/TopBar";
import PillButton from "../../components/PillButton";
import ResourceState from "../../components/ResourceState";
import { Body, Card, Divider, StatChip } from "../../components/Primitives";
import WeightChart from "../../components/WeightChart";
import { measureSites } from "../../data/measureSites";
import { useAdherence, useLatestReview } from "../../services/journey";
import { Measurement, useMeasurements } from "../../services/measurements";
import { TabNav } from "../../navigation/types";
import { formatDay, formatSignedChange } from "../../utils/format";

const adherenceColor = { full: colors.sageStrong, partial: colors.amberStrong, missed: colors.hairline };

const sumOfSites = (m: Measurement) => measureSites.reduce((total, site) => total + m.sites[site.id], 0);

export default function Journey() {
  const navigation = useNavigation<TabNav>();
  const measurements = useMeasurements();
  const adherence = useAdherence().data;
  const review = useLatestReview().data;

  // Newest first from the API; the baseline is the oldest entry.
  const history = measurements.data ?? [];
  const latest = history[0];
  const baseline = history[history.length - 1];
  const hasProgress = history.length > 1;
  const weighIns = history.filter((m) => m.weightKg !== null).reverse();
  const weights = weighIns.map((m) => m.weightKg as number);
  const weightChange = weights.length > 1 ? weights[weights.length - 1] - weights[0] : null;
  const inchesChange = hasProgress ? sumOfSites(latest) - sumOfSites(baseline) : null;

  const logMeasurements = (
    <PillButton
      label={history.length === 0 ? "Log your first measurements" : "Log this fortnight's measurements"}
      variant="secondary"
      glow={false}
      onPress={() => navigation.navigate("Measure")}
    />
  );

  return (
    <ScreenScaffold header={<TopBar title="Journey" subtitle={review?.weekLabel ?? "Your progress"} />}>
      {review && (
        <Card style={{ marginTop: 14, marginBottom: 16 }}>
          <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: colors.orange, marginBottom: 10 }}>
            {review.weekLabel}
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
            <StatChip value={weightChange === null ? "—" : `${formatSignedChange(weightChange)} kg`} label="since start" />
            <StatChip value={inchesChange === null ? "—" : `${formatSignedChange(inchesChange)} in`} label="inches" />
            {adherence && <StatChip value={`${adherence.daysOnPlanThisWeek}/7`} label="days on plan" />}
          </View>
          <Body color={colors.ink} size={14} style={{ fontStyle: "italic" }}>
            “{review.quote}”
          </Body>
          <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 12, color: colors.muted, marginTop: 8 }}>
            — {review.author}, reviewed {review.reviewedOn}
          </Text>
        </Card>
      )}

      <Card style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
          <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 15, color: colors.ink }}>Weight trend</Text>
          {weightChange !== null && (
            <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 14, color: colors.orangeDark }}>
              {formatSignedChange(weightChange)} kg
            </Text>
          )}
        </View>
        {!measurements.data ? (
          <ResourceState resource={measurements} />
        ) : weights.length < 2 ? (
          <Body size={14}>Your weight trend appears here once you have two weigh-ins.</Body>
        ) : (
          <>
            <WeightChart values={weights} width={320} height={110} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
              <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 11, color: colors.muted }}>
                {formatDay(weighIns[0].createdOn)} · {weights[0]} kg
              </Text>
              <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 11, color: colors.muted }}>
                {formatDay(weighIns[weighIns.length - 1].createdOn)} · {weights[weights.length - 1]} kg
              </Text>
            </View>
          </>
        )}
      </Card>

      {adherence && (
        <>
          <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: colors.muted, marginBottom: 10 }}>
            Last 14 days
          </Text>
          <View style={{ flexDirection: "row", gap: 4, marginBottom: 20 }}>
            {adherence.last14.map((state, i) => (
              <View key={i} style={{ flex: 1, alignItems: "center", gap: 4 }}>
                <View style={{ width: "100%", height: 28, borderRadius: 6, backgroundColor: adherenceColor[state] }} />
                <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 9, color: colors.muted }}>{i + 1}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Card style={{ marginBottom: 16 }}>
        <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 15, color: colors.ink, marginBottom: 12 }}>
          {hasProgress ? `Inches · ${formatDay(baseline.createdOn)} vs ${formatDay(latest.createdOn)}` : "Inches"}
        </Text>
        {!measurements.data ? (
          <ResourceState resource={measurements} />
        ) : !latest ? (
          <Body size={14}>No measurements yet. Log your six sites to set your baseline.</Body>
        ) : (
          measureSites.map((site, i) => {
            const today = latest.sites[site.id];
            const start = baseline.sites[site.id];
            return (
              <View key={site.id}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 }}>
                  <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 14, color: colors.ink, flex: 1 }}>{site.name}</Text>
                  <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 13, color: colors.muted }}>
                    {hasProgress ? `${start.toFixed(1)} → ${today.toFixed(1)}` : today.toFixed(1)}
                  </Text>
                  {hasProgress && (
                    <Text
                      style={{
                        fontFamily: "Nunito_800ExtraBold",
                        fontSize: 13,
                        color: today <= start ? colors.sageStrong : colors.coralInk,
                        marginLeft: 10,
                        width: 46,
                        textAlign: "right",
                      }}
                    >
                      {formatSignedChange(today - start)}
                    </Text>
                  )}
                </View>
                {i < measureSites.length - 1 && <Divider />}
              </View>
            );
          })
        )}
        {measurements.data && measurements.error && (
          <Body color={colors.coralInk} size={13} style={{ marginTop: 8 }}>{measurements.error}</Body>
        )}
        <View style={{ marginTop: 14 }}>{logMeasurements}</View>
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
