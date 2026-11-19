import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { Body, Card } from "../Primitives";

const steps = [
  { label: "Programme booked", done: true },
  { label: "Consent signed", done: true },
  { label: "Questionnaire sent", done: true },
  { label: "Dr. Kanika's team is designing your plan", done: false },
];

/** Today, between sending the questionnaire and the first plan being published. */
export default function PlanInPreparation({ sentAt, onMeasure }: { sentAt: string | null; onMeasure?: () => void }) {
  return (
    <Card bg={colors.blushTint} style={{ marginTop: 14, marginBottom: 14, gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="hourglass-outline" size={20} color={colors.roseText} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 11, letterSpacing: 1, color: colors.roseText, textTransform: "uppercase" }}>
            In progress
          </Text>
          <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 18, color: colors.ink }}>Your plan is being prepared</Text>
        </View>
      </View>
      <Body color={colors.ink} size={14}>
        {"Dr. Kanika and her team are designing your diet chart and workouts. We'll notify you by email and message once it's ready."}
      </Body>
      <View style={{ gap: 8 }}>
        {steps.map((s) => (
          <View key={s.label} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons
              name={s.done ? "checkmark-circle" : "ellipse-outline"}
              size={18}
              color={s.done ? colors.sageStrong : colors.roseText}
            />
            <Text style={{ flex: 1, fontFamily: s.done ? "Nunito_600SemiBold" : "Nunito_800ExtraBold", fontSize: 13, color: s.done ? colors.secondary : colors.ink }}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>
      {sentAt && (
        <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 12, color: colors.muted }}>
          Questionnaire sent {new Date(sentAt).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
        </Text>
      )}
      {onMeasure && (
        <Pressable
          onPress={onMeasure}
          accessibilityRole="button"
          style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.card, borderRadius: 14, padding: 12 }}
        >
          <Ionicons name="resize-outline" size={18} color={colors.roseText} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 14, color: colors.ink }}>While you wait</Text>
            <Body size={12} color={colors.muted}>Log your starting measurements, so you can see your progress.</Body>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.faint} />
        </Pressable>
      )}
    </Card>
  );
}
