import { Ctx, steps, visibleFields, visibleSteps } from "../questionnaire";
import { emptyAnswers, QuestionnaireAnswers } from "../../services/questionnaire";

const ctx = (a: Partial<QuestionnaireAnswers>, age: number | null = 34): Ctx => ({
  a: { ...emptyAnswers(), ...a },
  firstName: "Priya",
  age,
});
const keys = (c: Ctx, askSex = false) => visibleSteps(c, askSex).map((s) => s.key);
const options = (c: Ctx, stepKey: string, field: string) => {
  const f = steps.find((s) => s.key === stepKey)!.fields.find((x) => x.field === field)!;
  return f.type === "choice" ? f.options.filter((o) => !o.when || o.when(c)).map((o) => o.id) : [];
};

test("sex is asked only when registration didn't say", () => {
  expect(keys(ctx({ sex: "male" }), false)).not.toContain("sex");
  expect(keys(ctx({}), true)[0]).toBe("sex");
});

test("men never see women's health questions or women-only goals", () => {
  const male = ctx({ sex: "male", programNeed: "weight_loss" });
  expect(keys(male).filter((k) => ["pregnant", "pregnancy", "pregnancyCare", "cycle", "children"].includes(k))).toEqual([]);
  expect(options(male, "need", "programNeed")).not.toContain("pregnancy");
  expect(options(male, "need", "programNeed")).not.toContain("pcod");
  expect(options(male, "medical", "medicalConditions")).not.toContain("pcod");
});

test("pregnancy details replace period questions for a pregnant woman", () => {
  const pregnant = keys(ctx({ sex: "female", currentlyPregnant: true }));
  expect(pregnant).toEqual(expect.arrayContaining(["pregnancy", "pregnancyCare"]));
  expect(pregnant).not.toContain("cycle");
  const notPregnant = keys(ctx({ sex: "female", currentlyPregnant: false }));
  expect(notPregnant).toContain("cycle");
  expect(notPregnant).not.toContain("pregnancy");
});

test("menopause is only offered from 35", () => {
  expect(options(ctx({ sex: "female" }, 28), "cycle", "cycleRegularity")).not.toContain("menopause");
  expect(options(ctx({ sex: "female" }, 50), "cycle", "cycleRegularity")).toContain("menopause");
});

test("minors skip habits and pregnancy questions", () => {
  const teen = keys(ctx({ sex: "female", programNeed: "child" }, 14));
  expect(teen).not.toContain("addictions");
  expect(teen).not.toContain("pregnant");
  expect(teen).toContain("cycle");
});

test("the weight story is only for weight-management goals", () => {
  expect(keys(ctx({ sex: "female", programNeed: "post_pregnancy" }))).toContain("weightWhy");
  expect(keys(ctx({ sex: "female", programNeed: "pcod" }))).not.toContain("weightWhy");
  expect(keys(ctx({ sex: "female", programNeed: "pregnancy" }))).not.toContain("weightPast");
});

test("follow-ups appear only after the answer that calls for them", () => {
  expect(keys(ctx({ sex: "male" }))).not.toContain("alcohol");
  expect(keys(ctx({ sex: "male", addictions: ["alcohol"] }))).toContain("alcohol");
  expect(keys(ctx({ sex: "male", exercises: false }))).not.toContain("exerciseKind");

  const surgery = steps.find((s) => s.key === "surgery")!;
  expect(visibleFields(surgery, ctx({ hadSurgery: false })).map((f) => f.field)).toEqual(["hadSurgery"]);
  expect(visibleFields(surgery, ctx({ hadSurgery: true })).map((f) => f.field)).toContain("surgeryProcedure");
});
