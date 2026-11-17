import { ProgrammeState } from "../services/journey";
import { MemberStartRoute } from "./types";

/**
 * Which signed-in navigator to show: the purchase funnel, the questionnaire (bought, not yet sent),
 * or the app.
 */
export type SignedInStage = "onboarding" | "questionnaire" | "member";

export function stageFor(status: ProgrammeState, questionnaireSent: boolean): SignedInStage {
  if (status === "none") return "onboarding";
  return questionnaireSent ? "member" : "questionnaire";
}

/**
 * Where the member navigator opens. Someone who has just sent the questionnaire for a
 * weight-management goal goes on to their first measurements; everyone else opens on the app.
 */
export function memberStartRoute(afterQuestionnaire: MemberStartRoute | null): MemberStartRoute {
  return afterQuestionnaire ?? "MainTabs";
}
