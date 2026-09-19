export type IntakeFieldType =
  | "text"
  | "heightWeight"
  | "chips"
  | "textarea"
  | "mealTable"
  | "yesNoRows"
  | "twoField";

export interface IntakeStep {
  key: string;
  section: string;
  heading: string;
  help: string;
  type: IntakeFieldType;
  field?: string;
  placeholder?: string;
  opts?: string[];
  multi?: boolean;
  rows?: string[];
  placeholders?: [string, string];
}

export const intakeSteps: IntakeStep[] = [
  {
    key: "name",
    section: "About you",
    heading: "What should Dr. Kanika call you?",
    help: "Your plan is written by hand, with your name on it.",
    type: "text",
    field: "name",
    placeholder: "Priya Sharma",
  },
  {
    key: "age",
    section: "About you",
    heading: "How old are you?",
    help: "Age changes protein targets and how much recovery we programme.",
    type: "text",
    field: "age",
    placeholder: "34",
  },
  {
    key: "heightWeight",
    section: "About you",
    heading: "Height and weight today",
    help: "Empty stomach, bare feet, same scale every time.",
    type: "heightWeight",
  },
  {
    key: "life",
    section: "About you",
    heading: "How does your day usually go?",
    help: "",
    type: "chips",
    field: "life",
    opts: ["Mostly seated", "On my feet", "Mixed"],
  },
  {
    key: "diet",
    section: "Food",
    heading: "What do you eat?",
    help: "",
    type: "chips",
    field: "diet",
    opts: ["Vegetarian", "Eggitarian", "Non-vegetarian", "Vegan"],
  },
  {
    key: "allergy",
    section: "Food",
    heading: "Anything you cannot or will not eat?",
    help: "Allergies, intolerances and hard dislikes all count.",
    type: "textarea",
    field: "allergy",
    placeholder: "Lactose, peanuts, brinjal, nothing…",
  },
  {
    key: "meals",
    section: "Food",
    heading: "What does a normal day of eating look like?",
    help: "",
    type: "mealTable",
    rows: ["Breakfast", "Lunch", "Evening", "Dinner"],
  },
  {
    key: "med",
    section: "Health",
    heading: "Any medical history we should build around?",
    help: "Include medication and the time you take it.",
    type: "textarea",
    field: "med",
    placeholder: "Hypothyroidism since 2019, Thyronorm 50 mcg each morning…",
  },
  {
    key: "family",
    section: "Health",
    heading: "Family history",
    help: "",
    type: "yesNoRows",
    rows: ["Obesity", "Thyroid", "Diabetes", "High blood pressure", "Heart disease"],
  },
  {
    key: "cycle",
    section: "Health",
    heading: "Is your cycle regular?",
    help: "",
    type: "chips",
    field: "cycle",
    opts: ["Regular", "Irregular", "Not applicable"],
  },
  {
    key: "dur",
    section: "Movement",
    heading: "How much movement can you commit to daily?",
    help: "",
    type: "chips",
    field: "dur",
    opts: ["10 minutes", "20 minutes", "30 minutes", "45 minutes or more"],
  },
  {
    key: "limits",
    section: "Movement",
    heading: "Anything that hurts?",
    help: "We programme around pain rather than through it.",
    type: "chips",
    field: "limits",
    multi: true,
    opts: ["Nothing", "Low back", "Knees", "Shoulder", "Neck", "Ankle"],
  },
  {
    key: "sleepWake",
    section: "Rest & goals",
    heading: "When do you sleep and wake?",
    help: "Your wind-down routine is built from these two times.",
    type: "twoField",
    placeholders: ["11:30 pm", "6:15 am"],
  },
  {
    key: "why",
    section: "Rest & goals",
    heading: "Why now?",
    help: "Dr. Kanika reads this line before she writes anything else.",
    type: "textarea",
    field: "why",
    placeholder: "Energy through the workday, family history of diabetes…",
  },
];
