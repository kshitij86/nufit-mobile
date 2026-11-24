import { QuizQuestion } from "../types";

export const quizQuestions: QuizQuestion[] = [
  {
    id: "goals",
    q: "What brings you to 360° Fitness?",
    help: "Pick everything that applies — it decides which track you start from.",
    multi: true,
    opts: [
      "Lose weight",
      "PCOS or hormones",
      "Pregnancy",
      "Postpartum recovery",
      "Thyroid or metabolic",
      "Pain and posture",
    ],
  },
  {
    id: "stage",
    q: "Where are you right now?",
    help: "Life stage changes what is safe to programme.",
    multi: false,
    opts: [
      "No specific condition",
      "Trying to conceive",
      "Pregnant",
      "Under a year postpartum",
      "Perimenopause",
    ],
  },
  {
    id: "time",
    q: "How much movement fits a normal day?",
    help: "Be realistic. We would rather write 15 honest minutes than 45 aspirational ones.",
    multi: false,
    opts: ["10 minutes", "20 minutes", "30 minutes", "45 minutes or more"],
  },
  {
    id: "blockers",
    q: "What usually gets in the way?",
    help: "This is what the daily nudges are built around.",
    multi: true,
    opts: [
      "Evening hunger",
      "No time",
      "Travel",
      "Pain",
      "Poor sleep",
      "Losing motivation",
    ],
  },
];

// Can't apply to a man: hidden when registration says the user is male.
const FEMALE_ONLY_QUESTIONS = new Set(["stage"]);
const FEMALE_ONLY_OPTIONS = new Set(["PCOS or hormones", "Pregnancy", "Postpartum recovery"]);

/** The questions to ask. Only "male" hides anything; any other or unknown gender sees them all. */
export function quizQuestionsFor(gender: string | null | undefined): QuizQuestion[] {
  if (gender !== "male") return quizQuestions;
  return quizQuestions
    .filter((question) => !FEMALE_ONLY_QUESTIONS.has(question.id))
    .map((question) => ({ ...question, opts: question.opts.filter((opt) => !FEMALE_ONLY_OPTIONS.has(opt)) }));
}

/** Keeps only answers to `questions` that are still among their options, so nothing hidden is sent. */
export function visibleAnswers(
  questions: QuizQuestion[],
  answers: Record<string, string[]>
): Record<string, string[]> {
  const visible: Record<string, string[]> = {};
  for (const question of questions) {
    const picked = (answers[question.id] ?? []).filter((opt) => question.opts.includes(opt));
    if (picked.length) visible[question.id] = picked;
  }
  return visible;
}

const goalToProgramme: Record<string, string> = {
  "PCOS or hormones": "pcos",
  Pregnancy: "prenatal",
  "Postpartum recovery": "postpartum",
  "Thyroid or metabolic": "thyroid",
  "Pain and posture": "posture",
};

export function programmeFromGoals(goals: string[]): string {
  for (const goal of goals) {
    if (goalToProgramme[goal]) return goalToProgramme[goal];
  }
  return "reset360";
}
