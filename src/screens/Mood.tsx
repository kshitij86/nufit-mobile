import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import PillButton from "../components/PillButton";
import { Body, Card, Eyebrow, Heading } from "../components/Primitives";
import { moodOptions, moodTags } from "../data/moods";
import { useAppState } from "../state/AppState";
import { RootNav } from "../navigation/types";
import { MoodId } from "../types";

export default function Mood() {
  const navigation = useNavigation<RootNav>();
  const { data, update, toast } = useAppState();

  const selected = data.mood;
  const selectedMood = moodOptions.find((m) => m.id === selected);

  const toggleTag = (tag: string) => {
    const has = data.moodTags.includes(tag);
    update({ moodTags: has ? data.moodTags.filter((t) => t !== tag) : [...data.moodTags, tag] });
  };

  const onSubmit = () => {
    toast.show("Today reshaped around how you feel");
    navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
  };

  return (
    <ScreenScaffold
      footer={
        <PillButton label="Shape my day" disabled={!selected} onPress={onSubmit} />
      }
    >
      <Eyebrow>Tuesday · Day 26</Eyebrow>
      <Heading size={24}>Before we plan the day — how are you, {data.profileName.split(" ")[0]}?</Heading>
      <Body style={{ marginTop: 10, marginBottom: 20 }}>
        Honest beats impressive. Today reshapes itself around this.
      </Body>

      <View style={{ gap: 10 }}>
        {moodOptions.map((mood) => {
          const isSelected = selected === mood.id;
          return (
            <Pressable
              key={mood.id}
              onPress={() => update({ mood: mood.id as MoodId })}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                padding: 14,
                borderRadius: 18,
                borderWidth: 1.5,
                borderColor: isSelected ? colors.orange : colors.hairline,
                backgroundColor: isSelected ? colors.orangeTint : colors.card,
              }}
            >
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: mood.dot }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 16, color: colors.ink }}>{mood.label}</Text>
                <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 13, color: colors.muted, marginTop: 2 }}>
                  {mood.sub}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {selectedMood && (
        <Card bg={selectedMood.bg} style={{ marginTop: 16 }}>
          <Body color={colors.ink} size={14}>{selectedMood.note}</Body>
        </Card>
      )}

      <Eyebrow color={colors.secondary}>
        Anything worth noting?
      </Eyebrow>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {moodTags.map((tag) => {
          const active = data.moodTags.includes(tag);
          return (
            <Pressable
              key={tag}
              onPress={() => toggleTag(tag)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: active ? colors.orange : colors.card,
                borderWidth: 1.5,
                borderColor: active ? colors.orange : colors.hairline,
              }}
            >
              <Text style={{ color: active ? "#fff" : colors.ink, fontFamily: "Nunito_700Bold", fontSize: 13 }}>
                {tag}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScreenScaffold>
  );
}
