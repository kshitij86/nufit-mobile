import React from "react";
import { View, Text, Pressable } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { useAppState } from "../state/AppState";

const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
  Today: "sunny",
  Move: "barbell",
  Kitchen: "restaurant",
  Journey: "trending-up",
};

function TabItem({ label, focused, onPress }: { label: string; focused: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, alignItems: "center", gap: 4, paddingVertical: 6 }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: focused ? colors.orangeTint : "transparent",
        }}
      >
        <Ionicons name={icons[label]} size={18} color={focused ? colors.orange : colors.muted} />
      </View>
      <Text
        style={{
          fontFamily: focused ? "Nunito_800ExtraBold" : "Nunito_600SemiBold",
          fontSize: 11,
          color: focused ? colors.orangeDark : colors.muted,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { setQuickLogOpen } = useAppState();
  const routes = state.routes;
  const left = routes.slice(0, 2);
  const right = routes.slice(2, 4);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.card,
        paddingBottom: insets.bottom || 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: colors.hairline,
      }}
    >
      {left.map((route, i) => (
        <TabItem
          key={route.key}
          label={route.name}
          focused={state.index === i}
          onPress={() => navigation.navigate(route.name)}
        />
      ))}

      <View style={{ width: 64, alignItems: "center" }}>
        <Pressable
          onPress={() => setQuickLogOpen(true)}
          style={{
            position: "absolute",
            bottom: 14,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.orange,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#FF7E1D",
            shadowOpacity: 0.35,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 8 },
            elevation: 6,
          }}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      </View>

      {right.map((route, i) => (
        <TabItem
          key={route.key}
          label={route.name}
          focused={state.index === i + 2}
          onPress={() => navigation.navigate(route.name)}
        />
      ))}
    </View>
  );
}
