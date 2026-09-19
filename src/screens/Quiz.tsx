import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import PillButton from "../components/PillButton";
import { BackButton, Body, Heading, ProgressBar } from "../components/Primitives";
import { quizQuestions, programmeFromGoals } from "../data/quiz";
import { useAppState } from "../state/AppState";
import { RootNav } from "../navigation/types";

export default function Quiz() {
  const navigation = useNavigation<RootNav>();
  const { data, setQuizAnswer, update } = useAppState();
  const [index, setIndex] = useState(0);

  const question = quizQuestions[index];
  const selected = data.quizAnswers[question.id] ?? [];

  const toggleOption = (opt: string) => {
    if (question.multi) {
      const next = selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt];
      setQuizAnswer(question.id, next);
    } else {
      setQuizAnswer(question.id, [opt]);
    }
  };

  const isLast = index === quizQuestions.length - 1;
  const canContinue = selected.length > 0;

  const onContinue = () => {
    if (isLast) {
      const goals = data.quizAnswers.goals ?? [];
      update({ programmeId: programmeFromGoals(goals) });
      navigation.navigate("Match");
    } else {
      setIndex(index + 1);
    }
  };

  const onBack = () => {
    if (index === 0) navigation.goBack();
    else setIndex(index - 1);
  };

  return (
    <ScreenScaffold
      header={
        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <BackButton onPress={onBack} />
            <Text style={{ fontFamily: "Nunito_700Bold", color: colors.muted, fontSize: 13 }}>
              {index + 1}/{quizQuestions.length}
            </Text>
          </View>
          <ProgressBar progress={(index + 1) / quizQuestions.length} />
        </View>
      }
      footer={
        <PillButton
          label={isLast ? "See my match" : "Continue"}
          onPress={onContinue}
          disabled={!canContinue}
        />
      }
    >
      <Heading size={26}>{question.q}</Heading>
      <Body style={{ marginTop: 10, marginBottom: 20 }}>{question.help}</Body>

      <View style={{ gap: 10 }}>
        {question.opts.map((opt) => {
          const isSelected = selected.includes(opt);
          return (
            <Pressable
              key={opt}
              onPress={() => toggleOption(opt)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 16,
                paddingHorizontal: 16,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: isSelected ? colors.orange : colors.hairline,
                backgroundColor: isSelected ? colors.orangeTint : colors.card,
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  borderWidth: isSelected ? 0 : 1.5,
                  borderColor: colors.faint,
                  backgroundColor: isSelected ? colors.orange : "transparent",
                  marginRight: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isSelected && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" }} />}
              </View>
              <Text
                style={{
                  fontFamily: isSelected ? "Nunito_700Bold" : "Nunito_600SemiBold",
                  color: colors.ink,
                  fontSize: 15,
                  flex: 1,
                }}
              >
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScreenScaffold>
  );
}
