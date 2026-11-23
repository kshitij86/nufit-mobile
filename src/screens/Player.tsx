import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Animated, Image, ScrollView } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import ResourceState from "../components/ResourceState";
import { sessionExercises, useSession } from "../services/workouts";
import { Session, SessionStep } from "../types";
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
  const route = useRoute<RouteProp<RootStackParamList, "Player">>();
  const session = useSession(route.params.sessionId);
  if (!session.data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream, justifyContent: "center", padding: 20 }}>
        <ResourceState resource={session} />
      </SafeAreaView>
    );
  }
  const exercises = sessionExercises(session.data);
  return exercises.length ? <SessionVideos session={session.data} exercises={exercises} /> : <SessionPlayer session={session.data} />;
}

/** "Round 1 of 3 · 20 reps" on the first round → "3 rounds · 20 reps": the list shows each exercise once. */
function listCue(cue: string): string {
  return cue.replace(/^Round 1 of (\d+) · /, "$1 rounds · ");
}

/** A workout from the plan: its exercises, each opening its video. */
function SessionVideos({ session, exercises }: { session: Session; exercises: SessionStep[] }) {
  const navigation = useNavigation<RootNav>();
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 8 }}>
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityLabel="Close"
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.blushTint, alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="close" size={22} color={session.ink} />
          </Pressable>
          <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 12, letterSpacing: 1, color: session.ink }}>
            {session.kind.toUpperCase()} · {session.minutes} MIN
          </Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12 }}>
          <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 26, color: colors.ink }}>{session.name}</Text>
          <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 13, color: colors.secondary, marginBottom: 6 }}>
            {exercises.length} {exercises.length === 1 ? "exercise" : "exercises"}
            {session.kit ? ` · ${session.kit}` : ""}
          </Text>
          {exercises.map((step) => {
            const video = step.video;
            return (
              <Pressable
                key={step.exerciseCode}
                disabled={!video}
                accessibilityRole="button"
                accessibilityLabel={video ? `Play ${step.name}` : `${step.name}, video coming soon`}
                onPress={() => video && navigation.navigate("ExercisePlayer", { name: step.name, cue: step.cue, video })}
                style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 10, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.hairline }}
              >
                <View style={{ width: 104, height: 64, borderRadius: 12, overflow: "hidden", backgroundColor: colors.blushTint, alignItems: "center", justifyContent: "center" }}>
                  {video?.thumbnailUrl && (
                    <Image source={{ uri: video.thumbnailUrl }} resizeMode="cover" style={{ position: "absolute", width: "100%", height: "100%" }} />
                  )}
                  <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: video ? "rgba(255,255,255,0.9)" : "transparent", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name={video ? "play" : "videocam-off-outline"} size={video ? 15 : 20} color={colors.roseText} style={{ marginLeft: video ? 2 : 0 }} />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ fontFamily: "Outfit_700Bold", fontSize: 16, color: colors.ink }}>
                    {step.name}
                  </Text>
                  <Text numberOfLines={2} style={{ fontFamily: "Nunito_600SemiBold", fontSize: 12.5, lineHeight: 17, color: colors.secondary, marginTop: 2 }}>
                    {video ? listCue(step.cue) : "Video coming soon"}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SessionPlayer({ session }: { session: Session }) {
  const navigation = useNavigation<RootNav>();

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
                backgroundColor: colors.rose,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontFamily: "Nunito_800ExtraBold", color: colors.roseInk, fontSize: 13 }}>{buttonLabel}</Text>
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
