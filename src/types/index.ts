export type ProgrammeId =
  | "reset360"
  | "pcos"
  | "prenatal"
  | "postpartum"
  | "thyroid"
  | "posture";

export interface Programme {
  id: ProgrammeId;
  name: string;
  category: string;
  weeksLabel: string;
  priceLabel: string;
  price: number;
  tintBg: string;
  tintInk: string;
  artLabel: string;
  blurb: string;
  includes: string[];
  stats: [string, string][];
}

export type MeasureSiteId =
  | "arm"
  | "waist"
  | "tummy"
  | "belowNavel"
  | "hip"
  | "thigh";

export interface MeasureSite {
  id: MeasureSiteId;
  name: string;
  cue: string;
  detail: string;
  region: "arm" | "torsoUpper" | "torsoMid" | "torsoLower" | "hip" | "thigh";
}

export interface SessionStep {
  name: string;
  cue: string;
  seconds: number;
}

export type SessionId = "strength" | "mobility" | "cardio" | "breath";

export interface Session {
  id: SessionId;
  name: string;
  kind: string;
  minutes: number;
  kit: string;
  tint: string;
  ink: string;
  ring: string;
  state: string;
  steps: SessionStep[];
}

export type MealSlot = "Breakfast" | "Lunch" | "Snack" | "Dinner";

export interface Recipe {
  id: string;
  name: string;
  slot: MealSlot;
  kcal: number;
  protein: number;
  minutes: number;
  tint: string;
  ink: string;
  ingredients: [string, string][];
  method: string[];
}

export interface QuizOption {
  label: string;
  goal?: string;
}

export interface QuizQuestion {
  id: string;
  q: string;
  help: string;
  opts: string[];
  multi: boolean;
}

export type MoodId = "energised" | "steady" | "flat" | "drained" | "unwell";

export interface MoodOption {
  id: MoodId;
  label: string;
  sub: string;
  dot: string;
  bg: string;
  note: string;
}

export interface Milestone {
  title: string;
  detail: string;
  date: string;
  reached: boolean;
}

export type TimelineBand = "Morning" | "Afternoon" | "Evening" | "Night";

export interface TimelineItem {
  id: string;
  band: TimelineBand;
  time: string;
  title: string;
  subtitle: string;
  macro?: string;
  isSession?: boolean;
  sessionId?: SessionId;
}

export interface CircleMessage {
  id: string;
  name: string;
  initials: string;
  tint: string;
  time: string;
  text: string;
}

export type MeasureValues = Partial<Record<MeasureSiteId, number>>;

export interface IntakeAnswers {
  name: string;
  age: string;
  heightCm: string;
  weightKg: string;
  life: string;
  diet: string;
  allergy: string;
  meals: { time: string; item: string }[];
  med: string;
  family: Record<string, boolean>;
  cycle: string;
  dur: string;
  limits: string[];
  sleepTime: string;
  wakeTime: string;
  why: string;
}
