import { useCallback } from "react";
import { USERS_BASE_URL } from "../config";
import { breathSession } from "../data/sessions";
import { colors } from "../theme/colors";
import { MediaLink, Session, SessionStep, StepVideo } from "../types";
import { ApiError } from "./http";
import { Resource, useResource } from "./resource";
import { authGet } from "./session";

// Workouts come from the member's published workout plan. A session's id is the date it's
// scheduled on (YYYY-MM-DD). The nightly breathwork session on Sleep isn't part of the plan and
// stays local. Exercise steps carry their clip, when the exercise has one.

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

function toLinks(raw: unknown): MediaLink[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (l): l is MediaLink => !!l && typeof l.language === "string" && typeof l.url === "string" && l.url !== ""
  );
}

function toVideo(raw: unknown): StepVideo | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const v = raw as Record<string, unknown>;
  if (typeof v.url !== "string" || !v.url) return undefined;
  const language = typeof v.language === "string" ? v.language : "en";
  const audioVersions = toLinks(v.audio_versions);
  return {
    url: v.url,
    thumbnailUrl: typeof v.thumbnail_url === "string" ? v.thumbnail_url : null,
    durationSec: typeof v.duration_sec === "number" ? v.duration_sec : 0,
    language,
    audioVersions: audioVersions.length ? audioVersions : [{ language, url: v.url }],
    subtitles: toLinks(v.subtitles),
  };
}

function toStep(raw: Record<string, unknown> | null): SessionStep | null {
  if (!raw || typeof raw.name !== "string" || typeof raw.seconds !== "number" || raw.seconds <= 0) return null;
  const step: SessionStep = { name: raw.name, cue: typeof raw.cue === "string" ? raw.cue : "", seconds: raw.seconds };
  if (typeof raw.exercise_code === "string") step.exerciseCode = raw.exercise_code;
  const video = toVideo(raw.video);
  if (video) step.video = video;
  return step;
}

/**
 * The session's exercises, once each, in the order they first come up: rounds repeat the
 * same exercise, and rest steps aren't exercises.
 */
export function sessionExercises(session: Session): SessionStep[] {
  const seen = new Set<string>();
  return session.steps.filter((s) => {
    if (!s.exerciseCode || seen.has(s.exerciseCode)) return false;
    seen.add(s.exerciseCode);
    return true;
  });
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
    tint: colors.blushTint,
    ink: colors.roseText,
    ring: colors.rose,
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
