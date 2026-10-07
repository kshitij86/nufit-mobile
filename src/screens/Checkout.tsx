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
import { createOrder, verifyPayment, VERIFY_FAILED_MESSAGE } from "../services/payments";
import { NetworkError, userMessage } from "../services/http";
import RazorpayCheckoutModal, { RazorpayCheckoutOptions, RazorpayResult } from "../components/RazorpayCheckoutModal";

const paymentOptions = ["UPI · GPay, PhonePe", "Credit or debit card", "EMI · 3 months, no cost"];
const razorpayMethod: Record<string, RazorpayCheckoutOptions["method"]> = {
  [paymentOptions[0]]: "upi",
  [paymentOptions[1]]: "card",
  [paymentOptions[2]]: "emi",
};

type Phase = "idle" | "creatingOrder" | "inCheckout" | "verifying";

const phaseHint: Partial<Record<Phase, string>> = {
  creatingOrder: "Setting up secure checkout. This can take a few seconds.",
  verifying: "Confirming your payment. Please keep the app open.",
};

export default function Checkout() {
  const navigation = useNavigation<RootNav>();
  const { data, update, toast } = useAppState();
  const programme = programmeById(data.programmeId);
  const gst = programme.price * 0.18;
  const [phase, setPhase] = useState<Phase>("idle");
  const [checkout, setCheckout] = useState<RazorpayCheckoutOptions | null>(null);
  // Once an order exists, show the server's price rather than the one computed here.
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const total = serverTotal ?? programme.price * 1.18;

  const startPayment = async () => {
    setPhase("creatingOrder");
    let order;
    try {
      order = await createOrder(programme.id);
    } catch (e) {
      setPhase("idle");
      Alert.alert("Couldn't start payment", userMessage(e));
      return;
    }

    const orderTotal = order.amount / 100;
    setServerTotal(orderTotal);
    const openCheckout = () => {
      setPhase("inCheckout");
      setCheckout({
        order,
        description: `${programme.name} · ${programme.weeksLabel}`,
        method: razorpayMethod[data.paymentMethod],
        prefill: { name: data.consent.name || undefined },
      });
    };

    if (order.amount !== Math.round(total * 100)) {
      Alert.alert(
        "Price updated",
        `The total payable for ${programme.name} is ${formatInr(orderTotal)}.`,
        [
          { text: "Cancel", style: "cancel", onPress: () => setPhase("idle") },
          { text: `Pay ${formatInr(orderTotal)}`, onPress: openCheckout },
        ],
        { cancelable: false }
      );
    } else {
      openCheckout();
    }
  };

  const onResult = async (result: RazorpayResult) => {
    setCheckout(null);
    // Dismissal and client-side failures never reach the server; paying again creates a new order.
    if (result.status === "dismissed") {
      setPhase("idle");
      return;
    }
    if (result.status === "failed") {
      setPhase("idle");
      Alert.alert("Payment failed", result.description);
      return;
    }

    setPhase("verifying");
    const reference = result.payment.razorpay_payment_id;
    try {
      await verifyPayment(result.payment);
    } catch (e) {
      setPhase("idle");
      const message = e instanceof NetworkError ? VERIFY_FAILED_MESSAGE : userMessage(e);
      Alert.alert("Couldn't confirm payment", `${message}\n\nPayment reference: ${reference}`);
      return;
    }
    setPhase("idle");
    update({ paymentId: reference });
    toast.show("Payment successful");
    navigation.navigate("Intake");
  };

  return (
    <ScreenScaffold
      header={<BackButton />}
      footer={
        <>
          <RazorpayCheckoutModal options={checkout} onResult={onResult} />
          <PillButton label={`Pay ${formatInr(total)}`} loading={phase !== "idle"} onPress={startPayment} />
          {phaseHint[phase] && (
            <Body size={13} color={colors.ink} style={{ textAlign: "center" }}>
              {phaseHint[phase]}
            </Body>
          )}
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
