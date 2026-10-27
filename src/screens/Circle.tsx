import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import { BackButton, Body, Card, Heading, ProgressBar } from "../components/Primitives";
import ResourceState from "../components/ResourceState";
import { postCircleMessage, useCircle } from "../services/circle";
import { userMessage } from "../services/http";
import { initialsOf } from "../services/user";
import { useAppState } from "../state/AppState";
import { useAuth } from "../state/Auth";

export default function Circle() {
  const { toast } = useAppState();
  const { user } = useAuth();
  const circle = useCircle();
  const [text, setText] = useState("");

  const send = async () => {
    const message = text.trim();
    if (!message) return;
    try {
      await postCircleMessage(message, { name: "You", initials: user ? initialsOf(user.fullName) : "" });
      setText("");
    } catch (e) {
      toast.show(userMessage(e));
    }
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

      {!circle.data ? (
        <ResourceState resource={circle} />
      ) : (
        <>
          <Card bg={colors.lilac} style={{ marginBottom: 14 }}>
            <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: colors.lilacInk, marginBottom: 6 }}>
              {circle.data.challenge.label}
            </Text>
            <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 18, color: colors.ink, marginBottom: 6 }}>
              {circle.data.challenge.title}
            </Text>
            <Body color={colors.lilacInk} size={13} style={{ marginBottom: 12 }}>
              {circle.data.challenge.detail}
            </Body>
            <ProgressBar progress={circle.data.challenge.progress} color={colors.lilacStrong} track="#FFFFFF" />
            <View style={{ flexDirection: "row", marginTop: 16 }}>
              {circle.data.members.map((m, i) => (
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
              {circle.data.contribution.days} days
            </Text>
            <Body color={colors.ink} size={14}>
              {circle.data.contribution.note}
            </Body>
          </Card>

          <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: colors.muted, marginBottom: 10 }}>
            Board
          </Text>
          <View style={{ gap: 14 }}>
            {circle.data.messages.map((m) => (
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
        </>
      )}
    </ScreenScaffold>
  );
}
