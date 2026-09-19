import React from "react";
import { View, Text } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import PillButton from "../components/PillButton";
import { BackButton, Body, StatChip } from "../components/Primitives";
import { recipeById } from "../data/recipes";
import { RootStackParamList, RootNav } from "../navigation/types";
import { useAppState } from "../state/AppState";

export default function Recipe() {
  const navigation = useNavigation<RootNav>();
  const route = useRoute<RouteProp<RootStackParamList, "Recipe">>();
  const recipe = recipeById(route.params.recipeId);
  const { toast } = useAppState();

  if (!recipe) return null;

  return (
    <ScreenScaffold
      footer={
        <>
          <PillButton
            label={`Swap into today's ${recipe.slot}`}
            onPress={() => {
              toast.show("Swap sent for approval");
              navigation.navigate("MainTabs");
            }}
          />
          <Body size={12} style={{ textAlign: "center" }}>
            Swaps are approved by the nutrition team within one working day.
          </Body>
        </>
      }
      contentStyle={{ paddingTop: 0 }}
    >
      <View>
        <View style={{ height: 200, backgroundColor: recipe.tint, marginHorizontal: -20, alignItems: "center", justifyContent: "center" }}>
          <View style={{ position: "absolute", top: 16, left: 20 }}>
            <BackButton onPress={() => navigation.goBack()} />
          </View>
          <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 11, letterSpacing: 1, color: recipe.ink }}>
            PHOTO — {recipe.name.toUpperCase()}
          </Text>
        </View>

        <View style={{ paddingTop: 20 }}>
          <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: colors.orange, marginBottom: 6 }}>
            {recipe.slot}
          </Text>
          <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 24, color: colors.ink, marginBottom: 14 }}>
            {recipe.name}
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 22 }}>
            <StatChip value={`${recipe.kcal}`} label="kcal" />
            <StatChip value={`${recipe.protein}g`} label="protein" />
            <StatChip value={`${recipe.minutes}`} label="minutes" />
          </View>

          <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 17, color: colors.ink, marginBottom: 10 }}>
            Ingredients
          </Text>
          <View style={{ gap: 8, marginBottom: 22 }}>
            {recipe.ingredients.map(([name, qty]) => (
              <View key={name} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Body color={colors.ink} size={14} style={{ flex: 1 }}>{name}</Body>
                <Body size={14}>{qty}</Body>
              </View>
            ))}
          </View>

          <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 17, color: colors.ink, marginBottom: 12 }}>
            Method
          </Text>
          <View style={{ gap: 14 }}>
            {recipe.method.map((step, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.orangeTint, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 12, color: colors.orangeDark }}>{i + 1}</Text>
                </View>
                <Body color={colors.ink} size={14} style={{ flex: 1 }}>{step}</Body>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScreenScaffold>
  );
}
