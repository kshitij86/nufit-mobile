import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import { BackButton, Body, Card, ProgressBar } from "../components/Primitives";
import { programmeById } from "../data/programmes";
import { useAppState } from "../state/AppState";
import { useAuth } from "../state/Auth";
import { RootNav } from "../navigation/types";

export default function Profile() {
  const navigation = useNavigation<RootNav>();
  const { data } = useAppState();
  const { signOut } = useAuth();
  const programme = programmeById(data.programmeId);
  const initials = data.profileName.split(" ").map((n) => n[0]).join("").slice(0, 2);

  const links: { label: string; meta: string; screen: keyof import("../navigation/types").RootStackParamList }[] = [
    { label: "Intake answers", meta: "14 of 14", screen: "Intake" },
    { label: "Measurements", meta: "6 sites", screen: "Measure" },
    { label: "Consent & documents", meta: "Signed", screen: "Consent" },
    { label: "Nudges", meta: "3 on", screen: "Reminders" },
    { label: "Your circle", meta: "8 members", screen: "Circle" },
  ];

  return (
    <ScreenScaffold header={<BackButton />}>
      <View style={{ alignItems: "center", marginTop: 6, marginBottom: 20 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <Text style={{ color: "#fff", fontFamily: "Outfit_700Bold", fontSize: 22 }}>{initials}</Text>
        </View>
        <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 20, color: colors.ink }}>{data.profileName}</Text>
        <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 13, color: colors.muted, marginTop: 2 }}>
          {programme.name} · day 26
        </Text>
      </View>

      <Card bg={colors.amberTint} style={{ marginBottom: 20 }}>
        <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 12, color: colors.amberInk, marginBottom: 10 }}>
          Programme
        </Text>
        <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 15, color: colors.ink, marginBottom: 10 }}>
          Next review 28 Aug
        </Text>
        <ProgressBar progress={0.31} color={colors.amberStrong} track="#FFFFFF" />
        <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 12, color: colors.amberInk, marginTop: 8 }}>
          Day 26 of 84
        </Text>
      </Card>

      <View style={{ gap: 4 }}>
        {links.map((link) => (
          <Pressable
            key={link.label}
            onPress={() => navigation.navigate(link.screen as any)}
            style={{ flexDirection: "row", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.hairline }}
          >
            <Body color={colors.ink} size={15} style={{ flex: 1 }}>{link.label}</Body>
            <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 13, color: colors.muted, marginRight: 8 }}>
              {link.meta}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.faint} />
          </Pressable>
        ))}
        <Pressable
          onPress={signOut}
          style={{ paddingVertical: 18 }}
        >
          <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 15, color: colors.orange }}>Sign out</Text>
        </Pressable>
      </View>
    </ScreenScaffold>
  );
}
