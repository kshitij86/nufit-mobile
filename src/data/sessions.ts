import { Session } from "../types";
import { colors } from "../theme/colors";

/** The nightly wind-down on Sleep. Not part of the clinic's workout plan, so it lives in the app. */
export const breathSession: Session = {
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
};
