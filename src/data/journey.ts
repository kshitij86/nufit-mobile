import { MeasureSiteId } from "../types";

export const weeklyWeights = [78.4, 77.9, 77.2, 76.8, 76.1, 75.6, 75.2];

export const inchesTable: { id: MeasureSiteId; label: string; baseline: number; today: number }[] = [
  { id: "arm", label: "Arm", baseline: 32.5, today: 31.4 },
  { id: "waist", label: "Waist", baseline: 86.0, today: 83.2 },
  { id: "tummy", label: "Tummy", baseline: 98.4, today: 94.9 },
  { id: "belowNavel", label: "Below navel", baseline: 101.2, today: 98.0 },
  { id: "hip", label: "Hip", baseline: 106.5, today: 104.1 },
  { id: "thigh", label: "Thigh", baseline: 61.0, today: 59.6 },
];

export const adherence14: ("full" | "partial" | "missed")[] = [
  "full", "full", "partial", "full", "full", "missed", "full",
  "full", "partial", "full", "full", "full", "partial", "full",
];

export const sleepWeek = [62, 78, 54, 88, 70, 92, 74];
export const sleepDays = ["M", "T", "W", "T", "F", "S", "S"];

export const streakWeek: ("full" | "partial" | "missed")[] = [
  "full", "full", "missed", "full", "full", "partial", "full",
];
