import React, { useEffect, useState } from "react";
import { Animated, ViewStyle } from "react-native";

export default function ScreenFade({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(10));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View style={[{ flex: 1, opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}
