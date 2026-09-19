import { Programme } from "../types";
import { colors } from "../theme/colors";

export const programmes: Programme[] = [
  {
    id: "reset360",
    name: "Reset 360",
    category: "Core weight management",
    weeksLabel: "12 weeks",
    priceLabel: "₹24,000",
    price: 24000,
    tintBg: colors.orangeTint,
    tintInk: "#B4703A",
    artLabel: "SUNRISE WALK",
    blurb:
      "A full metabolic reset built on your intake, anthropometry and food history — recalibrated every fortnight by Dr. Kanika.",
    includes: [
      "Fortnightly diet recalibration",
      "Progressive home-strength plan",
      "Fortnightly inch & weight review",
      "Direct line to the clinic team",
    ],
    stats: [
      ["12", "weeks"],
      ["6", "reviews"],
      ["1:1", "supervision"],
    ],
  },
  {
    id: "pcos",
    name: "PCOS Balance",
    category: "Hormonal & metabolic",
    weeksLabel: "16 weeks",
    priceLabel: "₹28,000",
    price: 28000,
    tintBg: colors.lilac,
    tintInk: colors.lilacInk,
    artLabel: "CYCLE RHYTHM",
    blurb:
      "Insulin-sensitising nutrition, cycle-aware training loads and stress management for PCOS and PCOD.",
    includes: [
      "Low-GI Indian meal architecture",
      "Cycle-phased training blocks",
      "Inositol & vitamin-D guidance",
      "Symptom and cycle tracking",
    ],
    stats: [
      ["16", "weeks"],
      ["4", "cycles"],
      ["2×", "monthly review"],
    ],
  },
  {
    id: "prenatal",
    name: "Prenatal Strong",
    category: "Pregnancy",
    weeksLabel: "per trimester",
    priceLabel: "₹18,000",
    price: 18000,
    tintBg: colors.sage,
    tintInk: colors.sageInk,
    artLabel: "TRIMESTER FLOW",
    blurb:
      "Trimester-adaptive movement and nutrition that protects the pelvic floor and keeps you strong for labour.",
    includes: [
      "Trimester-specific movement library",
      "Weight-gain corridor tracking",
      "Pelvic floor and breath work",
      "Obstetrician clearance workflow",
    ],
    stats: [
      ["3", "trimesters"],
      ["20 min", "sessions"],
      ["MD", "cleared"],
    ],
  },
  {
    id: "postpartum",
    name: "Postpartum Restore",
    category: "Recovery",
    weeksLabel: "12 weeks",
    priceLabel: "₹22,000",
    price: 22000,
    tintBg: colors.amberTint,
    tintInk: colors.amberInk,
    artLabel: "FOURTH TRIMESTER",
    blurb:
      "Diastasis-aware core rebuilding, lactation-safe nutrition and a gradual return to load from week six.",
    includes: [
      "Diastasis recti screening guide",
      "Lactation-safe calorie targets",
      "Scar and posture rehabilitation",
      "Sleep-debt aware programming",
    ],
    stats: [
      ["12", "weeks"],
      ["0", "equipment"],
      ["C-sec", "safe"],
    ],
  },
  {
    id: "thyroid",
    name: "Thyroid & Metabolic Care",
    category: "Comorbidity",
    weeksLabel: "12 weeks",
    priceLabel: "₹24,000",
    price: 24000,
    tintBg: colors.sky,
    tintInk: colors.skyInk,
    artLabel: "STEADY ENERGY",
    blurb:
      "For hypothyroidism, pre-diabetes and dyslipidaemia — nutrient timing around medication with lean-mass protection.",
    includes: [
      "Medication-timed meal windows",
      "Iodine and selenium guidance",
      "Lean-mass protective training",
      "Quarterly lab-value log",
    ],
    stats: [
      ["12", "weeks"],
      ["Labs", "logged"],
      ["Rx", "aware"],
    ],
  },
  {
    id: "posture",
    name: "Posture & Pain Relief",
    category: "Musculoskeletal",
    weeksLabel: "8 weeks",
    priceLabel: "₹16,000",
    price: 16000,
    tintBg: colors.coral,
    tintInk: colors.coralInk,
    artLabel: "DESK RESET",
    blurb:
      "Desk-neck, low back and knee pain — assessment-led corrective sequencing with sensible load management.",
    includes: [
      "Postural photo assessment",
      "Corrective mobility sequences",
      "Ergonomic workstation audit",
      "Weekly pain-scale log",
    ],
    stats: [
      ["8", "weeks"],
      ["10 min", "daily"],
      ["Pain", "logged"],
    ],
  },
];

export function programmeById(id: string | null | undefined): Programme {
  return programmes.find((p) => p.id === id) ?? programmes[0];
}
