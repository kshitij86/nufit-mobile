import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { sessionById } from "../data/sessions";
import { RootStackParamList, RootNav } from "../navigation/types";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const RING_SIZE = 240;
const STROKE = 12;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Player() {
  const navigation = useNavigation<RootNav>();
  const route = useRoute<RouteProp<RootStackParamList, "Player">>();
  const session = sessionById(route.params.sessionId);

  const [stepIndex, setStepIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);

  const step = session.steps[stepIndex];
  const [progressAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setElapsed((prevElapsed) => {
        const next = prevElapsed + 1;
        if (next >= step.seconds) {
          if (stepIndex < session.steps.length - 1) {
            setStepIndex((i) => i + 1);
            return 0;
          }
          setRunning(false);
          return step.seconds;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, step.seconds, stepIndex, session.steps.length]);

  useEffect(() => {
    const fraction = Math.min(1, elapsed / step.seconds);
    Animated.timing(progressAnim, { toValue: fraction, duration: 300, useNativeDriver: false }).start();
  }, [elapsed, step.seconds, progressAnim]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  const remaining = step.seconds - elapsed;
  const isSessionComplete = stepIndex === session.steps.length - 1 && elapsed >= step.seconds;
  const nextLabel = isSessionComplete
    ? "Session complete"
    : session.steps[stepIndex + 1]?.name ?? "Session complete";

  const onPlayPause = () => {
    setStarted(true);
    setRunning((r) => !r);
  };

  const goStep = (delta: number) => {
    const next = Math.max(0, Math.min(session.steps.length - 1, stepIndex + delta));
    setStepIndex(next);
    setElapsed(0);
  };

  const buttonLabel = !started ? "Begin" : running ? "Pause" : elapsed > 0 ? "Resume" : "Begin";

  return (
    <View style={{ flex: 1, backgroundColor: session.tint }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 8 }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.6)", alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="close" size={22} color={session.ink} />
          </Pressable>
          <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 12, letterSpacing: 1, color: session.ink }}>
            {session.kind.toUpperCase()} · {session.minutes} MIN
          </Text>
        </View>

        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: "center", justifyContent: "center" }}>
            <Svg width={RING_SIZE} height={RING_SIZE} style={{ position: "absolute" }}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke="rgba(255,255,255,0.6)"
                strokeWidth={STROKE}
                fill="none"
              />
              <AnimatedCircle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke={session.ring}
                strokeWidth={STROKE}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                rotation={-90}
                originX={RING_SIZE / 2}
                originY={RING_SIZE / 2}
              />
            </Svg>
            <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 44, color: colors.ink }}>
              {formatTime(Math.max(0, remaining))}
            </Text>
            <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 13, color: colors.secondary, marginTop: 4 }}>
              Step {stepIndex + 1} of {session.steps.length}
            </Text>
          </View>

          <View style={{ paddingHorizontal: 30, marginTop: 30, alignItems: "center" }}>
            <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 22, color: colors.ink, textAlign: "center", marginBottom: 10 }}>
              {step.name}
            </Text>
            <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 14, color: colors.secondary, textAlign: "center", lineHeight: 21 }}>
              {step.cue}
            </Text>
          </View>
        </View>

        <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 20, paddingBottom: 30, paddingHorizontal: 30 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24 }}>
            <Pressable onPress={() => goStep(-1)} style={{ padding: 10 }}>
              <Ionicons name="play-skip-back" size={22} color={colors.ink} />
            </Pressable>
            <Pressable
              onPress={onPlayPause}
              style={{
                width: 68,
                height: 68,
                borderRadius: 34,
                backgroundColor: colors.orange,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontFamily: "Nunito_800ExtraBold", color: "#fff", fontSize: 13 }}>{buttonLabel}</Text>
            </Pressable>
            <Pressable onPress={() => goStep(1)} style={{ padding: 10 }}>
              <Ionicons name="play-skip-forward" size={22} color={colors.ink} />
            </Pressable>
          </View>
          <Text style={{ textAlign: "center", fontFamily: "Nunito_600SemiBold", fontSize: 12, color: colors.muted, marginTop: 14 }}>
            Next: {nextLabel}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
