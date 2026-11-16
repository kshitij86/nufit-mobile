import { MoodId } from "../types";

// Local until the API has daily check-ins (docs/api-gaps.md). The mood options are app copy and
// stay in data/moods.ts; today's choice lives in AppState.

export interface CheckIn {
  mood: MoodId;
  tags: string[];
}

/** Records how the member feels today. */
export async function submitCheckIn(_checkIn: CheckIn): Promise<void> {}
