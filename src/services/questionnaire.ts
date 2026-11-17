import { USERS_BASE_URL } from "../config";
import { ApiError, NetworkError } from "./http";
import { invalidate, Resource, useResource } from "./resource";
import { authGet, authPost, authPut } from "./session";

// The detailed "Guide me about you" questionnaire, opened once a programme is bought.
// API: GET/PUT /users/me/questionnaire, POST .../submit, POST .../photos (+ /{id}/complete).
// The API speaks snake_case; the app keeps camelCase and converts in this file only.

const URL = `${USERS_BASE_URL}/me/questionnaire`;
export const QUESTIONNAIRE_RESOURCE_KEY = "questionnaire";

export type Sex = "female" | "male";
export type ProgramNeed =
  | "weight_loss"
  | "weight_gain"
  | "pregnancy"
  | "post_pregnancy"
  | "medical"
  | "pcod"
  | "child";
export type PhotoView = "front" | "side";

export interface MealEntry {
  slot: string;
  time: string;
  items: string;
  quantity: string;
  note: string;
}

export interface QuestionnaireAnswers {
  sex: Sex | null;
  address: string;
  heightCm: number | null;
  weightKg: number | null;
  programNeed: ProgramNeed | null;
  programNeedDetail: string;
  target: "three_month_weight" | "one_time_health" | null;
  bodyType: "apple" | "pear" | "mixed" | null;
  bloodGroup: string;
  lifestyle: "active" | "sedentary" | null;
  profession: string;

  foodChoice: "vegetarian" | "eggitarian" | "non_vegetarian" | "vegan" | "other" | null;
  foodChoiceOther: string;
  foodAllergies: string;
  supplementAllergies: string;
  preferredFoods: string;
  nonPreferredFoods: string;
  addictions: string[];
  addictionsOther: string;
  alcohol: { amount: string; timeOfDay: string; type: string; snacks: string; daysPerWeek: string } | null;

  medicalConditions: string[];
  medicalHistory: string;
  medications: string;
  hadSurgery: boolean | null;
  surgeryProcedure: string;
  surgeryWhen: string;
  familyHistory: Record<string, boolean>;
  familyHistoryOther: string;
  limitations: string[];
  limitationsDetail: string;

  currentlyPregnant: boolean | null;
  pregnancy: {
    conception: "natural" | "ivf" | null;
    trimester: 1 | 2 | 3 | null;
    foetusCount: number | null;
    tasteAversions: string;
    complications: string;
    supplements: string;
  } | null;
  cycleRegularity: "regular" | "irregular" | "menopause" | "not_applicable" | null;
  cycleFlow: "light" | "normal" | "heavy" | null;
  cycleDurationDays: string;
  childrenCount: number | null;
  lastChildbirth: string;
  deliveryTypes: ("normal" | "caesarean")[];

  meals: MealEntry[];
  waterLitres: number | null;

  exercises: boolean | null;
  exerciseTypes: string[];
  exerciseOther: string;
  yogaType: string;
  weightTraining: ("machines" | "free_weights")[];
  exerciseMinutesPerDay: string;
  exerciseDaysPerWeek: number | null;
  familiarWith: Record<string, boolean>;
  exercisePlace: "home" | "gym_machines" | "gym_no_machines" | null;
  exerciseReservations: string;
  preferredExerciseTime: string;
  preferredExerciseDuration: string;

  weightReason: string;
  weightGoalKg: number | null;
  pastAttempts: string;
  pastAttemptWorked: boolean | null;
  pastAttemptKg: number | null;
  regained: boolean | null;
  regainedKg: number | null;
  pastFailureReason: string;
  laterAttemptsFailed: string;
  weightEvent: string;

  sleepTime: string;
  wakeTime: string;
  sleepsWell: "yes" | "sometimes" | "no" | null;
  afternoonRest: string;
}

export const MEAL_SLOTS: { id: string; label: string; hint: string }[] = [
  { id: "early_morning", label: "Early morning", hint: "On waking up" },
  { id: "breakfast", label: "Breakfast", hint: "" },
  { id: "mid_day", label: "Mid-day snack", hint: "" },
  { id: "lunch", label: "Lunch", hint: "" },
  { id: "evening", label: "Evening tea", hint: "" },
  { id: "dinner", label: "Dinner", hint: "" },
  { id: "bedtime", label: "Before bedtime", hint: "" },
  { id: "other", label: "Anything else", hint: "Late-night snacks, drinks…" },
];

export const emptyAnswers = (): QuestionnaireAnswers => ({
  sex: null,
  address: "",
  heightCm: null,
  weightKg: null,
  programNeed: null,
  programNeedDetail: "",
  target: null,
  bodyType: null,
  bloodGroup: "",
  lifestyle: null,
  profession: "",
  foodChoice: null,
  foodChoiceOther: "",
  foodAllergies: "",
  supplementAllergies: "",
  preferredFoods: "",
  nonPreferredFoods: "",
  addictions: [],
  addictionsOther: "",
  alcohol: null,
  medicalConditions: [],
  medicalHistory: "",
  medications: "",
  hadSurgery: null,
  surgeryProcedure: "",
  surgeryWhen: "",
  familyHistory: {},
  familyHistoryOther: "",
  limitations: [],
  limitationsDetail: "",
  currentlyPregnant: null,
  pregnancy: null,
  cycleRegularity: null,
  cycleFlow: null,
  cycleDurationDays: "",
  childrenCount: null,
  lastChildbirth: "",
  deliveryTypes: [],
  meals: MEAL_SLOTS.map((s) => ({ slot: s.id, time: "", items: "", quantity: "", note: "" })),
  waterLitres: null,
  exercises: null,
  exerciseTypes: [],
  exerciseOther: "",
  yogaType: "",
  weightTraining: [],
  exerciseMinutesPerDay: "",
  exerciseDaysPerWeek: null,
  familiarWith: {},
  exercisePlace: null,
  exerciseReservations: "",
  preferredExerciseTime: "",
  preferredExerciseDuration: "",
  weightReason: "",
  weightGoalKg: null,
  pastAttempts: "",
  pastAttemptWorked: null,
  pastAttemptKg: null,
  regained: null,
  regainedKg: null,
  pastFailureReason: "",
  laterAttemptsFailed: "",
  weightEvent: "",
  sleepTime: "",
  wakeTime: "",
  sleepsWell: null,
  afternoonRest: "",
});

/** Weight-management goals: only these get the weight-history questions and body measurements. */
export const WEIGHT_NEEDS: ProgramNeed[] = ["weight_loss", "weight_gain", "post_pregnancy"];
export const isWeightManagement = (a: Pick<QuestionnaireAnswers, "programNeed">) =>
  !!a.programNeed && WEIGHT_NEEDS.includes(a.programNeed);

export interface Photo {
  id: string;
  view: PhotoView;
  url: string;
  uploadedAt: string;
}

export interface QuestionnaireState {
  answers: QuestionnaireAnswers;
  /** ISO timestamp, or null while it's still being filled in. */
  submittedAt: string | null;
  photos: Photo[];
}

/* ---------- key conversion ---------- */

const toSnake = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const toCamel = (k: string) => k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

function convertKeys(value: unknown, convert: (k: string) => string): unknown {
  if (Array.isArray(value)) return value.map((v) => convertKeys(v, convert));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [convert(k), convertKeys(v, convert)]));
  }
  return value;
}

/** Fills gaps with defaults so screens can rely on every field being present. */
function normalise(raw: unknown): QuestionnaireAnswers {
  const base = emptyAnswers();
  const got = (convertKeys(raw ?? {}, toCamel) ?? {}) as Partial<QuestionnaireAnswers>;
  const merged = { ...base, ...Object.fromEntries(Object.entries(got).filter(([, v]) => v !== undefined)) } as QuestionnaireAnswers;
  // Keep every meal slot, in order, even if the server has only some.
  merged.meals = MEAL_SLOTS.map(
    (s) => ({ ...base.meals.find((m) => m.slot === s.id)!, ...(got.meals ?? []).find((m) => m.slot === s.id) })
  );
  return merged;
}

type StateResponse = { answers?: unknown; submitted_at?: unknown; photos?: unknown } | null;

function fromResponse(raw: StateResponse): QuestionnaireState {
  if (!raw) throw new ApiError("Couldn't load your questionnaire. Please try again.", 200);
  const photos = Array.isArray(raw.photos) ? (convertKeys(raw.photos, toCamel) as Photo[]) : [];
  return {
    answers: normalise(raw.answers),
    submittedAt: typeof raw.submitted_at === "string" ? raw.submitted_at : null,
    photos,
  };
}

const body = (answers: QuestionnaireAnswers) => ({ answers: convertKeys(answers, toSnake) });

/* ---------- requests ---------- */

export async function fetchQuestionnaire(): Promise<QuestionnaireState> {
  return fromResponse(
    await authGet<StateResponse>(URL, { fallbackError: "Couldn't load your questionnaire. Please try again." })
  );
}

/** Saves the answers so far. The form saves after every step, so it can be resumed anywhere. */
export async function saveQuestionnaire(answers: QuestionnaireAnswers): Promise<QuestionnaireState> {
  return fromResponse(
    await authPut<StateResponse>(URL, body(answers), { fallbackError: "Couldn't save your answers." })
  );
}

/** Sends the finished questionnaire to the clinic. */
export async function submitQuestionnaire(answers: QuestionnaireAnswers): Promise<QuestionnaireState> {
  const state = fromResponse(
    await authPost<StateResponse>(`${URL}/submit`, body(answers), {
      fallbackError: "Couldn't send your questionnaire. Please try again.",
    })
  );
  invalidate(QUESTIONNAIRE_RESOURCE_KEY);
  return state;
}

export interface PickedImage {
  uri: string;
  mimeType?: string | null;
  fileSize?: number | null;
}

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/heic", "image/webp"];

/** Uploads a front or side photo straight to storage, then tells the API it's there. */
export async function uploadPhoto(view: PhotoView, image: PickedImage): Promise<Photo> {
  const file = await fetch(image.uri).then((r) => r.blob());
  const type = image.mimeType && PHOTO_TYPES.includes(image.mimeType) ? image.mimeType : "image/jpeg";
  const ticket = await authPost<{ photo_id: string; upload_url: string; upload_headers: Record<string, string> }>(
    `${URL}/photos`,
    { view, content_type: type, size_bytes: image.fileSize || file.size || 1 },
    { fallbackError: "Couldn't start the upload. Please try again." }
  );
  let res: Response;
  try {
    res = await fetch(ticket.upload_url, { method: "PUT", headers: ticket.upload_headers, body: file });
  } catch {
    throw new NetworkError(false);
  }
  if (!res.ok) throw new ApiError("The photo didn't upload. Please try again.", res.status);
  const photo = await authPost<unknown>(`${URL}/photos/${ticket.photo_id}/complete`, undefined, {
    fallbackError: "The photo didn't upload. Please try again.",
  });
  invalidate(QUESTIONNAIRE_RESOURCE_KEY);
  return convertKeys(photo, toCamel) as Photo;
}

export function useQuestionnaire(): Resource<QuestionnaireState> {
  return useResource(QUESTIONNAIRE_RESOURCE_KEY, fetchQuestionnaire);
}
