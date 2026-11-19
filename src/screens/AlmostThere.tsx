import React, { useEffect, useState } from "react";
import { Animated, Easing, LayoutAnimation, Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import AccountButton from "../components/AccountButton";
import PillButton from "../components/PillButton";
import { Body, Card, Eyebrow, Heading, ProgressBar } from "../components/Primitives";
import { programmeById } from "../data/programmes";
import { useProgrammeStatus } from "../services/journey";
import { useAuth } from "../state/Auth";
import { RootNav } from "../navigation/types";

/** The steps from payment to a finished plan. Tapping one explains it. */
const journey: { id: string; icon: string; title: string; time: string; detail: string }[] = [
  {
    id: "paid",
    icon: "card-outline",
    title: "Programme booked",
    time: "Done",
    detail: "Your payment is confirmed. A receipt is in your Profile.",
  },
  {
    id: "consent",
    icon: "document-text-outline",
    title: "Sign the programme consent",
    time: "1 min",
    detail: "A short agreement about following the programme, keeping it private, and how we may use your photos.",
  },
  {
    id: "profile",
    icon: "clipboard-outline",
    title: "Tell us about you",
    time: "About 10 min",
    detail:
      "Your body, food habits, health, a typical day of eating, movement and sleep. It saves as you go, so you can stop and pick up later.",
  },
  {
    id: "plan",
    icon: "sparkles-outline",
    title: "Dr. Kanika's team designs your plan",
    time: "After you send it",
    detail: "Your diet chart and workouts are written for you by hand. We'll email and message you the moment it's ready.",
  },
];

/** Things worth having nearby before starting. Ticking them is just for the member. */
const handy: { id: string; icon: string; label: string }[] = [
  { id: "scale", icon: "scale-outline", label: "A weighing scale (or your latest weight)" },
  { id: "meals", icon: "restaurant-outline", label: "What you usually eat in a day" },
  { id: "meds", icon: "medkit-outline", label: "Names of any medicines or supplements" },
  { id: "photos", icon: "camera-outline", label: "A spot to take a front and a side photo" },
];

/** First screen after paying: what's left before the plan can be written, then on to the consent. */
export default function AlmostThere() {
  const navigation = useNavigation<RootNav>();
  const { user } = useAuth();
  const programme = useProgrammeStatus().data;
  const name = programme?.programmeId ? programmeById(programme.programmeId).name : null;
  const [open, setOpen] = useState<string | null>("consent");
  const [ready, setReady] = useState<Record<string, boolean>>({});
  const readyCount = handy.filter((h) => ready[h.id]).length;

  // The tick pops in once, then the halo breathes.
  const [pop] = useState(() => new Animated.Value(0));
  const [halo] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(halo, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(halo, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pop, halo]);

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((cur) => (cur === id ? null : id));
  };

  return (
    <ScreenScaffold
      header={<View style={{ alignItems: "flex-end" }}><AccountButton /></View>}
      footer={
        <View style={{ gap: 8 }}>
          <PillButton label="Start my health profile" onPress={() => navigation.navigate("Consent")} />
          <Text style={{ textAlign: "center", fontFamily: "Nunito_600SemiBold", fontSize: 12, color: colors.muted }}>
            About 10 minutes · saves as you go
          </Text>
        </View>
      }
    >
      <View style={{ alignItems: "center", marginTop: 8, marginBottom: 18 }}>
        <View style={{ width: 96, height: 96, alignItems: "center", justifyContent: "center" }}>
          <Animated.View
            style={{
              position: "absolute",
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: colors.blush,
              opacity: halo.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
              transform: [{ scale: halo.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.25] }) }],
            }}
          />
          <Animated.View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: colors.rose,
              alignItems: "center",
              justifyContent: "center",
              transform: [{ scale: pop }],
            }}
          >
            <Ionicons name="checkmark" size={40} color={colors.roseInk} />
          </Animated.View>
        </View>
      </View>

      <Eyebrow>{name ? `${name} · booked` : "Programme booked"}</Eyebrow>
      <Heading size={26}>{`You're almost there${user?.firstName ? `, ${user.firstName}` : ""}!`}</Heading>
      <Body style={{ marginTop: 8, marginBottom: 20 }}>
        {"Dr. Kanika and her team need some information from you to design your programme. Here's what's left."}
      </Body>

      <Card style={{ marginBottom: 16, paddingVertical: 6 }}>
        {journey.map((step, i) => {
          const done = step.id === "paid";
          const next = step.id === "consent";
          const expanded = open === step.id;
          return (
            <Pressable
              key={step.id}
              onPress={() => toggle(step.id)}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              accessibilityLabel={`${step.title}, ${step.time}`}
              style={{ flexDirection: "row", gap: 12, paddingVertical: 10 }}
            >
              <View style={{ alignItems: "center" }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: done ? colors.sage : next ? colors.blushTint : colors.cream,
                    borderWidth: next ? 1.5 : 0,
                    borderColor: colors.rose,
                  }}
                >
                  <Ionicons
                    name={(done ? "checkmark" : step.icon) as never}
                    size={17}
                    color={done ? colors.sageInk : next ? colors.roseText : colors.muted}
                  />
                </View>
                {i < journey.length - 1 && (
                  <View style={{ flex: 1, width: 2, minHeight: 10, marginTop: 4, backgroundColor: done ? colors.sageStrong : colors.hairline }} />
                )}
              </View>
              <View style={{ flex: 1, paddingTop: 6 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ flex: 1, fontFamily: "Nunito_800ExtraBold", fontSize: 15, color: done ? colors.muted : colors.ink }}>
                    {step.title}
                  </Text>
                  <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 12, color: done ? colors.sageInk : next ? colors.roseText : colors.muted }}>
                    {step.time}
                  </Text>
                  <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={14} color={colors.faint} />
                </View>
                {expanded && (
                  <Body size={13} style={{ marginTop: 6 }}>
                    {step.detail}
                  </Body>
                )}
              </View>
            </Pressable>
          );
        })}
      </Card>

      <Card style={{ gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
          <Text style={{ flex: 1, fontFamily: "Nunito_800ExtraBold", fontSize: 15, color: colors.ink }}>Keep these handy</Text>
          <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 12, color: readyCount === handy.length ? colors.sageInk : colors.muted }}>
            {readyCount === handy.length ? "All set!" : `${readyCount} of ${handy.length} ready`}
          </Text>
        </View>
        <ProgressBar progress={readyCount / handy.length} color={colors.sageStrong} track={colors.sage} />
        <View style={{ marginTop: 8 }}>
          {handy.map((item) => {
            const checked = !!ready[item.id];
            return (
              <Pressable
                key={item.id}
                onPress={() => setReady((r) => ({ ...r, [item.id]: !r[item.id] }))}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 }}
              >
                <Ionicons name={item.icon as never} size={18} color={checked ? colors.sageInk : colors.muted} />
                <Body color={checked ? colors.muted : colors.ink} style={{ flex: 1, textDecorationLine: checked ? "line-through" : "none" }}>
                  {item.label}
                </Body>
                <Ionicons name={checked ? "checkmark-circle" : "ellipse-outline"} size={22} color={checked ? colors.sageStrong : colors.faint} />
              </Pressable>
            );
          })}
        </View>
      </Card>
    </ScreenScaffold>
  );
}
