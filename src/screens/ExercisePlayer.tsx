import React, { useRef, useState } from "react";
import { View, Text, Pressable, Image, ScrollView } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEventListener } from "expo";
import { useVideoPlayer, VideoView, type VideoPlayer } from "expo-video";
import { colors } from "../theme/colors";
import { cueAt, languageLabel, useCaptions } from "../services/captions";
import { RootStackParamList, RootNav } from "../navigation/types";

/** The player is a native object driven imperatively; keeping writes here keeps them out of render. */
function resume(player: VideoPlayer, at: number, play: boolean) {
  player.currentTime = at;
  if (play) player.play();
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: selected ? colors.rose : colors.blushTint,
      }}
    >
      <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 13, color: selected ? colors.roseInk : colors.roseText }}>
        {label}
      </Text>
    </Pressable>
  );
}

function OptionRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 18 }}>
      <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 11, letterSpacing: 1, color: colors.muted, marginBottom: 8 }}>
        {title.toUpperCase()}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{children}</View>
    </View>
  );
}

/**
 * Plays one exercise's clip. The thumbnail shows until it's started. Audio switches between
 * the clip's language versions (whole files) at the same moment; captions are drawn over the
 * video from the chosen language's WebVTT file.
 */
export default function ExercisePlayer() {
  const navigation = useNavigation<RootNav>();
  const { name, cue, video } = useRoute<RouteProp<RootStackParamList, "ExercisePlayer">>().params;

  const [audio, setAudio] = useState(video.language);
  const [captionLang, setCaptionLang] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // Where to pick up after swapping to another language's file.
  const resumeAt = useRef<{ at: number; play: boolean } | null>(null);

  const player = useVideoPlayer({ uri: video.url }, (p) => {
    p.timeUpdateEventInterval = 0.25;
  });

  useEventListener(player, "timeUpdate", ({ currentTime }) => setTime(currentTime));
  useEventListener(player, "playingChange", ({ isPlaying }) => isPlaying && setStarted(true));
  useEventListener(player, "statusChange", ({ status }) => {
    if (status === "error") setError("This video couldn't play. Check your connection and try again.");
    if (status === "readyToPlay") {
      setError(null);
      const pending = resumeAt.current;
      if (pending) {
        resumeAt.current = null;
        resume(player, pending.at, pending.play);
      }
    }
  });

  const subtitleUrl = video.subtitles.find((s) => s.language === captionLang)?.url ?? null;
  const captions = useCaptions(subtitleUrl);
  const caption = subtitleUrl ? cueAt(captions.cues, time) : null;

  const start = () => {
    setStarted(true);
    player.play();
  };

  const switchAudio = (language: string) => {
    const next = video.audioVersions.find((a) => a.language === language);
    if (!next || language === audio) return;
    resumeAt.current = { at: player.currentTime, play: player.playing };
    setAudio(language);
    void player.replaceAsync({ uri: next.url });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, gap: 12 }}>
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityLabel="Close"
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.blushTint, alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="close" size={22} color={colors.roseText} />
          </Pressable>
          <Text numberOfLines={1} style={{ flex: 1, fontFamily: "Outfit_700Bold", fontSize: 18, color: colors.ink }}>
            {name}
          </Text>
        </View>

        <View style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000" }}>
          <VideoView
            player={player}
            style={{ width: "100%", height: "100%" }}
            contentFit="contain"
            nativeControls={started}
            fullscreenOptions={{ enable: false }}
            allowsPictureInPicture={false}
          />
          {caption && (
            <View pointerEvents="none" style={{ position: "absolute", left: 12, right: 12, bottom: 52, alignItems: "center" }}>
              <Text
                style={{
                  fontFamily: "Nunito_700Bold",
                  fontSize: 15,
                  lineHeight: 21,
                  color: "#fff",
                  textAlign: "center",
                  backgroundColor: "rgba(0,0,0,0.65)",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  overflow: "hidden",
                }}
              >
                {caption}
              </Text>
            </View>
          )}
          {!started && (
            <Pressable
              onPress={start}
              accessibilityRole="button"
              accessibilityLabel={`Play ${name}`}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}
            >
              {video.thumbnailUrl && (
                <Image source={{ uri: video.thumbnailUrl }} resizeMode="cover" style={{ position: "absolute", width: "100%", height: "100%" }} />
              )}
              <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: colors.rose, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="play" size={30} color={colors.roseInk} style={{ marginLeft: 4 }} />
              </View>
            </Pressable>
          )}
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {error && (
            <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 13, color: colors.coralInk, backgroundColor: colors.coral, padding: 10, borderRadius: 12, marginBottom: 6 }}>
              {error}
            </Text>
          )}
          {!!cue && (
            <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 14, lineHeight: 21, color: colors.secondary }}>{cue}</Text>
          )}

          {video.audioVersions.length > 1 && (
            <OptionRow title="Audio">
              {video.audioVersions.map((a) => (
                <Chip key={a.language} label={languageLabel(a.language)} selected={audio === a.language} onPress={() => switchAudio(a.language)} />
              ))}
            </OptionRow>
          )}

          <OptionRow title="Captions">
            {video.subtitles.length === 0 ? (
              <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 13, color: colors.muted }}>No captions for this video yet.</Text>
            ) : (
              <>
                <Chip label="Off" selected={captionLang === null} onPress={() => setCaptionLang(null)} />
                {video.subtitles.map((s) => (
                  <Chip key={s.language} label={languageLabel(s.language)} selected={captionLang === s.language} onPress={() => setCaptionLang(s.language)} />
                ))}
              </>
            )}
          </OptionRow>
          {captions.failed && (
            <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 12, color: colors.coralInk, marginTop: 8 }}>
              Couldn&apos;t load these captions. Try again in a moment.
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
