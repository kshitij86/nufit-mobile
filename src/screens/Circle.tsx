import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import { BackButton, Body, Card, Heading, ProgressBar } from "../components/Primitives";
import { circleMembers } from "../data/circle";
import { useAppState } from "../state/AppState";

export default function Circle() {
  const { data, postCircleMessage } = useAppState();
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    postCircleMessage(text.trim());
    setText("");
  };

  return (
    <ScreenScaffold
      header={<BackButton />}
      footer={
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Share something with the circle…"
            placeholderTextColor={colors.faint}
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 999,
              paddingVertical: 12,
              paddingHorizontal: 16,
              fontFamily: "Nunito_600SemiBold",
              fontSize: 14,
              color: colors.ink,
              borderWidth: 1.5,
              borderColor: colors.hairline,
            }}
          />
          <Pressable
            onPress={send}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      }
    >
      <Heading size={24}>Your circle</Heading>
      <Body style={{ marginTop: 8, marginBottom: 18 }}>
        Eight women on the same programme month. No ranks, no comparisons — one shared goal.
      </Body>

      <Card bg={colors.lilac} style={{ marginBottom: 14 }}>
        <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: colors.lilacInk, marginBottom: 6 }}>
          August challenge
        </Text>
        <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 18, color: colors.ink, marginBottom: 6 }}>
          20 movement days, together
        </Text>
        <Body color={colors.lilacInk} size={13} style={{ marginBottom: 12 }}>
          142 of 200 days logged by the group
        </Body>
        <ProgressBar progress={0.71} color={colors.lilacStrong} track="#FFFFFF" />
        <View style={{ flexDirection: "row", marginTop: 16 }}>
          {circleMembers.map((m, i) => (
            <View
              key={m.initials}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: m.tint,
                alignItems: "center",
                justifyContent: "center",
                marginLeft: i === 0 ? 0 : -10,
                borderWidth: 2,
                borderColor: colors.lilac,
              }}
            >
              <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 11, color: colors.ink }}>{m.initials}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 12, color: colors.muted, marginBottom: 6 }}>
          Your contribution
        </Text>
        <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 22, color: colors.ink, marginBottom: 6 }}>
          18 days
        </Text>
        <Body color={colors.ink} size={14}>
          You have not missed two days in a row all month. That consistency is the whole point.
        </Body>
      </Card>

      <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: colors.muted, marginBottom: 10 }}>
        Board
      </Text>
      <View style={{ gap: 14 }}>
        {data.circleMessages.map((m) => (
          <View key={m.id} style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: m.tint, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 12, color: colors.ink }}>{m.initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 13, color: colors.ink }}>{m.name}</Text>
                <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 11, color: colors.muted }}>{m.time}</Text>
              </View>
              <Body color={colors.ink} size={13} style={{ marginTop: 4 }}>{m.text}</Body>
            </View>
          </View>
        ))}
      </View>
    </ScreenScaffold>
  );
}
