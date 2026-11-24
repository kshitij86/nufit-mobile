import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import { AccountHeader } from "../components/AccountButton";
import PillButton from "../components/PillButton";
import { Body, Card, Eyebrow, Heading } from "../components/Primitives";
import ResourceState from "../components/ResourceState";
import { useAppState } from "../state/AppState";
import { useAuth } from "../state/Auth";
import { Consent as SignedConsent, PhotoConsent, signConsent, useQuestionnaire } from "../services/questionnaire";
import { userMessage } from "../services/http";
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
              borderColor: active ? colors.rose : colors.hairline,
              backgroundColor: active ? colors.blushTint : "transparent",
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: active ? colors.rose : colors.faint,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {active && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.rose }} />}
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
        <Text onPress={reloadUser} style={{ fontFamily: "Nunito_700Bold", color: colors.roseText }}>Try again</Text>
      </Body>
    );
  }
  return <Body color={colors.muted}>Loading your details…</Body>;
}

/**
 * Signed after paying, before the questionnaire. Members who've already sent the questionnaire
 * open it from Profile to see or change what they signed.
 */
export default function Consent() {
  const questionnaire = useQuestionnaire();
  if (!questionnaire.data) {
    return (
      <ScreenScaffold header={<AccountHeader />}>
        <ResourceState resource={questionnaire} minHeight={300} />
      </ScreenScaffold>
    );
  }
  return <ConsentForm signed={questionnaire.data.consent} questionnaireSent={!!questionnaire.data.submittedAt} />;
}

const formatDay = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

function ConsentForm({ signed, questionnaireSent }: { signed: SignedConsent | null; questionnaireSent: boolean }) {
  const navigation = useNavigation<RootNav>();
  const { toast } = useAppState();
  const { user } = useAuth();
  const [signature, setSignature] = useState(signed?.signature ?? "");
  const [photoConsent, setPhotoConsent] = useState<PhotoConsent>(signed?.photoConsent ?? "faceHidden");
  const [busy, setBusy] = useState(false);

  const sign = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      await signConsent(signature.trim(), photoConsent);
    } catch (e) {
      toast.show(userMessage(e));
      setBusy(false);
      return;
    }
    if (questionnaireSent) {
      toast.show("Your consent is updated");
      navigation.goBack();
    } else {
      // Straight on to the questionnaire, with nothing behind it: the consent is done.
      navigation.reset({ index: 0, routes: [{ name: "Questionnaire" }] });
    }
  };

  const signedOn = signed ? formatDay(new Date(signed.signedAt)) : formatDay(new Date());

  return (
    <ScreenScaffold
      header={<AccountHeader />}
      footer={
        <PillButton
          label={questionnaireSent ? "Save" : signed ? "Continue" : "Sign & continue"}
          disabled={!user || signature.trim().length === 0}
          loading={busy}
          onPress={() => void sign()}
        />
      }
    >
      <Eyebrow>Before we design your programme</Eyebrow>
      <Heading size={24}>Consent & non-disclosure</Heading>
      <Body style={{ marginTop: 6, marginBottom: 18 }}>Dr. Kanika’s 360° Fitness</Body>

      <Card style={{ marginBottom: 14, gap: 10 }}>
        <NameLine />
        {terms.map((term) => (
          <View key={term} style={{ flexDirection: "row", gap: 10 }}>
            <Body color={colors.roseText}>•</Body>
            <Body style={{ flex: 1 }}>{term}</Body>
          </View>
        ))}
      </Card>

      <Card style={{ marginBottom: 14, gap: 12 }}>
        <Body color={colors.ink}>Can we use your progress photos for clinic display and publicity?</Body>
        <RadioList
          options={photoOptions}
          value={photoConsent}
          onChange={setPhotoConsent}
        />
      </Card>

      <Card style={{ gap: 4 }}>
        <Body color={colors.ink}>Type your full name to sign</Body>
        <TextInput
          value={signature}
          // Return finishes signing rather than inserting a line break.
          onChangeText={(t) => setSignature(t.replace(/[\r\n]+/g, " "))}
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
          {signed ? `Signed ${signedOn}` : `Signing ${signedOn}`} · timestamp recorded
        </Text>
      </Card>
    </ScreenScaffold>
  );
}
