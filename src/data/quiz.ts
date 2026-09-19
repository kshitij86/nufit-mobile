import { QuizQuestion } from "../types";

export const quizQuestions: QuizQuestion[] = [
  {
    id: "goals",
    q: "What brings you to Nufit?",
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
  {
    id: "checkin",
    q: "When should the app check in?",
    help: "One check-in a day. You can change it later.",
    multi: false,
    opts: ["Early morning", "Mid-morning", "Evening", "Before bed"],
  },
];

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
