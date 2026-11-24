import { navigationRef } from "../navigation/navigationRef";
import { TODAY_PLAN_RESOURCE_KEY } from "./diet";
import { PROGRAMME_RESOURCE_KEY } from "./journey";
import { invalidate } from "./resource";
import { WEEK_SESSIONS_RESOURCE_KEY } from "./workouts";

// What the app does with the push the API sends when the clinic approves (publishes) a member's
// plan. The API only sends it to that member's phones; it carries data.type = "plan_approved".
// Kept free of Firebase so it runs (and tests) anywhere.

export const PLAN_APPROVED_PUSH = "plan_approved";

export function isPlanApprovedPush(data: unknown): boolean {
  return !!data && typeof data === "object" && (data as { type?: unknown }).type === PLAN_APPROVED_PUSH;
}

/** Reloads what changes when a plan is approved, so Today stops saying "being prepared". */
export function refreshPlan() {
  invalidate(PROGRAMME_RESOURCE_KEY);
  invalidate(TODAY_PLAN_RESOURCE_KEY);
  invalidate(WEEK_SESSIONS_RESOURCE_KEY);
}

let pendingToday = false;

function canOpenToday(): boolean {
  return navigationRef.isReady() && !!navigationRef.getRootState()?.routeNames.includes("MainTabs");
}

/**
 * Opens the Today tab. A tap can arrive before the member screens exist (cold start, session still
 * loading); then it waits, and `openPendingToday` (called on every navigation change) finishes it.
 */
export function openToday() {
  if (canOpenToday()) {
    pendingToday = false;
    navigationRef.navigate("MainTabs", { screen: "Today" });
  } else {
    pendingToday = true;
  }
}

export function openPendingToday() {
  if (pendingToday) openToday();
}

/** A plan-approved notification was tapped: show the new plan. Ignores every other push. */
export function handlePushOpened(data: unknown) {
  if (!isPlanApprovedPush(data)) return;
  refreshPlan();
  openToday();
}

/** A push arrived while the app is open: refresh the plan if it's the plan-approved one. */
export function handlePushReceived(data: unknown) {
  if (isPlanApprovedPush(data)) refreshPlan();
}
