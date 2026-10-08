import React, { useState } from "react";
import { Keyboard, Modal, Platform, Pressable, Text, View } from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

// A field that opens the platform's native date picker: the system dialog on Android,
// a bottom sheet with the wheel picker on iOS.
export default function DateField({
  label,
  value,
  onChange,
  placeholder,
  format,
  initialDate,
  minimumDate,
  maximumDate,
  error,
  hint,
  disabled,
}: {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder: string;
  format: (date: Date) => string;
  /** Where the picker starts when there's no value yet. */
  initialDate: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  error?: string;
  hint?: string;
  disabled?: boolean;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(value ?? initialDate);
  const insets = useSafeAreaInsets();

  const open = () => {
    Keyboard.dismiss();
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: value ?? initialDate,
        mode: "date",
        minimumDate,
        maximumDate,
        onChange: (event, date) => {
          if (event.type === "set" && date) onChange(date);
        },
      });
    } else {
      setDraft(value ?? initialDate);
      setSheetOpen(true);
    }
  };

  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 13, color: colors.secondary }}>{label}</Text>
      <Pressable
        onPress={open}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? format(value) : "not set"}. Change`}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.card,
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: error ? colors.coralInk : sheetOpen ? colors.orange : colors.hairline,
          paddingVertical: 14,
          paddingHorizontal: 16,
        }}
      >
        <Text
          style={{
            flex: 1,
            fontFamily: "Nunito_600SemiBold",
            fontSize: 15,
            color: value ? colors.ink : colors.faint,
          }}
        >
          {value ? format(value) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={colors.muted} />
      </Pressable>
      {(error || hint) && (
        <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 12, color: error ? colors.coralInk : colors.muted }}>
          {error ?? hint}
        </Text>
      )}

      {Platform.OS === "ios" && (
        <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }} onPress={() => setSheetOpen(false)} />
          <View
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: insets.bottom + 8,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 16 }}>
              <Pressable onPress={() => setSheetOpen(false)} hitSlop={10} accessibilityRole="button">
                <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 16, color: colors.secondary }}>Cancel</Text>
              </Pressable>
              <Text
                style={{ flex: 1, textAlign: "center", fontFamily: "Outfit_700Bold", fontSize: 16, color: colors.ink }}
              >
                {label}
              </Text>
              <Pressable
                onPress={() => {
                  onChange(draft);
                  setSheetOpen(false);
                }}
                hitSlop={10}
                accessibilityRole="button"
              >
                <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 16, color: colors.orange }}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={draft}
              mode="date"
              display="spinner"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              themeVariant="light"
              textColor={colors.ink}
              onValueChange={(_event, date) => setDraft(date)}
              style={{ alignSelf: "stretch" }}
            />
          </View>
        </Modal>
      )}
    </View>
  );
}
