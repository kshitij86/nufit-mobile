import { programmeFromGoals, quizQuestions, quizQuestionsFor, visibleAnswers } from "../quiz";

const ids = (questions: { id: string }[]) => questions.map((q) => q.id);

describe("quizQuestionsFor", () => {
  it("skips the life-stage question and female-only goals for men", () => {
    const questions = quizQuestionsFor("male");
    expect(ids(questions)).not.toContain("stage");
    expect(questions.find((q) => q.id === "goals")!.opts).toEqual([
      "Lose weight",
      "Thyroid or metabolic",
      "Pain and posture",
    ]);
  });

  it.each(["female", "non_binary", "prefer_not_to_say", null, undefined])("asks everything for %p", (gender) => {
    expect(quizQuestionsFor(gender)).toBe(quizQuestions);
  });

  it("no longer asks when the app should check in", () => {
    expect(ids(quizQuestions)).not.toContain("checkin");
  });
});

describe("visibleAnswers", () => {
  it("drops answers to hidden questions and options", () => {
    const answers = { goals: ["Pregnancy", "Lose weight"], stage: ["Pregnant"], time: ["20 minutes"] };
    const visible = visibleAnswers(quizQuestionsFor("male"), answers);
    expect(visible).toEqual({ goals: ["Lose weight"], time: ["20 minutes"] });
    expect(programmeFromGoals(visible.goals)).toBe("reset360");
  });
});
