import React, { useEffect, useState } from "react";
import { Animated, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { useAppState } from "../state/AppState";

export default function Toast() {
  const { toast } = useAppState();
  const insets = useSafeAreaInsets();
  const [translateY] = useState(() => new Animated.Value(60));
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (toast.message) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 60, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [toast.message, translateY, opacity]);

  if (!toast.message) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 20,
        right: 20,
        bottom: insets.bottom + 24,
        alignItems: "center",
        zIndex: 100,
      }}
    >
      <Animated.View
        style={{
          transform: [{ translateY }],
          opacity,
          backgroundColor: colors.ink,
          borderRadius: 999,
          paddingVertical: 12,
          paddingHorizontal: 20,
          maxWidth: "100%",
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
        }}
      >
        <Text style={{ color: "#FFFFFF", fontFamily: "Nunito_700Bold", fontSize: 13 }}>{toast.message}</Text>
      </Animated.View>
    </View>
  );
}
