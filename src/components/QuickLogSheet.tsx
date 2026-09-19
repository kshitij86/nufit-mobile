import React, { useEffect, useState } from "react";
import { Animated, Modal, Pressable, Text, View, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../theme/colors";
import { useAppState } from "../state/AppState";
import { RootNav } from "../navigation/types";

const { height: SCREEN_H } = Dimensions.get("window");

function QuickAction({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: "48%",
        backgroundColor: colors.cream,
        borderRadius: 18,
        padding: 14,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: iconBg,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={{ fontFamily: "Nunito_800ExtraBold", color: colors.ink, fontSize: 14 }}>{title}</Text>
      <Text style={{ fontFamily: "Nunito_600SemiBold", color: colors.muted, fontSize: 12, marginTop: 2 }}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

export default function QuickLogSheet() {
  const { quickLogOpen, setQuickLogOpen, addWater, toast } = useAppState();
  const navigation = useNavigation<RootNav>();
  const insets = useSafeAreaInsets();
  const [translateY] = useState(() => new Animated.Value(SCREEN_H));

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: quickLogOpen ? 0 : SCREEN_H,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [quickLogOpen, translateY]);

  const close = () => setQuickLogOpen(false);

  return (
    <Modal visible={quickLogOpen} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(43,39,53,0.4)" }} onPress={close}>
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            transform: [{ translateY }],
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 20,
              paddingBottom: insets.bottom + 20,
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
            <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 20, color: colors.ink }}>Quick log</Text>
            <Text
              style={{
                fontFamily: "Nunito_400Regular",
                fontSize: 14,
                color: colors.secondary,
                marginTop: 4,
                marginBottom: 18,
              }}
            >
              Two taps, no forms. Everything lands in your fortnightly review.
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
              <QuickAction
                icon="water"
                iconBg={colors.sky}
                iconColor={colors.skyStrong}
                title="Water"
                subtitle="+250 ml"
                onPress={() => {
                  addWater();
                  close();
                  toast.show("250 ml added");
                }}
              />
              <QuickAction
                icon="fast-food"
                iconBg={colors.amberTint}
                iconColor={colors.amberInk}
                title="Off-plan bite"
                subtitle="Log honestly"
                onPress={() => {
                  close();
                  toast.show("Noted — it goes in the fortnight review");
                }}
              />
              <QuickAction
                icon="walk"
                iconBg={colors.sage}
                iconColor={colors.sageStrong}
                title="Walk"
                subtitle="Add 20 min"
                onPress={() => {
                  close();
                  toast.show("20 minute walk logged");
                }}
              />
              <QuickAction
                icon="happy"
                iconBg={colors.lilac}
                iconColor={colors.lilacStrong}
                title="How I feel"
                subtitle="Re-check in"
                onPress={() => {
                  close();
                  navigation.navigate("Mood");
                }}
              />
            </View>
            <Pressable
              onPress={close}
              style={{
                marginTop: 6,
                paddingVertical: 14,
                borderRadius: 999,
                backgroundColor: colors.cream,
                alignItems: "center",
              }}
            >
              <Text style={{ fontFamily: "Nunito_700Bold", color: colors.ink }}>Close</Text>
            </Pressable>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
