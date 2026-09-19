import { MoodOption } from "../types";
import { colors } from "../theme/colors";

export const moodOptions: MoodOption[] = [
  {
    id: "energised",
    label: "Energised",
    sub: "Slept well, ready to move",
    dot: colors.orange,
    bg: colors.orangeTint,
    note: "Good — we will use it. Strength session stays at 5 pm and dinner protein goes up by 10 g.",
  },
  {
    id: "steady",
    label: "Steady",
    sub: "Nothing remarkable",
    dot: colors.amberStrong,
    bg: colors.amberTint,
    note: "Steady is the goal. Today runs exactly as Dr. Kanika wrote it — nothing to change.",
  },
  {
    id: "flat",
    label: "Flat",
    sub: "Low energy, a bit foggy",
    dot: colors.skyStrong,
    bg: colors.sky,
    note: "Noted. Your session is shortened to 16 minutes of mobility and the evening snack moves 30 minutes earlier.",
  },
  {
    id: "drained",
    label: "Drained",
    sub: "Running on empty",
    dot: colors.lilacStrong,
    bg: colors.lilac,
    note: "Rest is programmed, not earned. Training is replaced with a wind-down walk; keep the meals exactly as written.",
  },
  {
    id: "unwell",
    label: "Unwell",
    sub: "Something is off",
    dot: colors.sageStrong,
    bg: colors.sage,
    note: "Training is paused today. Stay on fluids and the light meals below — message the clinic if this runs past 48 hours.",
  },
];

export const moodTags = ["Slept badly", "Hungry", "Cramps", "Stressed", "Sore", "Travelling"];

export function moodById(id: string | null): MoodOption {
  return moodOptions.find((m) => m.id === id) ?? moodOptions[1];
}
