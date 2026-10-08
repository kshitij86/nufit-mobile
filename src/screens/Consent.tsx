import React from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import PillButton from "../components/PillButton";
import { BackButton, Body, Card, Eyebrow, Heading } from "../components/Primitives";
import { useAppState } from "../state/AppState";
import { RootNav } from "../navigation/types";
import { NAME_MAX_LENGTH } from "../utils/registration";

// The fields wrap onto new lines, but Return should still finish editing rather than insert a line break.
const singleLine = (t: string) => t.replace(/[\r\n]+/g, " ");

function InlineInput({ value, onChangeText, placeholder, width = 140, maxLength }: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  width?: number;
  maxLength?: number;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={(t) => onChangeText(singleLine(t))}
      maxLength={maxLength}
      multiline
      submitBehavior="blurAndSubmit"
      returnKeyType="done"
      placeholder={placeholder}
      placeholderTextColor={colors.faint}
      style={{
        minWidth: width,
        maxWidth: "100%",
        borderBottomWidth: 1.5,
        borderBottomColor: colors.orange,
        paddingVertical: 2,
        paddingHorizontal: 4,
        fontFamily: "Nunito_700Bold",
        color: colors.ink,
        fontSize: 15,
      }}
    />
  );
}

function TogglePair({
  leftLabel,
  rightLabel,
  value,
  onChange,
}: {
  leftLabel: string;
  rightLabel: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={{ flexDirection: "row", backgroundColor: colors.cream, borderRadius: 999, padding: 4 }}>
      {[leftLabel, rightLabel].map((label, i) => {
        const active = i === 0 ? value : !value;
        return (
          <Pressable
            key={label}
            onPress={() => onChange(i === 0)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: active ? colors.orange : "transparent",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: active ? "#fff" : colors.secondary,
                fontFamily: "Nunito_700Bold",
                fontSize: 13,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function Consent() {
  const navigation = useNavigation<RootNav>();
  const { data, update } = useAppState();
  const consent = data.consent;

  const setConsent = (patch: Partial<typeof consent>) => update({ consent: { ...consent, ...patch } });

  return (
    <ScreenScaffold
        header={<BackButton />}
      footer={
        <PillButton
          label="Sign & continue"
          disabled={consent.signature.trim().length === 0}
          onPress={() => navigation.navigate("Checkout")}
        />
      }
    >
      <Eyebrow>Required before any programme</Eyebrow>
      <Heading size={24}>Consent & non-disclosure</Heading>
      <Body style={{ marginTop: 6, marginBottom: 18 }}>Dr. Kanika’s 360° Fitness</Body>

      <Card style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
          <Body color={colors.ink} size={15}>I,</Body>
          <InlineInput
            value={consent.name}
            onChangeText={(t) => setConsent({ name: t })}
            placeholder="your name"
            maxLength={NAME_MAX_LENGTH}
          />
          <Body color={colors.ink} size={15}>R/O</Body>
          <InlineInput
            value={consent.address}
            onChangeText={(t) => setConsent({ address: t })}
            placeholder="your address"
            width={180}
          />
          <Body color={colors.ink} size={15}>
            hereby agree to follow the instructions given by Dr. Kanika for the purpose of weight loss, body
            contouring, pain management, posture correction and lifestyle advice. I understand that deviation
            from the given programme may lead to reduced or no results.
          </Body>
        </View>

        <Body style={{ marginTop: 14 }}>
          I understand that each programme is an individualised programme, and that one programme may not be
          suitable — or may even be harmful — for people other than the person it is designed for. I therefore
          agree not to disclose any details of the programme to any other person.
        </Body>

        <Body style={{ marginTop: 14 }}>
          I understand that the fee paid towards the programme will not be refunded or readjusted in any case.
        </Body>
      </Card>

      <Card style={{ marginBottom: 14, gap: 14 }}>
        <Body color={colors.ink} size={14}>
          Photographs taken during the programme may be used for clinic display and publicity.
        </Body>
        <TogglePair
          leftLabel="Agree"
          rightLabel="Disagree"
          value={consent.photoConsent === "agree"}
          onChange={(v) => setConsent({ photoConsent: v ? "agree" : "disagree" })}
        />
        <TogglePair
          leftLabel="Without my face"
          rightLabel="Face may show"
          value={consent.faceConsent === "without"}
          onChange={(v) => setConsent({ faceConsent: v ? "without" : "show" })}
        />
      </Card>

      <Card>
        <Text style={{ fontFamily: "Nunito_700Bold", color: colors.secondary, fontSize: 13, marginBottom: 10 }}>
          Type your name to sign
        </Text>
        <TextInput
          value={consent.signature}
          onChangeText={(t) => setConsent({ signature: singleLine(t) })}
          placeholder="Your full name"
          maxLength={NAME_MAX_LENGTH}
          multiline
          submitBehavior="blurAndSubmit"
          returnKeyType="done"
          placeholderTextColor={colors.faint}
          style={{
            fontFamily: "Outfit_700Bold",
            fontStyle: "italic",
            fontSize: 22,
            color: colors.ink,
            borderBottomWidth: 1.5,
            borderBottomColor: colors.hairline,
            paddingVertical: 8,
          }}
        />
        <Text style={{ fontFamily: "Nunito_600SemiBold", color: colors.muted, fontSize: 12, marginTop: 10 }}>
          Signed 29 August 2026 · timestamp recorded
        </Text>
      </Card>
    </ScreenScaffold>
  );
}
