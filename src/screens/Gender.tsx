import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import PillButton from "../components/PillButton";
import { BackButton, Body, Eyebrow, Heading } from "../components/Primitives";
import { useAppState } from "../state/AppState";
import { RootNav } from "../navigation/types";

const options = [
  {
    id: "female" as const,
    label: "Female",
    sub: "Hip-dominant landmarks",
    tint: "#FBEBE9",
    dot: colors.coralInk,
  },
  {
    id: "male" as const,
    label: "Male",
    sub: "Chest-dominant landmarks",
    tint: "#E6EEFC",
    dot: colors.skyStrong,
  },
];

export default function Gender() {
  const navigation = useNavigation<RootNav>();
  const { data, update } = useAppState();

  return (
    <ScreenScaffold
      header={<BackButton />}
      footer={
        <PillButton
          label="Start measuring"
          disabled={!data.gender}
          onPress={() => navigation.navigate("Measure")}
        />
      }
    >
      <Eyebrow>Last thing before measuring</Eyebrow>
      <Heading size={24}>Which body model should the guide use?</Heading>
      <Body style={{ marginTop: 10, marginBottom: 20 }}>
        This only changes the figure and landmark widths drawn in the measurement guide. Your programme is
        written from your intake, not from this.
      </Body>

      <View style={{ gap: 12, marginBottom: 20 }}>
        {options.map((opt) => {
          const selected = data.gender === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => update({ gender: opt.id })}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                padding: 14,
                borderRadius: 18,
                borderWidth: 1.5,
                borderColor: selected ? colors.orange : colors.hairline,
                backgroundColor: colors.card,
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: opt.tint,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="body" size={24} color={opt.dot} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 17, color: colors.ink }}>{opt.label}</Text>
                <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 13, color: colors.muted, marginTop: 2 }}>
                  {opt.sub}
                </Text>
              </View>
              {selected && (
                <Ionicons name="checkmark-circle" size={22} color={colors.orange} />
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={{ backgroundColor: colors.amberTint, borderRadius: 16, padding: 16 }}>
        <Body color={colors.amberInk} size={13}>
          Pregnant or postpartum? Use the female model — Dr. Kanika adds the trimester-specific sites at your
          first review.
        </Body>
      </View>
    </ScreenScaffold>
  );
}
