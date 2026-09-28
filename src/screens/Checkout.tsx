import React, { useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import PillButton from "../components/PillButton";
import { BackButton, Body, Card, Divider, Eyebrow, Heading } from "../components/Primitives";
import { programmeById } from "../data/programmes";
import { useAppState } from "../state/AppState";
import { RootNav } from "../navigation/types";
import { formatInr } from "../utils/format";
import { createOrder, verifyPayment } from "../services/payments";
import RazorpayCheckoutModal, { RazorpayCheckoutOptions, RazorpayResult } from "../components/RazorpayCheckoutModal";

const paymentOptions = ["UPI · GPay, PhonePe", "Credit or debit card", "EMI · 3 months, no cost"];
const razorpayMethod: Record<string, RazorpayCheckoutOptions["method"]> = {
  [paymentOptions[0]]: "upi",
  [paymentOptions[1]]: "card",
  [paymentOptions[2]]: "emi",
};

export default function Checkout() {
  const navigation = useNavigation<RootNav>();
  const { data, update, toast } = useAppState();
  const programme = programmeById(data.programmeId);
  const gst = programme.price * 0.18;
  const total = programme.price * 1.18;
  const [busy, setBusy] = useState(false);
  const [checkout, setCheckout] = useState<RazorpayCheckoutOptions | null>(null);

  const startPayment = async () => {
    setBusy(true);
    try {
      const order = await createOrder(programme.id);
      setCheckout({
        order,
        description: `${programme.name} · ${programme.weeksLabel}`,
        method: razorpayMethod[data.paymentMethod],
        prefill: { name: data.consent.name || undefined },
      });
    } catch (e) {
      setBusy(false);
      Alert.alert("Couldn't start payment", e instanceof Error ? e.message : "Please try again.");
    }
  };

  const onResult = async (result: RazorpayResult) => {
    setCheckout(null);
    if (result.status === "dismissed") {
      setBusy(false);
      return;
    }
    if (result.status === "failed") {
      setBusy(false);
      Alert.alert("Payment failed", result.description);
      return;
    }
    try {
      if (!(await verifyPayment(result.payment))) throw new Error("Signature mismatch");
      update({ paymentId: result.payment.razorpay_payment_id });
      toast.show("Payment successful");
      navigation.navigate("Intake");
    } catch {
      Alert.alert(
        "Couldn't confirm payment",
        `If money was deducted, contact support with reference ${result.payment.razorpay_payment_id}.`
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenScaffold
      header={<BackButton />}
      footer={
        <>
          <RazorpayCheckoutModal options={checkout} onResult={onResult} />
          <PillButton label={`Pay ${formatInr(total)}`} loading={busy} onPress={startPayment} />
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
