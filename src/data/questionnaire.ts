import { isWeightManagement, QuestionnaireAnswers } from "../services/questionnaire";

/**
 * Dr. Kanika's "Guide me about you" questionnaire as a list of steps.
 *
 * One step is one screen. `when` hides a step (or a field) that doesn't apply, so a man never sees
 * period questions, the weight-history section only appears for weight goals, and follow-ups such
 * as alcohol details only appear after the answer that calls for them. Name, phone, email and date
 * of birth come from registration and aren't asked again.
 */

export interface Ctx {
  a: QuestionnaireAnswers;
  firstName: string;
  /** From the date of birth given at registration. */
  age: number | null;
}

export interface Option {
  id: string;
  label: string;
  sub?: string;
  /** Hide an option that can't apply, e.g. pregnancy for a man. */
  when?: (c: Ctx) => boolean;
}

interface Base {
  /** Dotted path into the answers, e.g. "alcohol.amount". */
  field: string;
  label?: string;
  when?: (c: Ctx) => boolean;
}

export type Field =
  | (Base & { type: "choice"; options: Option[]; multi?: boolean; columns?: 1 | 2 | 3; exclusive?: string; numeric?: boolean })
  | (Base & { type: "text"; placeholder?: string; multiline?: boolean; quick?: string[] })
  | (Base & { type: "number"; unit: string; placeholder?: string; decimal?: boolean; integer?: boolean; asText?: boolean })
  | (Base & { type: "yesNo" })
  | (Base & { type: "yesNoGrid"; rows: { id: string; label: string }[] })
  | (Base & { type: "stepper"; unit: string; step: number; min: number; max: number })
  | { type: "heightWeight"; field: "heightWeight"; when?: (c: Ctx) => boolean; label?: string }
  | { type: "meals"; field: "meals"; when?: (c: Ctx) => boolean; label?: string }
  | { type: "photos"; field: "photos"; when?: (c: Ctx) => boolean; label?: string }
  | { type: "notice"; field: "notice"; text: string; tone?: "info" | "warn"; when?: (c: Ctx) => boolean; label?: string };

export interface Section {
  id: string;
  title: string;
  icon: string;
  tint: string;
  ink: string;
}

export interface Step {
  key: string;
  section: Section["id"];
  heading: (c: Ctx) => string;
  help?: string;
  fields: Field[];
  when?: (c: Ctx) => boolean;
  /** Fields that must be answered before Continue. Everything else can be skipped. */
  required?: string[];
}

export const sections: Section[] = [
  { id: "you", title: "About you", icon: "person-outline", tint: "#FBE7EC", ink: "#B0405E" },
  { id: "food", title: "Food & habits", icon: "restaurant-outline", tint: "#E5F4EC", ink: "#2F7A55" },
  { id: "health", title: "Health", icon: "medkit-outline", tint: "#E6EEFC", ink: "#2A57C4" },
  { id: "women", title: "Women's health", icon: "flower-outline", tint: "#F3E8FB", ink: "#7A3FA8" },
  { id: "day", title: "Your day of eating", icon: "time-outline", tint: "#FFF1DD", ink: "#9A6312" },
  { id: "move", title: "Movement", icon: "walk-outline", tint: "#DDF5EF", ink: "#0E8E75" },
  { id: "weight", title: "Your weight story", icon: "trending-down-outline", tint: "#FBEBE9", ink: "#B5523F" },
  { id: "sleep", title: "Sleep", icon: "moon-outline", tint: "#E9E7FB", ink: "#4B45A8" },
  { id: "photos", title: "Photos", icon: "camera-outline", tint: "#FBE7EC", ink: "#B0405E" },
];

const female = (c: Ctx) => c.a.sex === "female";
const isAdult = (c: Ctx) => c.age == null || c.age >= 18;
const of = (c: Ctx, path: string) => getPath(c.a, path);
const includes = (path: string, id: string) => (c: Ctx) => ((of(c, path) as string[]) ?? []).includes(id);
const NONE = ["None"];

export const steps: Step[] = [
  /* ---------- about you ---------- */
  {
    key: "sex",
    section: "you",
    heading: (c) => `Hi ${c.firstName}! First, are you…`,
    help: "This decides which questions apply to you, so we never ask you anything that doesn't.",
    // Only asked when registration didn't tell us.
    fields: [{ type: "choice", field: "sex", options: [{ id: "female", label: "Female" }, { id: "male", label: "Male" }], columns: 2 }],
    required: ["sex"],
  },
  {
    key: "body",
    section: "you",
    heading: () => "Your height and weight today",
    help: "Weigh yourself on an empty stomach and bladder, bare feet, on the same scale every time.",
    fields: [{ type: "heightWeight", field: "heightWeight" }],
    required: ["heightCm", "weightKg"],
  },
  {
    key: "need",
    section: "you",
    heading: () => "What do you need the programme for?",
    help: "We've picked the one that matches the programme you bought. Change it if it isn't right.",
    fields: [
      {
        type: "choice",
        field: "programNeed",
        options: [
          { id: "weight_loss", label: "Weight loss" },
          { id: "weight_gain", label: "Weight gain" },
          { id: "pregnancy", label: "Pregnancy", when: female },
          { id: "post_pregnancy", label: "Post-pregnancy weight loss", when: female },
          { id: "pcod", label: "PCOD", when: female },
          { id: "medical", label: "A medical condition" },
          { id: "child", label: "My child", sub: "Athletic performance or better growth" },
        ],
      },
      {
        type: "text",
        field: "programNeedDetail",
        label: "Which condition?",
        placeholder: "Thyroid, diabetes, high BP…",
        when: (c) => c.a.programNeed === "medical",
      },
      {
        type: "text",
        field: "programNeedDetail",
        label: "Your child's age and what you'd like to improve",
        placeholder: "12 years, stamina for football…",
        multiline: true,
        when: (c) => c.a.programNeed === "child",
      },
    ],
    required: ["programNeed"],
  },
  {
    key: "target",
    section: "you",
    heading: () => "What's your target?",
    fields: [
      {
        type: "choice",
        field: "target",
        options: [
          { id: "three_month_weight", label: "A 3-month plan", sub: "For weight loss or weight gain" },
          { id: "one_time_health", label: "A one-time plan", sub: "For another health issue" },
        ],
      },
    ],
  },
  {
    key: "bodyType",
    section: "you",
    heading: () => "Which body shape is closest to yours?",
    help: "Where you carry weight tells us a lot about what to focus on.",
    when: (c) => c.a.programNeed !== "child",
    fields: [
      {
        type: "choice",
        field: "bodyType",
        options: [
          { id: "apple", label: "Apple", sub: "Weight mostly around the tummy and waist" },
          { id: "pear", label: "Pear", sub: "Weight mostly around the hips and thighs" },
          { id: "mixed", label: "Mixed", sub: "Spread fairly evenly" },
        ],
      },
    ],
  },
  {
    key: "blood",
    section: "you",
    heading: () => "Do you know your blood group?",
    fields: [
      {
        type: "choice",
        field: "bloodGroup",
        columns: 3,
        options: ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−", "Not sure"].map((g) => ({ id: g, label: g })),
      },
    ],
  },
  {
    key: "lifestyle",
    section: "you",
    heading: () => "How does your day usually go?",
    fields: [
      {
        type: "choice",
        field: "lifestyle",
        columns: 2,
        options: [
          { id: "active", label: "Active", sub: "On my feet a lot" },
          { id: "sedentary", label: "Sedentary", sub: "Mostly sitting" },
        ],
      },
      { type: "text", field: "profession", label: "What do you do?", placeholder: "Teacher, homemaker, software engineer…" },
    ],
  },
  {
    key: "address",
    section: "you",
    heading: () => "Where do you live?",
    help: "Your address, for our records.",
    fields: [{ type: "text", field: "address", placeholder: "House, street, area, city, PIN", multiline: true }],
  },

  /* ---------- food & habits ---------- */
  {
    key: "food",
    section: "food",
    heading: () => "What do you eat?",
    fields: [
      {
        type: "choice",
        field: "foodChoice",
        columns: 2,
        options: [
          { id: "vegetarian", label: "Vegetarian" },
          { id: "eggitarian", label: "Eggitarian" },
          { id: "non_vegetarian", label: "Non-vegetarian" },
          { id: "vegan", label: "Vegan" },
          { id: "other", label: "Something else" },
        ],
      },
      { type: "text", field: "foodChoiceOther", label: "Tell us more", placeholder: "Jain, no onion-garlic, pescatarian…", when: (c) => c.a.foodChoice === "other" },
    ],
    required: ["foodChoice"],
  },
  {
    key: "allergies",
    section: "food",
    heading: () => "Any allergies?",
    help: "Both foods and supplements. Tap None if there aren't any.",
    fields: [
      { type: "text", field: "foodAllergies", label: "Food allergies", placeholder: "Peanuts, lactose…", quick: NONE },
      { type: "text", field: "supplementAllergies", label: "Supplement allergies", placeholder: "Whey protein, fish oil…", quick: NONE },
    ],
  },
  {
    key: "likes",
    section: "food",
    heading: () => "Foods you love, and foods you don't",
    help: "A plan you enjoy is a plan you'll stick to.",
    fields: [
      { type: "text", field: "preferredFoods", label: "I love", placeholder: "Dosa, paneer, fruit…", multiline: true },
      { type: "text", field: "nonPreferredFoods", label: "Please don't give me", placeholder: "Bitter gourd, oats…", multiline: true },
    ],
  },
  {
    key: "addictions",
    section: "food",
    heading: () => "Any habits we should know about?",
    help: "No judgement. This only helps us plan around them.",
    when: isAdult,
    fields: [
      {
        type: "choice",
        field: "addictions",
        multi: true,
        exclusive: "none",
        columns: 2,
        options: [
          { id: "none", label: "None" },
          { id: "smoking", label: "Smoking" },
          { id: "tobacco", label: "Tobacco / gutkha" },
          { id: "alcohol", label: "Alcohol" },
          { id: "caffeine", label: "Lots of tea / coffee" },
          { id: "sugar", label: "Sweets / sugar" },
          { id: "other", label: "Other" },
        ],
      },
      { type: "text", field: "addictionsOther", label: "What else?", when: includes("addictions", "other") },
    ],
  },
  {
    key: "alcohol",
    section: "food",
    heading: () => "A little about your drinking",
    when: includes("addictions", "alcohol"),
    fields: [
      { type: "text", field: "alcohol.amount", label: "How much at a time", placeholder: "2 pegs, 1 glass of wine…" },
      { type: "text", field: "alcohol.type", label: "What do you drink", placeholder: "Whisky, beer…" },
      { type: "text", field: "alcohol.timeOfDay", label: "Time of day", placeholder: "After 9 pm" },
      { type: "text", field: "alcohol.snacks", label: "Snacks with it", placeholder: "Peanuts, chakna…" },
      { type: "text", field: "alcohol.daysPerWeek", label: "Days a week", placeholder: "2" },
    ],
  },

  /* ---------- health ---------- */
  {
    key: "medical",
    section: "health",
    heading: () => "Any medical conditions?",
    help: "Tick everything that applies.",
    fields: [
      {
        type: "choice",
        field: "medicalConditions",
        multi: true,
        exclusive: "none",
        columns: 2,
        options: [
          { id: "none", label: "None" },
          { id: "thyroid", label: "Thyroid" },
          { id: "diabetes", label: "Diabetes" },
          { id: "prediabetes", label: "Pre-diabetes" },
          { id: "high_bp", label: "High BP" },
          { id: "pcod", label: "PCOD / PCOS", when: female },
          { id: "cholesterol", label: "High cholesterol" },
          { id: "uric_acid", label: "High uric acid" },
          { id: "vitamin_d", label: "Vitamin D / B12 low" },
          { id: "asthma", label: "Asthma" },
          { id: "heart", label: "Heart condition" },
          { id: "kidney", label: "Kidney condition" },
        ],
      },
      { type: "text", field: "medicalHistory", label: "Anything else, or since when", placeholder: "Hypothyroid since 2019…", multiline: true },
    ],
  },
  {
    key: "meds",
    section: "health",
    heading: () => "Do you take any medicines?",
    help: "For these or any other conditions. Include the dose and the time you take it.",
    fields: [{ type: "text", field: "medications", placeholder: "Thyronorm 50 mcg at 7 am…", multiline: true, quick: NONE }],
  },
  {
    key: "surgery",
    section: "health",
    heading: () => "Have you had any surgery?",
    fields: [
      { type: "yesNo", field: "hadSurgery" },
      { type: "text", field: "surgeryProcedure", label: "Which procedure", placeholder: "Knee arthroscopy…", when: (c) => c.a.hadSurgery === true },
      { type: "text", field: "surgeryWhen", label: "When", placeholder: "March 2021", when: (c) => c.a.hadSurgery === true },
    ],
  },
  {
    key: "family",
    section: "health",
    heading: () => "Does any of this run in your family?",
    help: "Parents, brothers and sisters.",
    fields: [
      {
        type: "yesNoGrid",
        field: "familyHistory",
        rows: [
          { id: "obesity", label: "Obesity" },
          { id: "thyroid", label: "Thyroid" },
          { id: "diabetes", label: "Diabetes" },
          { id: "highBp", label: "High blood pressure" },
          { id: "heartDisease", label: "Heart disease" },
          { id: "kidneyDisease", label: "Kidney disease" },
        ],
      },
      { type: "text", field: "familyHistoryOther", label: "Anything else?", placeholder: "Arthritis…" },
    ],
  },
  {
    key: "limits",
    section: "health",
    heading: () => "Anything that hurts or limits you?",
    help: "We plan around pain, never through it.",
    fields: [
      {
        type: "choice",
        field: "limitations",
        multi: true,
        exclusive: "none",
        columns: 2,
        options: [
          { id: "none", label: "Nothing" },
          { id: "back", label: "Back" },
          { id: "knees", label: "Knees" },
          { id: "shoulder", label: "Shoulder" },
          { id: "neck", label: "Neck" },
          { id: "ankle", label: "Ankle" },
          { id: "hip", label: "Hip" },
          { id: "other", label: "Other" },
        ],
      },
      { type: "text", field: "limitationsDetail", label: "Tell us more", placeholder: "Lower back pain when bending…", when: (c) => (c.a.limitations ?? []).some((l) => l !== "none") },
    ],
  },

  /* ---------- women's health ---------- */
  {
    key: "pregnant",
    section: "women",
    heading: () => "Are you pregnant right now?",
    when: (c) => female(c) && isAdult(c),
    fields: [{ type: "yesNo", field: "currentlyPregnant" }],
  },
  {
    key: "pregnancy",
    section: "women",
    heading: () => "Congratulations! Tell us about your pregnancy",
    when: (c) => female(c) && c.a.currentlyPregnant === true,
    fields: [
      { type: "choice", field: "pregnancy.conception", label: "Conception", columns: 2, options: [{ id: "natural", label: "Natural" }, { id: "ivf", label: "IVF" }] },
      { type: "choice", field: "pregnancy.trimester", label: "Current trimester", columns: 3, numeric: true, options: [{ id: "1", label: "First" }, { id: "2", label: "Second" }, { id: "3", label: "Third" }] },
      { type: "choice", field: "pregnancy.foetusCount", label: "Number of babies", columns: 3, numeric: true, options: [{ id: "1", label: "One" }, { id: "2", label: "Twins" }, { id: "3", label: "Three+" }] },
    ],
  },
  {
    key: "pregnancyCare",
    section: "women",
    heading: () => "How is the pregnancy going?",
    when: (c) => female(c) && c.a.currentlyPregnant === true,
    fields: [
      { type: "text", field: "pregnancy.tasteAversions", label: "Any taste aversions", placeholder: "Can't stand the smell of tea…", quick: NONE },
      { type: "text", field: "pregnancy.complications", label: "Any complications right now", placeholder: "Gestational diabetes, low placenta…", quick: NONE, multiline: true },
      { type: "text", field: "pregnancy.supplements", label: "Supplements or medicines you take", placeholder: "Folic acid, iron, calcium…", multiline: true },
    ],
  },
  {
    key: "cycle",
    section: "women",
    heading: () => "About your periods",
    when: (c) => female(c) && c.a.currentlyPregnant !== true && (c.age == null || c.age >= 10),
    fields: [
      {
        type: "choice",
        field: "cycleRegularity",
        label: "Are they regular?",
        columns: 2,
        options: [
          { id: "regular", label: "Regular" },
          { id: "irregular", label: "Irregular" },
          { id: "menopause", label: "Menopause", when: (c) => c.age == null || c.age >= 35 },
          { id: "not_applicable", label: "Not applicable" },
        ],
      },
      {
        type: "choice",
        field: "cycleFlow",
        label: "Flow",
        columns: 3,
        options: [{ id: "light", label: "Light" }, { id: "normal", label: "Normal" }, { id: "heavy", label: "Heavy" }],
        when: (c) => c.a.cycleRegularity === "regular" || c.a.cycleRegularity === "irregular",
      },
      {
        type: "number",
        field: "cycleDurationDays",
        label: "How many days does it last?",
        unit: "days",
        placeholder: "5",
        integer: true,
        asText: true,
        when: (c) => c.a.cycleRegularity === "regular" || c.a.cycleRegularity === "irregular",
      },
    ],
  },
  {
    key: "children",
    section: "women",
    heading: () => "Do you have children?",
    when: (c) => female(c) && isAdult(c),
    fields: [
      { type: "stepper", field: "childrenCount", label: "Number of children", unit: "", step: 1, min: 0, max: 10 },
      { type: "text", field: "lastChildbirth", label: "When was your last delivery?", placeholder: "June 2024", when: (c) => (c.a.childrenCount ?? 0) > 0 },
      {
        type: "choice",
        field: "deliveryTypes",
        label: "Delivery type",
        multi: true,
        columns: 2,
        options: [{ id: "normal", label: "Normal" }, { id: "caesarean", label: "Caesarean" }],
        when: (c) => (c.a.childrenCount ?? 0) > 0,
      },
    ],
  },

  /* ---------- day of eating ---------- */
  {
    key: "meals",
    section: "day",
    heading: () => "Walk us through a normal day of eating",
    help: "Fill in the meals you have. Leave the rest blank. Rough amounts are fine: 2 rotis, 1 katori dal.",
    fields: [{ type: "meals", field: "meals" }],
  },
  {
    key: "water",
    section: "day",
    heading: () => "How much water do you drink a day?",
    help: "A standard bottle is 1 litre.",
    fields: [{ type: "stepper", field: "waterLitres", unit: "litres", step: 0.5, min: 0, max: 8 }],
  },

  /* ---------- movement ---------- */
  {
    key: "exercises",
    section: "move",
    heading: () => "Do you exercise at the moment?",
    fields: [{ type: "yesNo", field: "exercises" }],
  },
  {
    key: "exerciseKind",
    section: "move",
    heading: () => "What kind of exercise?",
    help: "Tick all that you do.",
    when: (c) => c.a.exercises === true,
    fields: [
      {
        type: "choice",
        field: "exerciseTypes",
        multi: true,
        columns: 2,
        options: [
          { id: "walk", label: "Walk" },
          { id: "jog", label: "Jog" },
          { id: "run", label: "Run" },
          { id: "aerobics", label: "Aerobics" },
          { id: "cycling", label: "Cycling" },
          { id: "swimming", label: "Swimming" },
          { id: "yoga", label: "Yoga" },
          { id: "weights", label: "Weight training" },
          { id: "sports", label: "Sports" },
          { id: "other", label: "Other" },
        ],
      },
      { type: "text", field: "yogaType", label: "Any special type of yoga?", placeholder: "Power yoga, Iyengar…", when: includes("exerciseTypes", "yoga") },
      {
        type: "choice",
        field: "weightTraining",
        label: "Weight training with",
        multi: true,
        columns: 2,
        options: [{ id: "machines", label: "Machines" }, { id: "free_weights", label: "Free weights" }],
        when: includes("exerciseTypes", "weights"),
      },
      { type: "text", field: "exerciseOther", label: "What else?", placeholder: "Badminton, dance…", when: (c) => includes("exerciseTypes", "other")(c) || includes("exerciseTypes", "sports")(c) },
    ],
  },
  {
    key: "exerciseHowMuch",
    section: "move",
    heading: () => "How much do you exercise?",
    when: (c) => c.a.exercises === true,
    fields: [
      { type: "choice", field: "exerciseMinutesPerDay", label: "Each day", columns: 2, options: ["15 min", "30 min", "45 min", "1 hour+"].map((x) => ({ id: x, label: x })) },
      { type: "stepper", field: "exerciseDaysPerWeek", label: "Days a week", unit: "days", step: 1, min: 0, max: 7 },
    ],
  },
  {
    key: "equipment",
    section: "move",
    heading: () => "Have you used these before?",
    help: "So your trainer knows what to explain.",
    fields: [
      {
        type: "yesNoGrid",
        field: "familiarWith",
        rows: [
          { id: "medicineBall", label: "Medicine ball" },
          { id: "resistanceBands", label: "Resistance bands" },
          { id: "balanceBall", label: "Balancing ball" },
        ],
      },
    ],
  },
  {
    key: "where",
    section: "move",
    heading: () => "Where would you like to exercise?",
    fields: [
      {
        type: "choice",
        field: "exercisePlace",
        options: [
          { id: "home", label: "At home", sub: "No machines" },
          { id: "gym_machines", label: "At the gym, with machines" },
          { id: "gym_no_machines", label: "At the gym, without machines" },
        ],
      },
    ],
  },
  {
    key: "when",
    section: "move",
    heading: () => "When suits you best?",
    fields: [
      { type: "choice", field: "preferredExerciseTime", label: "Time of day", columns: 2, options: ["Early morning", "Morning", "Afternoon", "Evening", "Night"].map((x) => ({ id: x, label: x })) },
      { type: "choice", field: "preferredExerciseDuration", label: "How long", columns: 2, options: ["15 min", "30 min", "45 min", "1 hour"].map((x) => ({ id: x, label: x })) },
      { type: "text", field: "exerciseReservations", label: "Any reservations about exercise?", placeholder: "Don't like jumping, shy of the gym…", quick: NONE },
    ],
  },

  /* ---------- weight story (weight goals only) ---------- */
  {
    key: "weightWhy",
    section: "weight",
    heading: (c) => `Why do you want to ${c.a.programNeed === "weight_gain" ? "gain" : "lose"} weight?`,
    help: "Dr. Kanika reads this before anything else.",
    when: (c) => isWeightManagement(c.a),
    fields: [
      { type: "text", field: "weightReason", placeholder: "Energy for my kids, my sister's wedding…", multiline: true },
      { type: "number", field: "weightGoalKg", unit: "kg", placeholder: "10", decimal: true },
    ],
  },
  {
    key: "weightPast",
    section: "weight",
    heading: () => "Have you tried before?",
    when: (c) => isWeightManagement(c.a),
    fields: [
      { type: "text", field: "pastAttempts", label: "What have you tried", placeholder: "Keto for 3 months, gym, a dietitian…", multiline: true, quick: ["Never tried"] },
      { type: "yesNo", field: "pastAttemptWorked", label: "Did it work?", when: (c) => !!c.a.pastAttempts && c.a.pastAttempts !== "Never tried" },
      { type: "number", field: "pastAttemptKg", label: "By how many kg?", unit: "kg", decimal: true, when: (c) => c.a.pastAttemptWorked === true },
      { type: "yesNo", field: "regained", label: "Did the weight come back afterwards?", when: (c) => c.a.pastAttemptWorked === true && c.a.programNeed !== "weight_gain" },
      { type: "number", field: "regainedKg", label: "How many kg came back?", unit: "kg", decimal: true, when: (c) => c.a.regained === true },
    ],
  },
  {
    key: "weightWhyFailed",
    section: "weight",
    heading: () => "Looking back, what got in the way?",
    when: (c) => isWeightManagement(c.a) && !!c.a.pastAttempts && c.a.pastAttempts !== "Never tried",
    fields: [
      { type: "text", field: "pastFailureReason", label: "Why the last attempt didn't last", placeholder: "Too strict, travel, lost motivation…", multiline: true },
      { type: "text", field: "laterAttemptsFailed", label: "Any later attempt that also didn't work?", placeholder: "Tried again in 2023 but…", multiline: true, quick: NONE },
    ],
  },
  {
    key: "weightEvent",
    section: "weight",
    heading: (c) => `Is there an event you link to your weight ${c.a.programNeed === "weight_gain" ? "loss" : "gain"}?`,
    help: "A pregnancy, a new job, an illness, a move, a loss…",
    when: (c) => isWeightManagement(c.a),
    fields: [{ type: "text", field: "weightEvent", placeholder: "Gained 8 kg after my second child", multiline: true, quick: ["Nothing in particular"] }],
  },

  /* ---------- sleep ---------- */
  {
    key: "sleep",
    section: "sleep",
    heading: () => "When do you sleep and wake?",
    help: "Your meal and wind-down times are built around these.",
    fields: [
      { type: "choice", field: "sleepTime", label: "Bedtime", columns: 3, options: ["9 pm", "10 pm", "11 pm", "12 am", "1 am", "Later"].map((x) => ({ id: x, label: x })) },
      { type: "choice", field: "wakeTime", label: "Wake-up", columns: 3, options: ["5 am", "6 am", "7 am", "8 am", "9 am", "Later"].map((x) => ({ id: x, label: x })) },
    ],
  },
  {
    key: "sleepQuality",
    section: "sleep",
    heading: () => "How well do you sleep?",
    fields: [
      { type: "choice", field: "sleepsWell", label: "Do you sleep well at night?", columns: 3, options: [{ id: "yes", label: "Yes" }, { id: "sometimes", label: "Sometimes" }, { id: "no", label: "No" }] },
      { type: "choice", field: "afternoonRest", label: "Do you rest in the afternoon?", columns: 3, options: ["No", "Under 30 min", "30 min+"].map((x) => ({ id: x, label: x })) },
    ],
  },

  /* ---------- photos ---------- */
  {
    key: "photos",
    section: "photos",
    heading: () => "Two photos for your record",
    help: "A front and a side photo, standing, full length, ideally in gym wear. Use the same outfit each time so you can compare. Only Dr. Kanika's team sees them.",
    fields: [
      { type: "photos", field: "photos" },
      {
        type: "notice",
        field: "notice",
        tone: "info",
        text: "Next you'll take your body measurements. Measurements are for weight-management programmes only.",
        when: (c) => isWeightManagement(c.a),
      },
    ],
  },
];

/** The goal-kg label depends on the answers, so screens call this rather than reading `label`. */
export function fieldLabel(field: Field, c: Ctx): string | undefined {
  if (field.field === "weightGoalKg") return `How many kg would you like to ${c.a.programNeed === "weight_gain" ? "gain" : "lose"}?`;
  return field.label;
}

/** The steps that apply to this member, in order. */
export function visibleSteps(c: Ctx, askSex: boolean): Step[] {
  return steps.filter((s) => (s.key === "sex" ? askSex : !s.when || s.when(c)));
}

export function visibleFields(step: Step, c: Ctx): Field[] {
  return step.fields.filter((f) => !f.when || f.when(c));
}

/* ---------- dotted-path helpers ---------- */

export function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);
}

export function setPath<T>(obj: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split(".");
  const current = (obj as Record<string, unknown>)[head];
  const next = rest.length ? setPath((current && typeof current === "object" ? current : {}) as object, rest.join("."), value) : value;
  return { ...(obj as object), [head]: next } as T;
}

/** True when a required answer is still missing. */
export function isBlank(value: unknown): boolean {
  return value == null || value === "" || (Array.isArray(value) && value.length === 0);
}
