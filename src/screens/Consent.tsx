import React from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import PillButton from "../components/PillButton";
import { BackButton, Body, Card, Eyebrow, Heading } from "../components/Primitives";
import { PhotoConsent, useAppState } from "../state/AppState";
import { useAuth } from "../state/Auth";
import { RootNav } from "../navigation/types";
import { NAME_MAX_LENGTH } from "../utils/registration";

const terms = [
  "Follow Dr. Kanika’s programme for weight loss, body contouring, pain management, posture correction and lifestyle advice. Skipping parts of it may reduce or remove results.",
  "Keep my programme to myself. It is designed for me alone and may be unsuitable, or even harmful, for anyone else.",
  "Accept that the fee is non-refundable and cannot be readjusted.",
];

const photoOptions: { id: PhotoConsent; label: string }[] = [
  { id: "none", label: "No, don’t use my photos" },
  { id: "faceHidden", label: "Yes, with my face hidden" },
  { id: "faceShown", label: "Yes, my face may show" },
];

function RadioList<T extends string>({ options, value, onChange }: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
      {options.map(({ id, label }) => {
        const active = id === value;
        return (
          <Pressable
            key={id}
            onPress={() => onChange(id)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: active ? colors.orange : colors.hairline,
              backgroundColor: active ? colors.orangeTint : "transparent",
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: active ? colors.orange : colors.faint,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {active && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.orange }} />}
            </View>
            <Body color={colors.ink} style={{ flex: 1 }}>{label}</Body>
          </Pressable>
        );
      })}
    </View>
  );
}

function NameLine() {
  const { user, userError, reloadUser } = useAuth();
  if (user) return <Body color={colors.ink}>I, <Text style={{ fontFamily: "Nunito_700Bold" }}>{user.fullName}</Text>, agree to:</Body>;
  if (userError) {
    return (
      <Body color={colors.coralInk}>
        {userError}{" "}
        <Text onPress={reloadUser} style={{ fontFamily: "Nunito_700Bold", color: colors.orange }}>Try again</Text>
      </Body>
    );
  }
  return <Body color={colors.muted}>Loading your details…</Body>;
}

export default function Consent() {
  const navigation = useNavigation<RootNav>();
  const { data, update } = useAppState();
  const { user } = useAuth();
  const consent = data.consent;

  const setConsent = (patch: Partial<typeof consent>) => update({ consent: { ...consent, ...patch } });

  const sign = () => {
    if (!user) return;
    setConsent({ name: user.fullName, signature: consent.signature.trim() });
    navigation.navigate("Checkout");
  };

  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <ScreenScaffold
      header={<BackButton />}
      footer={
        <PillButton
          label="Sign & continue"
          disabled={!user || consent.signature.trim().length === 0}
          onPress={sign}
        />
      }
    >
      <Eyebrow>Required before any programme</Eyebrow>
      <Heading size={24}>Consent & non-disclosure</Heading>
      <Body style={{ marginTop: 6, marginBottom: 18 }}>Dr. Kanika’s 360° Fitness</Body>

      <Card style={{ marginBottom: 14, gap: 10 }}>
        <NameLine />
        {terms.map((term) => (
          <View key={term} style={{ flexDirection: "row", gap: 10 }}>
            <Body color={colors.orange}>•</Body>
            <Body style={{ flex: 1 }}>{term}</Body>
          </View>
        ))}
      </Card>

      <Card style={{ marginBottom: 14, gap: 12 }}>
        <Body color={colors.ink}>Can we use your progress photos for clinic display and publicity?</Body>
        <RadioList
          options={photoOptions}
          value={consent.photoConsent}
          onChange={(photoConsent) => setConsent({ photoConsent })}
        />
      </Card>

      <Card style={{ gap: 4 }}>
        <Body color={colors.ink}>Type your full name to sign</Body>
        <TextInput
          value={consent.signature}
          // Return finishes signing rather than inserting a line break.
          onChangeText={(t) => setConsent({ signature: t.replace(/[\r\n]+/g, " ") })}
          placeholder="Your full name"
          maxLength={NAME_MAX_LENGTH * 2 + 1}
          autoCapitalize="words"
          autoCorrect={false}
          multiline
          submitBehavior="blurAndSubmit"
          returnKeyType="done"
          placeholderTextColor={colors.faint}
          style={{
            fontFamily: "Outfit_700Bold",
            fontStyle: "italic",
            fontSize: 20,
            color: colors.ink,
            borderBottomWidth: 1.5,
            borderBottomColor: colors.hairline,
            paddingVertical: 8,
          }}
        />
        <Text style={{ fontFamily: "Nunito_600SemiBold", color: colors.muted, fontSize: 12, marginTop: 10 }}>
          Signed {today} · timestamp recorded
        </Text>
      </Card>
    </ScreenScaffold>
  );
}
