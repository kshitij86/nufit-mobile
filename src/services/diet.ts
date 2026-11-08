import { USERS_BASE_URL } from "../config";
import { recipeById, recipes } from "../data/recipes";
import { Recipe, TimelineBand, TimelineItem } from "../types";
import { ApiError } from "./http";
import { ProgrammeState } from "./journey";
import { readyResource, Resource, useResource } from "./resource";
import { authGet } from "./session";

// Today's plan is the member's published diet chart and workout, from the API. Recipes and swaps
// are local until the API serves them (docs/api-gaps.md).

export const TODAY_PLAN_RESOURCE_KEY = "today-plan";

export const timelineBands: TimelineBand[] = ["Morning", "Afternoon", "Evening", "Night"];

export interface Guidance {
  notes: string[];
  waterLitres: number;
  avoid: string[];
  supplements: { name: string; dose: string; when: string }[];
}

export interface TodayPlan {
  bands: TimelineBand[];
  /** Meals, the day's session and rest-day routines, in the order the clinic set them. */
  items: TimelineItem[];
  /** Why there are no items, when there aren't any because of the programme's state. */
  reason: ProgrammeState | null;
  /** The latest note from the clinic, if any. */
  note: { author: string; text: string } | null;
  /** The clinic's guidance; null until a plan is live. */
  guidance: Guidance | null;
}

type ItemResponse = Record<string, unknown> | null;
type TodayResponse = {
  reason?: unknown;
  items?: unknown;
  note?: { author?: unknown; text?: unknown } | null;
  guidance?: {
    notes?: unknown;
    water_litres?: unknown;
    avoid?: unknown;
    supplements?: unknown;
  } | null;
} | null;

const LOAD_ERROR = "Couldn't load today's plan. Please try again.";
const str = (value: unknown) => (typeof value === "string" ? value : "");
const strings = (value: unknown) => (Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : []);

function toItem(raw: ItemResponse): TimelineItem | null {
  if (!raw || typeof raw.id !== "string" || !timelineBands.includes(raw.band as TimelineBand)) return null;
  const sessionId = raw.kind === "session" && typeof raw.session_id === "string" ? raw.session_id : undefined;
  return {
    id: raw.id,
    band: raw.band as TimelineBand,
    time: str(raw.time),
    title: str(raw.title),
    subtitle: str(raw.subtitle),
    note: str(raw.note) || undefined,
    isSession: sessionId !== undefined,
    sessionId,
  };
}

function toGuidance(raw: NonNullable<TodayResponse>["guidance"]): Guidance | null {
  if (!raw || typeof raw.water_litres !== "number") return null;
  const supplements = Array.isArray(raw.supplements) ? raw.supplements : [];
  return {
    notes: strings(raw.notes),
    waterLitres: raw.water_litres,
    avoid: strings(raw.avoid),
    supplements: supplements
      .map((s: { name?: unknown; dose?: unknown; when?: unknown } | null) => ({
        name: str(s?.name),
        dose: str(s?.dose),
        when: str(s?.when),
      }))
      .filter((s) => s.name),
  };
}

export async function fetchTodayPlan(): Promise<TodayPlan> {
  const raw = await authGet<TodayResponse>(`${USERS_BASE_URL}/me/plan/today`, { fallbackError: LOAD_ERROR });
  if (!raw || !Array.isArray(raw.items)) throw new ApiError(LOAD_ERROR, 200);
  const author = str(raw.note?.author);
  const text = str(raw.note?.text);
  return {
    bands: timelineBands,
    items: raw.items.map(toItem).filter((i): i is TimelineItem => i !== null),
    reason: typeof raw.reason === "string" ? (raw.reason as ProgrammeState) : null,
    note: author && text ? { author, text } : null,
    guidance: toGuidance(raw.guidance),
  };
}

export function useTodayPlan(): Resource<TodayPlan> {
  return useResource(TODAY_PLAN_RESOURCE_KEY, fetchTodayPlan);
}

export function useRecipes(): Resource<Recipe[]> {
  return readyResource(recipes);
}

/** data is null when there's no recipe with this id. */
export function useRecipe(id: string): Resource<Recipe | null> {
  return readyResource(recipeById(id) ?? null);
}

/** Asks the clinic to swap a recipe into today's plan. */
export async function requestRecipeSwap(_recipeId: string): Promise<void> {}
