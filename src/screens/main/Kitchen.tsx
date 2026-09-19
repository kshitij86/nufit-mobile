import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import ScreenScaffold from "../../components/ScreenScaffold";
import TopBar from "../../components/TopBar";
import { Body, Card } from "../../components/Primitives";
import { recipes } from "../../data/recipes";
import { TabNav } from "../../navigation/types";

const filters = ["All", "Breakfast", "Lunch", "Snack", "Dinner"] as const;

export default function Kitchen() {
  const navigation = useNavigation<TabNav>();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");

  const visible = filter === "All" ? recipes : recipes.filter((r) => r.slot === filter);

  return (
    <ScreenScaffold header={<TopBar title="Kitchen" subtitle="Recipes cleared for your plan" />}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14, marginBottom: 14 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {filters.map((f) => {
            const active = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 999,
                  backgroundColor: active ? colors.orange : colors.card,
                  borderWidth: 1.5,
                  borderColor: active ? colors.orange : colors.hairline,
                }}
              >
                <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 13, color: active ? "#fff" : colors.ink }}>
                  {f}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Card bg={colors.amberTint} style={{ marginBottom: 16 }}>
        <Body color={colors.amberInk} size={13}>
          Cleared for your plan — every recipe below fits today’s macros and your intake preferences.
        </Body>
      </Card>

      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
        {visible.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => navigation.navigate("Recipe", { recipeId: r.id })}
            style={{ width: "48%", marginBottom: 16 }}
          >
            <View style={{ height: 100, borderRadius: 16, backgroundColor: r.tint, marginBottom: 8 }} />
            <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 14, color: colors.ink, marginBottom: 4 }}>
              {r.name}
            </Text>
            <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 12, color: colors.muted, marginBottom: 6 }}>
              {r.kcal} kcal · {r.protein} g protein
            </Text>
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: colors.sage,
                borderRadius: 999,
                paddingVertical: 4,
                paddingHorizontal: 10,
              }}
            >
              <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 11, color: colors.sageInk }}>
                {r.minutes} min
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </ScreenScaffold>
  );
}
