import React, { useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import PillButton from "../components/PillButton";
import AccountButton from "../components/AccountButton";
import ResourceState from "../components/ResourceState";
import { BackButton, Body, Heading } from "../components/Primitives";
import { FieldView } from "../components/questionnaire/Fields";
import { Ctx, getPath, isBlank, sections, setPath, Step, visibleFields, visibleSteps } from "../data/questionnaire";
import {
  isWeightManagement,
  ProgramNeed,
  QuestionnaireAnswers,
  QuestionnaireState,
  saveQuestionnaire,
  submitQuestionnaire,
  useQuestionnaire,
} from "../services/questionnaire";
import { useProgrammeStatus } from "../services/journey";
import { userMessage } from "../services/http";
import { useAuth } from "../state/Auth";
import { useAppState } from "../state/AppState";
import { RootNav } from "../navigation/types";

/** Bought programme → the "Need program for" answer we start from. */
const NEED_FOR_PROGRAMME: Record<string, { need: ProgramNeed; detail?: string }> = {
  reset360: { need: "weight_loss" },
  pcos: { need: "pcod" },
  prenatal: { need: "pregnancy" },
  postpartum: { need: "post_pregnancy" },
  thyroid: { need: "medical", detail: "Thyroid" },
  posture: { need: "medical", detail: "Posture and pain" },
};

function ageFrom(dob: string | undefined): number | null {
  if (!dob) return null;
  const born = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  const had = now.getMonth() > born.getMonth() || (now.getMonth() === born.getMonth() && now.getDate() >= born.getDate());
  return now.getFullYear() - born.getFullYear() - (had ? 0 : 1);
}

/** Answers that follow from others, so the member doesn't have to say them twice. */
function withDerived(a: QuestionnaireAnswers, changed: string): QuestionnaireAnswers {
  let next = a;
  if (changed === "programNeed") {
    if (!a.target) next = { ...next, target: isWeightManagement(a) ? "three_month_weight" : "one_time_health" };
    if (a.programNeed === "pregnancy" && a.currentlyPregnant == null) next = { ...next, currentlyPregnant: true };
  }
  return next;
}

export default function Questionnaire() {
  const resource = useQuestionnaire();
  if (!resource.data) {
    return (
      <ScreenScaffold header={<View style={{ alignItems: "flex-end" }}><AccountButton /></View>}>
        <ResourceState resource={resource} minHeight={300} />
      </ScreenScaffold>
    );
  }
  return <Form initial={resource.data} />;
}

function Form({ initial }: { initial: QuestionnaireState }) {
  const navigation = useNavigation<RootNav>();
  const { user } = useAuth();
  const { update, toast } = useAppState();
  const programme = useProgrammeStatus().data;
  const editing = !!initial.submittedAt;

  // Sex given at registration isn't asked again.
  const registeredSex = user?.gender === "female" || user?.gender === "male" ? user.gender : null;
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(() => {
    let a = initial.answers;
    if (!a.sex && registeredSex) a = { ...a, sex: registeredSex };
    const fromProgramme = programme?.programmeId ? NEED_FOR_PROGRAMME[programme.programmeId] : undefined;
    if (!a.programNeed && fromProgramme) {
      a = { ...a, programNeed: fromProgramme.need, programNeedDetail: a.programNeedDetail || fromProgramme.detail || "" };
      a = withDerived(a, "programNeed");
    }
    return a;
  });

  const ctx: Ctx = { a: answers, firstName: user?.firstName ?? "there", age: ageFrom(user?.dateOfBirth) };
  const askSex = !registeredSex;
  const list = visibleSteps(ctx, askSex);

  // Resume at the first step with nothing answered yet.
  const [stepKey, setStepKey] = useState<string>(() => {
    if (editing) return list[0].key;
    const fresh = list.find((s) => s.key !== "photos" && visibleFields(s, ctx).every((f) => isBlank(getPath(answers, f.field))));
    return (fresh ?? list[list.length - 1]).key;
  });
  const index = Math.max(0, list.findIndex((s) => s.key === stepKey));
  const step = list[index];
  const fields = visibleFields(step, ctx);
  const isLast = index === list.length - 1;

  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [submitting, setSubmitting] = useState(false);
  const autoAdvance = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (autoAdvance.current) clearTimeout(autoAdvance.current);
  }, []);

  // Re-read after every upload, so going back to the photo step shows what was saved.
  const photos = initial.photos;
  const missing = (step.required ?? []).filter((f) => isBlank(getPath(answers, f)));
  // Composite fields store their answers under other keys than their own `field`.
  const answeredHere = fields.some((f) =>
    f.type === "photos"
      ? photos.length > 0
      : f.type === "heightWeight"
        ? answers.heightCm != null || answers.weightKg != null
        : f.type !== "notice" && !isBlank(getPath(answers, f.field))
  );

  const save = (a: QuestionnaireAnswers) => {
    setSaving("saving");
    saveQuestionnaire(a).then(
      () => setSaving("saved"),
      () => setSaving("failed")
    );
  };

  const goTo = (i: number) => setStepKey(list[Math.min(Math.max(i, 0), list.length - 1)].key);

  const next = async (a = answers) => {
    if (autoAdvance.current) clearTimeout(autoAdvance.current);
    if (!isLast) {
      save(a);
      // Recompute against the latest answers: a choice on this step can add or remove later steps.
      const nextList = visibleSteps({ ...ctx, a }, askSex);
      const at = nextList.findIndex((s) => s.key === step.key);
      setStepKey(nextList[Math.min(at + 1, nextList.length - 1)].key);
      return;
    }
    setSubmitting(true);
    try {
      await submitQuestionnaire(a);
    } catch (e) {
      toast.show(userMessage(e));
      setSubmitting(false);
      return;
    }
    if (a.sex) update({ gender: a.sex });
    toast.show(editing ? "Your answers are updated" : "Sent to Dr. Kanika. Thank you!");
    if (editing) {
      setSubmitting(false);
      if (navigation.canGoBack()) navigation.goBack();
    } else {
      // Submitting swaps the questionnaire navigator for the app, which opens on Today: it says
      // the plan is being prepared (and, for weight goals, offers the first measurements).
      update({ afterQuestionnaire: "MainTabs" });
    }
  };

  const set = (path: string, value: unknown) => {
    const a = withDerived(setPath(answers, path, value), path);
    setAnswers(a);
    // A single tap answer moves straight on, unless it opened a follow-up on the same screen.
    const only = step.fields.length === 1 && step.fields[0].type === "choice" && !step.fields[0].multi;
    if (only && value != null && !isLast) {
      if (autoAdvance.current) clearTimeout(autoAdvance.current);
      autoAdvance.current = setTimeout(() => void next(a), 320);
    }
  };

  const section = sections.find((s) => s.id === step.section)!;
  const inSection = list.filter((s) => s.section === step.section);
  const sectionIds = useMemo(() => [...new Set(list.map((s) => s.section))], [list]);
  const minutesLeft = Math.max(1, Math.round(((list.length - index) * 25) / 60));

  return (
    <ScreenScaffold
      header={
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            {index > 0 || editing ? (
              <BackButton onPress={() => (index > 0 ? goTo(index - 1) : navigation.goBack())} />
            ) : (
              <View style={{ width: 38 }} />
            )}
            <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 12, color: saving === "failed" ? colors.coralInk : colors.muted }}>
              {saving === "saving" ? "Saving…" : saving === "failed" ? "Not saved, will retry" : saving === "saved" ? "Progress saved" : `About ${minutesLeft} min left`}
            </Text>
            <AccountButton />
          </View>
          {/* One segment per section; the current one fills as you go. */}
          <View style={{ flexDirection: "row", gap: 4 }}>
            {sectionIds.map((id) => {
              const sIdx = sectionIds.indexOf(id);
              const cur = sectionIds.indexOf(step.section);
              const steps = list.filter((s) => s.section === id);
              const fill = sIdx < cur ? 1 : sIdx > cur ? 0 : (steps.findIndex((s) => s.key === step.key) + 1) / steps.length;
              const sec = sections.find((s) => s.id === id)!;
              return (
                <View key={id} style={{ flex: steps.length, height: 6, borderRadius: 3, backgroundColor: colors.hairline, overflow: "hidden" }}>
                  <View style={{ width: `${fill * 100}%`, height: "100%", backgroundColor: sec.ink }} />
                </View>
              );
            })}
          </View>
        </View>
      }
      footer={
        <View style={{ gap: 8 }}>
          {missing.length > 0 && (
            <Text style={{ textAlign: "center", fontFamily: "Nunito_600SemiBold", fontSize: 12, color: colors.muted }}>
              {"This one's needed to write your plan"}
            </Text>
          )}
          <PillButton
            label={isLast ? (editing ? "Save changes" : "Send to Dr. Kanika") : answeredHere || missing.length ? "Continue" : "Skip for now"}
            variant={!isLast && !answeredHere && !missing.length ? "secondary" : "primary"}
            glow={isLast || answeredHere}
            disabled={missing.length > 0}
            loading={submitting}
            onPress={() => void next()}
          />
        </View>
      }
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: section.tint, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 }}>
          <Ionicons name={section.icon as never} size={14} color={section.ink} />
          <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 12, color: section.ink, letterSpacing: 0.4 }}>{section.title.toUpperCase()}</Text>
        </View>
        {inSection.length > 1 && (
          <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 12, color: colors.muted }}>
            {inSection.findIndex((s) => s.key === step.key) + 1} of {inSection.length}
          </Text>
        )}
      </View>
      <Heading size={23}>{step.heading(ctx)}</Heading>
      {step.help ? <Body style={{ marginTop: 8, marginBottom: 20 }}>{step.help}</Body> : <View style={{ height: 20 }} />}
      {fields.map((f, i) => (
        <FieldView key={`${step.key}-${f.field}-${i}`} field={f} ctx={ctx} set={set} photos={photos} />
      ))}
      {isLast && !editing && <Recap steps={list} ctx={ctx} />}
    </ScreenScaffold>
  );
}

/** Shown on the last screen: how much was answered, so a member can go back before sending. */
function Recap({ steps, ctx }: { steps: Step[]; ctx: Ctx }) {
  const answerable = steps.filter((s) => s.key !== "photos");
  const answered = answerable.filter((s) => visibleFields(s, ctx).some((f) => !isBlank(getPath(ctx.a, f.field)))).length;
  return (
    <View style={{ marginTop: 4, backgroundColor: colors.card, borderRadius: 16, padding: 16, flexDirection: "row", gap: 12, alignItems: "center" }}>
      <Ionicons name="checkmark-done-circle" size={28} color={colors.sageInk} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 14, color: colors.ink }}>
          {answered} of {answerable.length} sections answered
        </Text>
        <Body size={13} color={colors.muted}>
          {"Dr. Kanika's team reads every answer before writing your plan. You can change them later from your profile."}
        </Body>
      </View>
    </View>
  );
}
