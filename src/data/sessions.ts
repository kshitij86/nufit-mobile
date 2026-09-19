import { Session } from "../types";
import { colors } from "../theme/colors";

export const sessions: Session[] = [
  {
    id: "strength",
    name: "Strength & core",
    kind: "Movement",
    minutes: 24,
    kit: "Band + mat",
    tint: colors.orangeTint,
    ink: "#B4703A",
    ring: colors.orange,
    state: "Today",
    steps: [
      {
        name: "Settle in",
        cue: "Stand tall, breathe out fully twice. Nothing to prove in the first minute.",
        seconds: 60,
      },
      {
        name: "Dynamic warm-up",
        cue: "Ankle rocks, hip openers, thoracic rotations. Keep breathing steady.",
        seconds: 180,
      },
      {
        name: "Goblet squat",
        cue: "3 × 12 — chair depth only this week. Knees track over toes.",
        seconds: 150,
      },
      {
        name: "Band row",
        cue: "3 × 15. Band at chest height, squeeze the shoulder blades, no shrugging.",
        seconds: 150,
      },
      {
        name: "Dead bug",
        cue: "3 × 10 each side. Low back stays flat. Exhale as the leg extends.",
        seconds: 120,
      },
      {
        name: "Cooldown",
        cue: "Hip flexor, hamstring, chest opener. Forty seconds each side.",
        seconds: 150,
      },
    ],
  },
  {
    id: "mobility",
    name: "Mobility flow",
    kind: "Movement",
    minutes: 16,
    kit: "Mat",
    tint: colors.sky,
    ink: colors.skyInk,
    ring: colors.skyStrong,
    state: "Wed",
    steps: [
      { name: "Cat–cow", cue: "Slow spinal waves, inhale to arch, exhale to round.", seconds: 90 },
      {
        name: "Hip 90/90",
        cue: "Rotate side to side without lifting the feet. Stay under the pain line.",
        seconds: 150,
      },
      {
        name: "Thoracic opener",
        cue: "Side-lying book opens, eyes follow the hand.",
        seconds: 150,
      },
      {
        name: "Hamstring float",
        cue: "Long spine, soft knee. Breathe out into the stretch.",
        seconds: 120,
      },
    ],
  },
  {
    id: "cardio",
    name: "Low-impact cardio",
    kind: "Movement",
    minutes: 22,
    kit: "Shoes",
    tint: colors.sage,
    ink: colors.sageInk,
    ring: colors.sageStrong,
    state: "Fri",
    steps: [
      { name: "Easy walk", cue: "Nasal breathing, relaxed shoulders.", seconds: 300 },
      { name: "Brisk block", cue: "Pick up the pace — conversational, not breathless.", seconds: 240 },
      { name: "Recover", cue: "Back to easy pace, let the heart rate settle.", seconds: 180 },
      { name: "Finish easy", cue: "Slow the last block right down.", seconds: 180 },
    ],
  },
  {
    id: "breath",
    name: "Breath & down-regulate",
    kind: "Breathwork",
    minutes: 6,
    kit: "Nothing",
    tint: colors.lilac,
    ink: colors.lilacInk,
    ring: colors.lilacStrong,
    state: "Nightly",
    steps: [
      { name: "Settle", cue: "Close your eyes, soften your jaw.", seconds: 45 },
      { name: "Inhale 4", cue: "In through the nose for a slow count of four.", seconds: 60 },
      { name: "Hold 4", cue: "Hold gently — no straining.", seconds: 60 },
      { name: "Exhale 6", cue: "Long exhale through the mouth, count of six.", seconds: 90 },
      { name: "Rest", cue: "Let your breath return to normal.", seconds: 60 },
    ],
  },
];

export function sessionById(id: string): Session {
  return sessions.find((s) => s.id === id) ?? sessions[0];
}
