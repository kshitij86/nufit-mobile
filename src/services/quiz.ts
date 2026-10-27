import { programmeFromGoals } from "../data/quiz";

// Local until the API can take quiz answers and return the matched programme (docs/api-gaps.md).
// The questions themselves are app copy and stay in data/quiz.ts.

export type QuizAnswers = Record<string, string[]>;

/** Records the answers and returns the programme they match. */
export async function submitQuizAnswers(answers: QuizAnswers): Promise<{ programmeId: string }> {
  return { programmeId: programmeFromGoals(answers.goals ?? []) };
}
