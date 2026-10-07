import React, { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

const SPLASH_MS = 3000;
const FADE_OUT_MS = 400;

export default function AppSplash({ onLayout, onFinish }: { onLayout?: () => void; onFinish: () => void }) {
  const [circles] = useState(() => new Animated.Value(0));
  const [text] = useState(() => new Animated.Value(0));
  const [pulse] = useState(() => new Animated.Value(0));
  const [progress] = useState(() => new Animated.Value(0));
  const [exit] = useState(() => new Animated.Value(1));

  useEffect(() => {
    Animated.sequence([
      Animated.spring(circles, { toValue: 1, friction: 7, tension: 40, useNativeDriver: true }),
      Animated.timing(text, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    breathing.start();

    Animated.timing(progress, {
      toValue: 1,
      duration: SPLASH_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(exit, { toValue: 0, duration: FADE_OUT_MS, useNativeDriver: true }).start(() => {
        breathing.stop();
        onFinish();
      });
    });
  }, [circles, text, pulse, progress, exit, onFinish]);

  const circleScale = circles.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const textShift = text.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity: exit }]} onLayout={onLayout}>
      <View style={styles.center}>
        <Animated.View style={[styles.art, { opacity: circles, transform: [{ scale: circleScale }] }]}>
          <View style={styles.softCircle} />
          <Animated.View style={[styles.sunCircle, { transform: [{ scale: pulseScale }] }]} />
        </Animated.View>

        <Animated.View style={{ alignItems: "center", opacity: text, transform: [{ translateY: textShift }] }}>
          <Text style={styles.wordmark}>
            nufit<Text style={{ color: colors.orange }}>.</Text>
          </Text>
          <Text style={styles.tagline}>HOLISTIC · CLINICAL · YOURS</Text>
        </Animated.View>
      </View>

      <View style={styles.track}>
        <Animated.View style={[styles.bar, { transform: [{ scaleX: progress }] }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.cream, zIndex: 100 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  art: { width: 180, height: 160, marginBottom: 28 },
  softCircle: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFDDB8",
    top: 0,
    left: 10,
  },
  sunCircle: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.orange,
    opacity: 0.9,
    bottom: 0,
    right: 14,
  },
  wordmark: { fontFamily: "Outfit_800ExtraBold", fontSize: 48, color: colors.ink, letterSpacing: -1 },
  tagline: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 11,
    letterSpacing: 2,
    color: "#B4703A",
    marginTop: 8,
  },
  track: {
    position: "absolute",
    bottom: 72,
    alignSelf: "center",
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.orangeTint,
    overflow: "hidden",
  },
  bar: { flex: 1, backgroundColor: colors.orange, transformOrigin: "left" },
});
