import { TimelineItem } from "../types";

export const baseSchedule: TimelineItem[] = [
  {
    id: "wake-water",
    band: "Morning",
    time: "6:30",
    title: "On waking",
    subtitle: "500 ml warm water with lime · 6 soaked almonds",
  },
  {
    id: "breakfast",
    band: "Morning",
    time: "8:00",
    title: "Breakfast",
    subtitle: "2 besan chilla, mint chutney · 1 katori curd",
    macro: "380 kcal · 22 g protein",
  },
  {
    id: "mid-morning",
    band: "Morning",
    time: "11:00",
    title: "Mid-morning",
    subtitle: "1 apple · 5 walnut halves",
    macro: "160 kcal",
  },
  {
    id: "lunch",
    band: "Afternoon",
    time: "13:30",
    title: "Lunch",
    subtitle: "2 phulka · dal · lauki sabzi · salad · curd",
    macro: "520 kcal · 26 g protein",
  },
  {
    id: "session",
    band: "Evening",
    time: "17:00",
    title: "Strength & core",
    subtitle: "6 movements · 24 min · resistance band",
    isSession: true,
    sessionId: "strength",
  },
  {
    id: "evening-tea",
    band: "Evening",
    time: "18:00",
    title: "Evening tea",
    subtitle: "Green tea · 30 g roasted chana",
    macro: "110 kcal",
  },
  {
    id: "dinner",
    band: "Night",
    time: "20:00",
    title: "Dinner",
    subtitle: "Grilled paneer · sautéed vegetables · clear soup",
    macro: "420 kcal · 28 g protein",
  },
  {
    id: "wind-down",
    band: "Night",
    time: "22:30",
    title: "Wind-down",
    subtitle: "150 ml turmeric milk · lights out by 10:45",
  },
];

export const timelineBands: TimelineItem["band"][] = [
  "Morning",
  "Afternoon",
  "Evening",
  "Night",
];

export function scheduleForMood(mood: string | null): TimelineItem[] {
  if (mood === "flat") {
    return baseSchedule.map((item) =>
      item.isSession
        ? {
            ...item,
            title: "Mobility flow",
            subtitle: "4 movements · 16 min · mat",
            sessionId: "mobility" as const,
          }
        : item
    );
  }
  if (mood === "drained" || mood === "unwell") {
    return baseSchedule.map((item) =>
      item.isSession
        ? {
            ...item,
            title: "Wind-down walk",
            subtitle: "Easy 20 minute walk · no load",
            sessionId: "breath" as const,
          }
        : item
    );
  }
  return baseSchedule;
}
