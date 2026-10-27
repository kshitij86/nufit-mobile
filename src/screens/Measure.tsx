import React, { useState } from "react";
import { View, Text, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import PillButton from "../components/PillButton";
import { BackButton, Body, Card } from "../components/Primitives";
import BodySilhouette from "../components/BodySilhouette";
import { measureSites } from "../data/measureSites";
import { useAppState } from "../state/AppState";
import { RootNav } from "../navigation/types";
import { userMessage } from "../services/http";
import {
  parseSiteValue,
  saveMeasurement,
  siteErrorsOf,
  siteValueError,
  SiteValues,
  useMeasurements,
} from "../services/measurements";
import { MeasureSiteId } from "../types";

export default function Measure() {
  const navigation = useNavigation<RootNav>();
  const { data } = useAppState();
  const history = useMeasurements();
  const [siteIndex, setSiteIndex] = useState(0);
  const [values, setValues] = useState<Partial<Record<MeasureSiteId, string>>>({});
  const [siteErrors, setSiteErrors] = useState<Partial<Record<MeasureSiteId, string>>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Set when the server rejected some sites: once they're fixed, Next saves straight away.
  const [rejected, setRejected] = useState(false);
  const site = measureSites[siteIndex];
  const isLast = siteIndex === measureSites.length - 1;
  const isBaseline = history.data?.length === 0;
  const siteError = siteErrors[site.id];
  const nextInvalid = measureSites.findIndex((s, i) => i > siteIndex && siteErrors[s.id]);
  const willSave = nextInvalid < 0 && (isLast || rejected);

  const setValue = (text: string) => {
    setValues((v) => ({ ...v, [site.id]: text }));
    setSiteErrors((e) => ({ ...e, [site.id]: undefined }));
  };

  const save = async () => {
    const sites = Object.fromEntries(measureSites.map((s) => [s.id, parseSiteValue(values[s.id] ?? "")])) as SiteValues;
    setSaving(true);
    setSaveError(null);
    try {
      await saveMeasurement(sites);
    } catch (e) {
      const errors = siteErrorsOf(e);
      const firstInvalid = measureSites.findIndex((s) => errors[s.id]);
      if (firstInvalid >= 0) {
        setSiteErrors(errors);
        setSiteIndex(firstInvalid);
        setRejected(true);
      } else {
        setSaveError(userMessage(e));
      }
      return;
    } finally {
      setSaving(false);
    }
    navigation.navigate("MeasureDone");
  };

  const onNext = () => {
    const error = siteValueError(values[site.id] ?? "");
    if (error) {
      setSiteErrors((e) => ({ ...e, [site.id]: error }));
      return;
    }
    // A site fixed after a failed save goes straight to the next one the server rejected.
    if (nextInvalid >= 0) setSiteIndex(nextInvalid);
    else if (willSave) void save();
    else setSiteIndex(siteIndex + 1);
  };

  const onBack = () => {
    if (saving) return;
    if (siteIndex === 0) navigation.goBack();
    else setSiteIndex(siteIndex - 1);
  };

  return (
    <ScreenScaffold
      header={
        <View style={{ gap: 14 }}>
          <BackButton onPress={onBack} />
          <View style={{ flexDirection: "row", gap: 6 }}>
            {measureSites.map((s, i) => (
              <View
                key={s.id}
                style={{
                  flex: i === siteIndex ? 2 : 1,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === siteIndex ? colors.orange : i < siteIndex ? colors.amber : colors.hairline,
                }}
              />
            ))}
          </View>
        </View>
      }
      footer={
        <>
          {saveError && (
            <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
              <Ionicons name="alert-circle" size={18} color={colors.coralInk} style={{ marginTop: 2 }} />
              <Body color={colors.coralInk} size={14} style={{ flex: 1 }}>
                {saveError} Your numbers are kept.
              </Body>
            </View>
          )}
          <PillButton
            label={!willSave ? "Next site" : saveError ? "Try again" : isBaseline ? "Save baseline" : "Save measurements"}
            onPress={onNext}
            disabled={!values[site.id]?.trim()}
            loading={saving}
          />
        </>
      }
    >
      <Card style={{ backgroundColor: colors.card, alignItems: "center", paddingVertical: 20, marginBottom: 20 }}>
        <BodySilhouette region={site.region} gender={data.gender ?? "female"} />
      </Card>

      <Text style={{ fontFamily: "Nunito_800ExtraBold", color: colors.orange, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
        Site {siteIndex + 1} of {measureSites.length}
      </Text>
      <Text style={{ fontFamily: "Outfit_700Bold", color: colors.ink, fontSize: 22, marginBottom: 10 }}>
        {site.name}
      </Text>
      <Body color={colors.ink} size={15} style={{ fontFamily: "Nunito_700Bold" } as any}>
        {site.cue}
      </Body>
      <Body style={{ marginTop: 8, marginBottom: 20 }}>{site.detail}</Body>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.card,
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: siteError ? colors.coralInk : colors.hairline,
          paddingHorizontal: 16,
        }}
      >
        <TextInput
          value={values[site.id] ?? ""}
          onChangeText={setValue}
          editable={!saving}
          keyboardType="decimal-pad"
          placeholder="0.0"
          placeholderTextColor={colors.faint}
          style={{ flex: 1, paddingVertical: 16, fontFamily: "Outfit_700Bold", fontSize: 20, color: colors.ink }}
        />
        <Text style={{ fontFamily: "Nunito_700Bold", color: colors.secondary, fontSize: 14 }}>inches</Text>
      </View>
      {siteError ? (
        <Text style={{ fontFamily: "Nunito_600SemiBold", color: colors.coralInk, fontSize: 12, marginTop: 8 }}>
          {siteError}
        </Text>
      ) : (
        <Text style={{ fontFamily: "Nunito_600SemiBold", color: colors.muted, fontSize: 12, marginTop: 8, textAlign: "right" }}>
          Tape snug, not compressing
        </Text>
      )}
    </ScreenScaffold>
  );
}
