import { circleMembers, initialCircleMessages } from "../data/circle";
import { colors } from "../theme/colors";
import { CircleMessage } from "../types";
import { invalidate, Resource, useLocalResource } from "./resource";

// Local until the API has member circles (docs/api-gaps.md). Posts last until the app restarts.

const RESOURCE_KEY = "circle";

export interface CircleData {
  members: { initials: string; tint: string }[];
  challenge: { label: string; title: string; detail: string; progress: number };
  contribution: { days: number; note: string };
  messages: CircleMessage[];
}

let messages = initialCircleMessages;

const read = (): CircleData => ({
  members: circleMembers,
  challenge: {
    label: "August challenge",
    title: "20 movement days, together",
    detail: "142 of 200 days logged by the group",
    progress: 0.71,
  },
  contribution: {
    days: 18,
    note: "You have not missed two days in a row all month. That consistency is the whole point.",
  },
  messages,
});

export function useCircle(): Resource<CircleData> {
  return useLocalResource(RESOURCE_KEY, read);
}

export async function postCircleMessage(text: string, author: { name: string; initials: string }): Promise<void> {
  messages = [
    ...messages,
    { id: `you-${Date.now()}`, name: author.name, initials: author.initials, tint: colors.orangeTint, time: "Just now", text },
  ];
  invalidate(RESOURCE_KEY);
}
