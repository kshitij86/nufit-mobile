import { sessionById, sessions } from "../data/sessions";
import { Session } from "../types";
import { readyResource, Resource } from "./resource";

// Local until the API serves the member's published workout plan and exercise videos
// (docs/api-gaps.md). Sessions are timed steps with no video yet.

export function useWeekSessions(): Resource<Session[]> {
  return readyResource(sessions);
}

export function useSession(id: string): Resource<Session> {
  return readyResource(sessionById(id));
}
