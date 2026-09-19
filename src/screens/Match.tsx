import React, { useEffect, useState } from "react";
import { View, Text, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import PillButton, { TextButton } from "../components/PillButton";
import { Body, Card, CheckBadge, Heading, StatChip } from "../components/Primitives";
import { programmeById } from "../data/programmes";
import { useAppState } from "../state/AppState";
import { RootNav } from "../navigation/types";

export default function Match() {
  const navigation = useNavigation<RootNav>();
  const { data } = useAppState();
  const programme = programmeById(data.programmeId);
  const [scale] = useState(() => new Animated.Value(0.7));

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.07, duration: 220, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]).start();
  }, [scale]);

  return (
    <ScreenScaffold
      footer={
        <>
          <PillButton
            label={`Continue with ${programme.name}`}
            onPress={() => navigation.navigate("Consent")}
          />
          <TextButton label="See all six programmes" onPress={() => navigation.navigate("Plans")} />
        </>
      }
    >
      <Animated.View
        style={{
          alignSelf: "center",
          transform: [{ scale }],
          marginTop: 16,
          marginBottom: 12,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.orange,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="checkmark" size={30} color="#fff" />
      </Animated.View>

      <Heading size={24}>Based on your answers, start here.</Heading>
      <Body style={{ marginTop: 10, marginBottom: 20 }}>
        Dr. Kanika will still rewrite the detail after reading your intake — this is the track it starts
        from.
      </Body>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <View style={{ height: 150, backgroundColor: programme.tintBg, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: programme.tintInk, fontFamily: "Nunito_800ExtraBold", fontSize: 11, letterSpacing: 1 }}>
            ILLUSTRATION — {programme.artLabel}
          </Text>
        </View>
        <View style={{ padding: 18 }}>
          <Text style={{ color: programme.tintInk, fontFamily: "Nunito_800ExtraBold", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
            {programme.category}
          </Text>
          <Text style={{ color: colors.ink, fontFamily: "Outfit_700Bold", fontSize: 22, marginBottom: 8 }}>
            {programme.name}
          </Text>
          <Body style={{ marginBottom: 16 }}>{programme.blurb}</Body>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {programme.stats.map(([value, label]) => (
              <StatChip key={label} value={value} label={label} tint={programme.tintBg} ink={programme.tintInk} />
            ))}
          </View>
        </View>
      </Card>

      <View style={{ marginTop: 20, gap: 12 }}>
        {programme.includes.map((item) => (
          <View key={item} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <CheckBadge />
            <Body color={colors.ink} style={{ flex: 1 }}>
              {item}
            </Body>
          </View>
        ))}
      </View>
    </ScreenScaffold>
  );
}
