import React, { useState } from "react";
import { View, Text, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import PillButton from "../components/PillButton";
import { BackButton, Body, Card } from "../components/Primitives";
import BodySilhouette from "../components/BodySilhouette";
import { measureSites } from "../data/measureSites";
import { useAppState } from "../state/AppState";
import { RootNav } from "../navigation/types";

export default function Measure() {
  const navigation = useNavigation<RootNav>();
  const { data, update } = useAppState();
  const [siteIndex, setSiteIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const site = measureSites[siteIndex];
  const isLast = siteIndex === measureSites.length - 1;

  const onNext = () => {
    if (isLast) {
      const parsed: Record<string, number> = {};
      measureSites.forEach((s) => {
        const v = parseFloat(values[s.id]);
        if (!isNaN(v)) parsed[s.id] = v;
      });
      update({ measurements: parsed });
      navigation.navigate("MeasureDone");
    } else {
      setSiteIndex(siteIndex + 1);
    }
  };

  const onBack = () => {
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
        <PillButton
          label={isLast ? "Save baseline" : "Next site"}
          onPress={onNext}
          disabled={!values[site.id]}
        />
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
          borderColor: colors.hairline,
          paddingHorizontal: 16,
        }}
      >
        <TextInput
          value={values[site.id] ?? ""}
          onChangeText={(t) => setValues((v) => ({ ...v, [site.id]: t }))}
          keyboardType="decimal-pad"
          placeholder="0.0"
          placeholderTextColor={colors.faint}
          style={{ flex: 1, paddingVertical: 16, fontFamily: "Outfit_700Bold", fontSize: 20, color: colors.ink }}
        />
        <Text style={{ fontFamily: "Nunito_700Bold", color: colors.secondary, fontSize: 14 }}>inches</Text>
      </View>
      <Text style={{ fontFamily: "Nunito_600SemiBold", color: colors.muted, fontSize: 12, marginTop: 8, textAlign: "right" }}>
        Tape snug, not compressing
      </Text>
    </ScreenScaffold>
  );
}
