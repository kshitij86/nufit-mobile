import { useCallback } from "react";
import { USERS_BASE_URL } from "../config";
import { breathSession } from "../data/sessions";
import { colors } from "../theme/colors";
import { Session, SessionStep } from "../types";
import { ApiError } from "./http";
import { Resource, useResource } from "./resource";
import { authGet } from "./session";

// Workouts come from the member's published workout plan. A session's id is the date it's
// scheduled on (YYYY-MM-DD). The nightly breathwork session on Sleep isn't part of the plan and
// stays local. The API sends exercise clips too; Player doesn't play them yet.

export const WEEK_SESSIONS_RESOURCE_KEY = "workouts-week";

const WORKOUTS_URL = `${USERS_BASE_URL}/me/workouts`;
const WEEK_ERROR = "Couldn't load this week's workouts. Please try again.";
const SESSION_ERROR = "Couldn't load this workout. Please try again.";

type SessionResponse = Record<string, unknown> | null;

/** "Today", else the weekday the session is on, e.g. "Wed". */
function stateLabel(state: unknown, scheduledOn: string): string {
  if (state === "today") return "Today";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(scheduledOn);
  if (!match) return "";
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString("en-IN", { weekday: "short" });
}

function toStep(raw: Record<string, unknown> | null): SessionStep | null {
  if (!raw || typeof raw.name !== "string" || typeof raw.seconds !== "number" || raw.seconds <= 0) return null;
  return { name: raw.name, cue: typeof raw.cue === "string" ? raw.cue : "", seconds: raw.seconds };
}

function toSession(raw: SessionResponse): Session | null {
  if (!raw || typeof raw.id !== "string" || typeof raw.name !== "string" || typeof raw.minutes !== "number") {
    return null;
  }
  const steps = Array.isArray(raw.steps) ? raw.steps.map(toStep).filter((s): s is SessionStep => s !== null) : [];
  return {
    id: raw.id,
    name: raw.name,
    kind: typeof raw.kind === "string" ? raw.kind : "Movement",
    minutes: raw.minutes,
    kit: typeof raw.kit === "string" ? raw.kit : "",
    tint: colors.orangeTint,
    ink: "#B4703A",
    ring: colors.orange,
    state: stateLabel(raw.state, typeof raw.scheduled_on === "string" ? raw.scheduled_on : raw.id),
    steps,
  };
}

/** This week's sessions, Monday to Sunday. Rest days have none. */
export async function listWeekSessions(): Promise<Session[]> {
  const raw = await authGet<{ sessions?: unknown } | null>(`${WORKOUTS_URL}/week`, { fallbackError: WEEK_ERROR });
  if (!raw || !Array.isArray(raw.sessions)) throw new ApiError(WEEK_ERROR, 200);
  return raw.sessions.map(toSession).filter((s): s is Session => s !== null);
}

export async function getSession(id: string): Promise<Session> {
  const session = toSession(
    await authGet<SessionResponse>(`${WORKOUTS_URL}/sessions/${encodeURIComponent(id)}`, {
      fallbackError: SESSION_ERROR,
    })
  );
  if (!session || session.steps.length === 0) throw new ApiError(SESSION_ERROR, 200);
  return session;
}

export function useWeekSessions(): Resource<Session[]> {
  return useResource(WEEK_SESSIONS_RESOURCE_KEY, listWeekSessions);
}

export function useSession(id: string): Resource<Session> {
  const load = useCallback(
    () => (id === breathSession.id ? Promise.resolve(breathSession) : getSession(id)),
    [id]
  );
  return useResource(`workout-session:${id}`, load);
}
