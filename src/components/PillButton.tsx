import React, { useState } from "react";
import { Pressable, Text, ActivityIndicator } from "react-native";
import { colors } from "../theme/colors";

type Variant = "primary" | "secondary" | "outline" | "text";

export default function PillButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  glow = true,
  full = true,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  glow?: boolean;
  full?: boolean;
}) {
  const isDisabled = disabled || loading;

  const bg =
    variant === "primary"
      ? isDisabled
        ? "#E8E2D8"
        : colors.orange
      : variant === "secondary"
      ? colors.orangeTint
      : "transparent";

  const textColor =
    variant === "primary" ? (isDisabled ? colors.faint : "#FFFFFF") : disabled ? colors.faint : colors.orangeDark;

  const borderColor = variant === "outline" ? colors.hairline : "transparent";
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={isDisabled}
      style={{
        width: full ? "100%" : undefined,
        alignSelf: full ? undefined : "flex-start",
        paddingVertical: 16,
        paddingHorizontal: 28,
        borderRadius: 999,
        backgroundColor: bg,
        borderWidth: variant === "outline" ? 1.5 : 0,
        borderColor,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed && !isDisabled ? 0.85 : 1,
        shadowColor: "#FF7E1D",
        shadowOpacity: variant === "primary" && glow && !isDisabled ? 0.3 : 0,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 10 },
        elevation: variant === "primary" && glow && !isDisabled ? 4 : 0,
      }}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          style={{
            color: textColor,
            fontFamily: "Nunito_700Bold",
            fontSize: 16,
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function TextButton({
  label,
  onPress,
  color = colors.orangeDark,
}: {
  label: string;
  onPress?: () => void;
  color?: string;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Text style={{ color, fontFamily: "Nunito_700Bold", fontSize: 14, textAlign: "center" }}>
        {label}
      </Text>
    </Pressable>
  );
}
