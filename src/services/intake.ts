import { IntakeAnswers } from "../types";

// Local until the API can store the member's intake form (docs/api-gaps.md).
// The answers live in AppState while the member fills the form in.

/** Sends the completed intake to the clinic. */
export async function submitIntake(_answers: IntakeAnswers): Promise<void> {}
