import React, { useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import PillButton from "../components/PillButton";
import AccountButton from "../components/AccountButton";
import { BackButton, Body, Heading, ProgressBar } from "../components/Primitives";
import { quizQuestionsFor, visibleAnswers } from "../data/quiz";
import { userMessage } from "../services/http";
import { submitQuizAnswers } from "../services/quiz";
import { useAppState } from "../state/AppState";
import { useAuth } from "../state/Auth";
import { RootNav } from "../navigation/types";

export default function Quiz() {
  const navigation = useNavigation<RootNav>();
  const { data, setQuizAnswer, update, toast } = useAppState();
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  // Registration's gender, else the one the questionnaire recorded.
  const quizQuestions = useMemo(() => quizQuestionsFor(user?.gender ?? data.gender), [user?.gender, data.gender]);

  // The profile can load mid-quiz and drop a question, so keep the index in range.
  const position = Math.min(index, quizQuestions.length - 1);
  const question = quizQuestions[position];
  const selected = data.quizAnswers[question.id] ?? [];

  const toggleOption = (opt: string) => {
    if (question.multi) {
      const next = selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt];
      setQuizAnswer(question.id, next);
    } else {
      setQuizAnswer(question.id, [opt]);
    }
  };

  const isLast = position === quizQuestions.length - 1;
  const canContinue = selected.length > 0;

  const onContinue = async () => {
    if (!isLast) {
      setIndex(position + 1);
      return;
    }
    setSubmitting(true);
    let match;
    try {
      match = await submitQuizAnswers(visibleAnswers(quizQuestions, data.quizAnswers));
    } catch (e) {
      toast.show(userMessage(e));
      return;
    } finally {
      setSubmitting(false);
    }
    update({ programmeId: match.programmeId });
    navigation.navigate("Match");
  };

  const onBack = () => {
    if (position === 0) navigation.goBack();
    else setIndex(position - 1);
  };

  return (
    <ScreenScaffold
      header={
        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <BackButton onPress={onBack} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Text style={{ fontFamily: "Nunito_700Bold", color: colors.muted, fontSize: 13 }}>
                {position + 1}/{quizQuestions.length}
              </Text>
              <AccountButton />
            </View>
          </View>
          <ProgressBar progress={(position + 1) / quizQuestions.length} />
        </View>
      }
      footer={
        <PillButton
          label={isLast ? "See my match" : "Continue"}
          onPress={onContinue}
          disabled={!canContinue}
          loading={submitting}
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
                borderColor: isSelected ? colors.rose : colors.hairline,
                backgroundColor: isSelected ? colors.blushTint : colors.card,
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  borderWidth: isSelected ? 0 : 1.5,
                  borderColor: colors.faint,
                  backgroundColor: isSelected ? colors.rose : "transparent",
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
