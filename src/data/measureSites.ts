import { MeasureSite } from "../types";

export const measureSites: MeasureSite[] = [
  {
    id: "arm",
    name: "Arm",
    cue: "Mid-point between armpit and elbow",
    detail:
      "Arm relaxed by your side, muscle not flexed. Tape snug, not compressing. Same arm every fortnight.",
    region: "arm",
  },
  {
    id: "waist",
    name: "Waist",
    cue: "Just below the xiphisternum",
    detail:
      "The bony tip where your ribs meet, at the base of the breastbone. Breathe out normally — do not suck in.",
    region: "torsoUpper",
  },
  {
    id: "tummy",
    name: "Tummy",
    cue: "At the level of the navel",
    detail: "Tape parallel to the floor, passing straight across the belly button.",
    region: "torsoMid",
  },
  {
    id: "belowNavel",
    name: "Below navel",
    cue: "Just below the belly button",
    detail:
      "About two finger-widths under the navel. Mark it once and use the same spot every fortnight.",
    region: "torsoLower",
  },
  {
    id: "hip",
    name: "Hip",
    cue: "At maximum protrusion",
    detail:
      "The widest point of the buttocks — the level you would sit on. Feet together, weight even.",
    region: "hip",
  },
  {
    id: "thigh",
    name: "Thigh",
    cue: "Four fingers below the groin",
    detail:
      "High on the thigh, four finger-widths under the groin crease. Stand tall, weight even on both feet.",
    region: "thigh",
  },
];
