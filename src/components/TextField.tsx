import React, { useState } from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";
import { colors } from "../theme/colors";

export default function TextField({
  label,
  error,
  hint,
  prefix,
  ...props
}: TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
  /** Rendered inside the field's border, before the input (e.g. a country code picker). */
  prefix?: React.ReactNode;
  ref?: React.Ref<TextInput>;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 13, color: colors.secondary }}>{label}</Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.card,
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: error ? colors.coralInk : focused ? colors.orange : colors.hairline,
        }}
      >
        {prefix}
        <TextInput
          placeholderTextColor={colors.faint}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            paddingVertical: 14,
            paddingHorizontal: 16,
            fontFamily: "Nunito_600SemiBold",
            fontSize: 15,
            color: colors.ink,
          }}
          {...props}
        />
      </View>
      {(error || hint) && (
        <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 12, color: error ? colors.coralInk : colors.muted }}>
          {error ?? hint}
        </Text>
      )}
    </View>
  );
}
