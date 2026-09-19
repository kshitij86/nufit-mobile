import React, { useEffect, useState } from "react";
import { View, Text, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import PillButton from "../components/PillButton";
import { Body, Card, Divider, Heading } from "../components/Primitives";
import { measureSites } from "../data/measureSites";
import { useAppState } from "../state/AppState";
import { RootNav } from "../navigation/types";

export default function MeasureDone() {
  const navigation = useNavigation<RootNav>();
  const { data } = useAppState();
  const [scale] = useState(() => new Animated.Value(0.7));

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.07, duration: 220, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]).start();
  }, [scale]);

  return (
    <ScreenScaffold
      footer={<PillButton label="Open my day" onPress={() => navigation.navigate("Mood")} />}
    >
      <Animated.View
        style={{
          alignSelf: "center",
          marginTop: 30,
          marginBottom: 16,
          transform: [{ scale }],
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.sageStrong,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="checkmark" size={32} color="#fff" />
      </Animated.View>

      <Heading size={24}>Baseline saved</Heading>
      <Body style={{ marginTop: 10, marginBottom: 20 }}>
        These six numbers are what your fortnightly review is measured against. Re-measure at the same time
        of day, on the same day of the week.
      </Body>

      <Card>
        {measureSites.map((site, i) => (
          <View key={site.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 }}>
              <Text style={{ fontFamily: "Nunito_700Bold", color: colors.ink, fontSize: 15 }}>{site.name}</Text>
              <Text style={{ fontFamily: "Outfit_700Bold", color: colors.orangeDark, fontSize: 15 }}>
                {data.measurements[site.id] ?? "—"} in
              </Text>
            </View>
            {i < measureSites.length - 1 && <Divider />}
          </View>
        ))}
      </Card>
    </ScreenScaffold>
  );
}
