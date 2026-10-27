import { recipeById, recipes } from "../data/recipes";
import { scheduleForMood, timelineBands } from "../data/schedule";
import { Recipe, TimelineBand, TimelineItem } from "../types";
import { readyResource, Resource } from "./resource";

// Local until the API serves the member's published diet chart and recipes (docs/api-gaps.md).

export interface TodayPlan {
  bands: TimelineBand[];
  /** Meals, the day's session and wind-down, adjusted for today's mood. */
  items: TimelineItem[];
  /** The latest note from the clinic, if any. */
  note: { author: string; text: string } | null;
}

export function useTodayPlan(mood: string | null): Resource<TodayPlan> {
  return readyResource({
    bands: timelineBands,
    items: scheduleForMood(mood),
    note: {
      author: "Dr. Kanika",
      text: "Evening hunger noted twice this week — roasted chana goes up to 30 g from today. Keep dinner before 8:30 pm.",
    },
  });
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
