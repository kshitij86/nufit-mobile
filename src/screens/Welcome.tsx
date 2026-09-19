import React from "react";
import { View, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import PillButton from "../components/PillButton";
import { Eyebrow, Heading, Body } from "../components/Primitives";
import { RootNav } from "../navigation/types";

export default function Welcome() {
  const navigation = useNavigation<RootNav>();

  return (
    <ScreenScaffold
      footer={
        <>
          <PillButton label="Find my programme" onPress={() => navigation.navigate("Quiz")} />
          <PillButton
            label="I already have an account"
            variant="outline"
            onPress={() => navigation.navigate("Mood")}
          />
        </>
      }
    >
      <View
        style={{
          height: 300,
          borderRadius: 28,
          backgroundColor: colors.orangeTint,
          marginTop: 12,
          marginBottom: 24,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <View
          style={{
            position: "absolute",
            width: 180,
            height: 180,
            borderRadius: 90,
            backgroundColor: "#FFDDB8",
            top: 40,
            left: 40,
          }}
        />
        <View
          style={{
            position: "absolute",
            width: 140,
            height: 140,
            borderRadius: 70,
            backgroundColor: colors.orange,
            opacity: 0.85,
            bottom: 36,
            right: 50,
          }}
        />
        <Text
          style={{
            position: "absolute",
            bottom: 16,
            color: "#B4703A",
            fontFamily: "Nunito_800ExtraBold",
            fontSize: 11,
            letterSpacing: 1,
          }}
        >
          ILLUSTRATION — MORNING RITUAL
        </Text>
      </View>

      <Eyebrow>Holistic · clinical · yours</Eyebrow>
      <Heading size={32}>Start where your body actually is today.</Heading>
      <Body style={{ marginTop: 14 }}>
        Nufit asks how you feel before it tells you what to do. Dr. Kanika writes the plan; the app adapts the
        day around you.
      </Body>
    </ScreenScaffold>
  );
}
