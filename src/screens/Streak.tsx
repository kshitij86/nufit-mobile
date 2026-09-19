import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import PillButton from "../components/PillButton";
import { useAppState } from "../state/AppState";
import { streakWeek } from "../data/journey";
import { RootNav } from "../navigation/types";

const dotColor = { full: colors.orange, partial: colors.amberStrong, missed: colors.hairline };

export default function Streak() {
  const navigation = useNavigation<RootNav>();
  const { data } = useAppState();
  const [pulse] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 2800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.92, duration: 2800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.orangeTint }}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 24 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.6)", alignItems: "center", justifyContent: "center", marginTop: 8 }}
        >
          <Ionicons name="close" size={22} color={colors.ink} />
        </Pressable>

        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Animated.View
            style={{
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundColor: colors.orange,
              alignItems: "center",
              justifyContent: "center",
              transform: [{ scale: pulse }],
              marginBottom: 26,
            }}
          >
            <Text style={{ fontFamily: "Outfit_800ExtraBold", fontSize: 56, color: "#fff" }}>{data.streak}</Text>
            <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 14, color: "#fff" }}>steady days</Text>
          </Animated.View>

          <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 24, color: colors.ink, textAlign: "center", marginBottom: 12 }}>
            Twenty-six days of showing up.
          </Text>
          <Text style={{ fontFamily: "Nunito_400Regular", fontSize: 15, color: colors.secondary, textAlign: "center", lineHeight: 22, marginBottom: 22 }}>
            Not perfect days — steady ones. You have missed four, and none of them back to back. That is
            exactly what makes results hold.
          </Text>

          <View style={{ flexDirection: "row", gap: 8 }}>
            {streakWeek.map((s, i) => (
              <View key={i} style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: dotColor[s] }} />
            ))}
          </View>
        </View>

        <View style={{ paddingBottom: 20 }}>
          <PillButton label="Back to today" onPress={() => navigation.navigate("MainTabs")} />
        </View>
      </SafeAreaView>
    </View>
  );
}
