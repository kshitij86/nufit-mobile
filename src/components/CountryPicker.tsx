import React, { useEffect, useMemo, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { Country, countryByIso, flagEmoji, searchCountries } from "../data/countries";

const { height: SCREEN_H } = Dimensions.get("window");
const ROW_HEIGHT = 52;
// Wide enough for the longest code (+971 ▾), so the number doesn't shift when the country changes.
const CHIP_WIDTH = 104;
const CHIP_HEIGHT = 38;

// Emoji and Nunito sit on different baselines, and Android adds font padding, so both get a fixed
// line height and are centred in it.
const centredText = { includeFontPadding: false, textAlignVertical: "center" } as const;

function Flag({ iso, size }: { iso: string; size: number }) {
  return <Text style={{ fontSize: size, lineHeight: Math.round(size * 1.25), ...centredText }}>{flagEmoji(iso)}</Text>;
}

// Pressable's function-form `style` is dropped by NativeWind's JSX wrapper, so pressed state is
// tracked by hand (as in PillButton) and the style is a plain object.
function CountryRow({ country, selected, onPress }: { country: Country; selected: boolean; onPress: () => void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${country.name} +${country.dial}`}
      style={{
        height: ROW_HEIGHT,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 12,
        borderRadius: 14,
        backgroundColor: selected ? colors.blushTint : pressed ? colors.cream : "transparent",
      }}
    >
      <Flag iso={country.iso} size={22} />
      <Text
        numberOfLines={1}
        style={{ flex: 1, fontFamily: "Nunito_600SemiBold", fontSize: 15, lineHeight: 20, color: colors.ink, ...centredText }}
      >
        {country.name}
      </Text>
      <Text
        style={{
          fontFamily: "Nunito_700Bold",
          fontSize: 14,
          lineHeight: 20,
          color: selected ? colors.roseText : colors.secondary,
          ...centredText,
        }}
      >
        +{country.dial}
      </Text>
      <View style={{ width: 18, alignItems: "flex-end" }}>
        {selected && <Ionicons name="checkmark" size={18} color={colors.roseText} />}
      </View>
    </Pressable>
  );
}

// Mounted only while open, so the search starts empty each time.
function CountrySheet({
  selectedIso,
  onSelect,
  onClose,
}: {
  selectedIso: string;
  onSelect: (country: Country) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [translateY] = useState(() => new Animated.Value(SCREEN_H));
  const results = useMemo(() => searchCountries(query), [query]);

  useEffect(() => {
    Animated.timing(translateY, { toValue: 0, duration: 280, useNativeDriver: true }).start();
  }, [translateY]);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(43,39,53,0.4)" }}
          onPress={onClose}
          accessibilityLabel="Close country list"
        />
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "80%",
            transform: [{ translateY }],
            backgroundColor: colors.card,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 20,
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.hairline,
              alignSelf: "center",
              marginBottom: 16,
            }}
          />
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
            <Text style={{ flex: 1, fontFamily: "Outfit_700Bold", fontSize: 20, color: colors.ink }}>
              Select your country
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={10}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.cream,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="close" size={18} color={colors.ink} />
            </Pressable>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 14,
              backgroundColor: colors.cream,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: colors.hairline,
              marginBottom: 8,
            }}
          >
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search country or code"
              placeholderTextColor={colors.faint}
              accessibilityLabel="Search countries"
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              style={{
                flex: 1,
                paddingVertical: 12,
                fontFamily: "Nunito_600SemiBold",
                fontSize: 15,
                color: colors.ink,
              }}
            />
          </View>

          <FlatList
            data={results}
            keyExtractor={(c) => c.iso}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            getItemLayout={(_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })}
            initialNumToRender={14}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            renderItem={({ item }) => (
              <CountryRow country={item} selected={item.iso === selectedIso} onPress={() => onSelect(item)} />
            )}
            ListEmptyComponent={
              <Text
                style={{
                  fontFamily: "Nunito_600SemiBold",
                  fontSize: 14,
                  color: colors.muted,
                  textAlign: "center",
                  marginTop: 24,
                }}
              >
                {`No countries match "${query.trim()}".`}
              </Text>
            }
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * The flag and +code at the start of a phone field (pass it as TextField's `prefix`). Tapping it
 * opens a searchable list of countries; picking one fills in its code.
 */
export default function CountryPicker({
  value,
  onChange,
  disabled = false,
}: {
  /** ISO code of the selected country, e.g. "IN". */
  value: string;
  onChange: (country: Country) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pressed, setPressed] = useState(false);
  const country = countryByIso(value);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`Country: ${country.name} +${country.dial}`}
        accessibilityHint="Opens the list of countries"
        hitSlop={6}
        style={{
          width: CHIP_WIDTH,
          height: CHIP_HEIGHT,
          marginLeft: 6,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          borderRadius: 12,
          backgroundColor: pressed ? colors.blush : colors.blushTint,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Flag iso={country.iso} size={18} />
        <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 15, lineHeight: 20, color: colors.ink, ...centredText }}>
          +{country.dial}
        </Text>
        <Ionicons name="chevron-down" size={14} color={colors.roseText} />
      </Pressable>
      {open && (
        <CountrySheet
          selectedIso={country.iso}
          onClose={() => setOpen(false)}
          onSelect={(picked) => {
            setOpen(false);
            onChange(picked);
          }}
        />
      )}
    </>
  );
}
