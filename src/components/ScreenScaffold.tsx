import React from "react";
import { View, ScrollView, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import ScreenFade from "./ScreenFade";

export default function ScreenScaffold({
  children,
  header,
  footer,
  scroll = true,
  bg = colors.cream,
  edges = ["top", "bottom"],
  contentStyle,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  scroll?: boolean;
  bg?: string;
  edges?: ("top" | "bottom" | "left" | "right")[];
  contentStyle?: ViewStyle;
}) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={edges}>
      <ScreenFade>
        {header && <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>{header}</View>}
        {scroll ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              { paddingHorizontal: 20, paddingBottom: footer ? 8 : 24, paddingTop: header ? 8 : 16 },
              contentStyle,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1, paddingHorizontal: 20 }, contentStyle]}>{children}</View>
        )}
        {footer && (
          <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14, gap: 10 }}>{footer}</View>
        )}
      </ScreenFade>
    </SafeAreaView>
  );
}
