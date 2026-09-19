import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import PillButton from "../components/PillButton";
import { BackButton, Body, Card, Divider, Eyebrow, Heading } from "../components/Primitives";
import { programmeById } from "../data/programmes";
import { useAppState } from "../state/AppState";
import { RootNav } from "../navigation/types";
import { formatInr } from "../utils/format";

const paymentOptions = ["UPI · GPay, PhonePe", "Credit or debit card", "EMI · 3 months, no cost"];

export default function Checkout() {
  const navigation = useNavigation<RootNav>();
  const { data, update } = useAppState();
  const programme = programmeById(data.programmeId);
  const gst = programme.price * 0.18;
  const total = programme.price * 1.18;

  return (
    <ScreenScaffold
      header={<BackButton />}
      footer={
        <>
          <PillButton label={`Pay ${formatInr(total)}`} onPress={() => navigation.navigate("Intake")} />
          <Body size={12} style={{ textAlign: "center" }}>
            Fees are non-refundable, as set out in the consent you signed.
          </Body>
        </>
      }
    >
      <Heading size={26}>Checkout</Heading>

      <Card style={{ marginTop: 18, marginBottom: 20 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
          <Text style={{ fontFamily: "Outfit_700Bold", color: colors.ink, fontSize: 16 }}>{programme.name}</Text>
          <Text style={{ fontFamily: "Outfit_700Bold", color: colors.ink, fontSize: 16 }}>
            {formatInr(programme.price)}
          </Text>
        </View>
        <Body size={13} style={{ marginBottom: 14 }}>
          {programme.weeksLabel} · 1:1 supervision
        </Body>
        <Divider />
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 14 }}>
          <Body color={colors.ink} size={14}>GST 18%</Body>
          <Body color={colors.ink} size={14}>{formatInr(gst)}</Body>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
          <Text style={{ fontFamily: "Outfit_700Bold", color: colors.ink, fontSize: 16 }}>Total payable</Text>
          <Text style={{ fontFamily: "Outfit_700Bold", color: colors.orangeDark, fontSize: 16 }}>
            {formatInr(total)}
          </Text>
        </View>
      </Card>

      <Eyebrow>Payment method</Eyebrow>
      <View style={{ gap: 10 }}>
        {paymentOptions.map((opt) => {
          const selected = data.paymentMethod === opt;
          return (
            <Pressable
              key={opt}
              onPress={() => update({ paymentMethod: opt })}
              style={{
                paddingVertical: 16,
                paddingHorizontal: 18,
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: selected ? colors.orange : colors.hairline,
                backgroundColor: selected ? colors.orangeTint : colors.card,
              }}
            >
              <Text
                style={{
                  fontFamily: selected ? "Nunito_700Bold" : "Nunito_600SemiBold",
                  color: colors.ink,
                  fontSize: 14,
                  textAlign: "center",
                }}
              >
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScreenScaffold>
  );
}
