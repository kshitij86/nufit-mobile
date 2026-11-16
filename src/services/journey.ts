import { USERS_BASE_URL } from "../config";
import { adherence14, streakWeek } from "../data/journey";
import { milestones } from "../data/milestones";
import { Milestone } from "../types";
import { formatCalendarDay } from "../utils/format";
import { ApiError } from "./http";
import { readyResource, Resource, useResource } from "./resource";
import { authGet } from "./session";

// Programme status comes from the API. Adherence, reviews, milestones and streaks are local until
// the API serves them (docs/api-gaps.md). Measurements are live too: see services/measurements.ts.

export const PROGRAMME_RESOURCE_KEY = "programme";

export type DayState = "full" | "partial" | "missed";

/**
 * none: no paid programme. awaiting_plan: paid, the clinic hasn't published a plan yet.
 * scheduled: published, starts on startDate. completed: past the last day.
 */
export type ProgrammeState = "none" | "awaiting_plan" | "scheduled" | "active" | "completed";

export interface ProgrammeStatus {
  status: ProgrammeState;
  programmeName: string | null;
  /** YYYY-MM-DD. */
  startDate: string | null;
  /** 1 on the start date; 0 until the programme starts. */
  day: number;
  totalDays: number;
  /** Today's weekday, e.g. "Tuesday". */
  weekday: string;
  /** "30 Oct", or null when no review is due before the programme ends. */
  nextReview: string | null;
  coach: string | null;
}

const STATES: ProgrammeState[] = ["none", "awaiting_plan", "scheduled", "active", "completed"];
const LOAD_ERROR = "Couldn't load your programme. Please try again.";

type ProgrammeResponse = {
  status?: unknown;
  programme?: { name?: unknown } | null;
  start_date?: unknown;
  day?: unknown;
  total_days?: unknown;
  next_review_on?: unknown;
  coach?: { name?: unknown } | null;
} | null;

const textOrNull = (value: unknown) => (typeof value === "string" && value ? value : null);

export async function fetchProgrammeStatus(now = new Date()): Promise<ProgrammeStatus> {
  const raw = await authGet<ProgrammeResponse>(`${USERS_BASE_URL}/me/programme`, { fallbackError: LOAD_ERROR });
  if (!raw || !STATES.includes(raw.status as ProgrammeState)) throw new ApiError(LOAD_ERROR, 200);
  const nextReview = textOrNull(raw.next_review_on);
  return {
    status: raw.status as ProgrammeState,
    programmeName: textOrNull(raw.programme?.name),
    startDate: textOrNull(raw.start_date),
    day: typeof raw.day === "number" ? raw.day : 0,
    totalDays: typeof raw.total_days === "number" ? raw.total_days : 0,
    weekday: now.toLocaleDateString("en-IN", { weekday: "long" }),
    nextReview: nextReview ? formatCalendarDay(nextReview) : null,
    coach: textOrNull(raw.coach?.name),
  };
}

const loadProgrammeStatus = () => fetchProgrammeStatus();

export interface Adherence {
  /** Oldest first. */
  last14: DayState[];
  daysOnPlanThisWeek: number;
}

export interface Review {
  weekLabel: string;
  quote: string;
  author: string;
  reviewedOn: string;
}

export interface Streak {
  days: number;
  headline: string;
  body: string;
  /** This week, oldest first. */
  week: DayState[];
}

export function useProgrammeStatus(): Resource<ProgrammeStatus> {
  return useResource(PROGRAMME_RESOURCE_KEY, loadProgrammeStatus);
}

export function useAdherence(): Resource<Adherence> {
  return readyResource({ last14: adherence14, daysOnPlanThisWeek: 6 });
}

export function useLatestReview(): Resource<Review> {
  return readyResource({
    weekLabel: "Week 4 review",
    quote:
      "Inches are moving faster than the scale — that is fat loss with muscle retained. Nothing changes in week 5 except the evening snack.",
    author: "Dr. Kanika",
    reviewedOn: "25 Aug",
  });
}

export function useMilestones(): Resource<Milestone[]> {
  return readyResource(milestones);
}

export function useStreak(): Resource<Streak> {
  return readyResource({
    days: 26,
    headline: "Twenty-six days of showing up.",
    body: "Not perfect days — steady ones. You have missed four, and none of them back to back. That is exactly what makes results hold.",
    week: streakWeek,
  });
}
