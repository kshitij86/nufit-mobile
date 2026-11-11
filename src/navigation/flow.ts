import { ProgrammeState } from "../services/journey";
import { MemberStartRoute } from "./types";

/** Which signed-in navigator to show: the purchase funnel, or the app for members who bought. */
export type SignedInStage = "onboarding" | "member";

export function stageFor(status: ProgrammeState): SignedInStage {
  return status === "none" ? "onboarding" : "member";
}

/**
 * Where the member navigator opens. Someone who has just paid in this session goes straight on to
 * the intake; a returning member opens on the app.
 */
export function memberStartRoute(paymentIdThisSession: string | null): MemberStartRoute {
  return paymentIdThisSession ? "Intake" : "MainTabs";
}
