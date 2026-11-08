import { sleepDays, sleepWeek } from "../data/journey";
import { readyResource, Resource } from "./resource";

// Local until the API has sleep targets and logs (docs/api-gaps.md).
// Tonight's ticked-off steps live in AppState.

export interface SleepPlan {
  target: { window: string; detail: string };
  /** Last seven nights, oldest first. score is 0–100. */
  week: { day: string; score: number }[];
  routine: { id: string; title: string; detail: string; time: string }[];
}

export function useSleepPlan(): Resource<SleepPlan> {
  return readyResource({
    target: { window: "10:45 pm → 6:15 am", detail: "7 h 30 m · lights out, phone outside the room" },
    week: sleepWeek.map((score, i) => ({ day: sleepDays[i], score })),
    routine: [
      { id: "screens", title: "Screens off", detail: "Phone charges outside the bedroom", time: "10:00 pm" },
      { id: "milk", title: "Turmeric milk", detail: "150 ml toned milk, no sugar", time: "10:15 pm" },
      { id: "breath", title: "Six-minute breath", detail: "Inhale 4, hold 4, exhale 6", time: "10:30 pm" },
      { id: "lights", title: "Lights out", detail: "Room cool and fully dark", time: "10:45 pm" },
    ],
  });
}
