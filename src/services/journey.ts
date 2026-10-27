import { adherence14, streakWeek } from "../data/journey";
import { milestones } from "../data/milestones";
import { Milestone } from "../types";
import { readyResource, Resource } from "./resource";

// Local until the API serves programme status, adherence, reviews, milestones and streaks
// (docs/api-gaps.md). Measurements are already live: see services/measurements.ts.

export type DayState = "full" | "partial" | "missed";

export interface ProgrammeStatus {
  day: number;
  totalDays: number;
  weekday: string;
  nextReview: string;
}

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
  return readyResource({ day: 26, totalDays: 84, weekday: "Tuesday", nextReview: "28 Aug" });
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
