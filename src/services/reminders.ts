import { Ionicons } from "@expo/vector-icons";
import { invalidate, Resource, useLocalResource } from "./resource";

// Local until the API stores reminder preferences (docs/api-gaps.md). Changes last until the
// app restarts.

const RESOURCE_KEY = "reminders";

export interface Reminder {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  name: string;
  description: string;
  enabled: boolean;
}

let reminders: Reminder[] = [
  { id: "meals", icon: "restaurant", name: "Meal windows", description: "15 minutes before each slot", enabled: true },
  { id: "water", icon: "water", name: "Water", description: "Every 2 hours, 8 am – 8 pm", enabled: true },
  { id: "movement", icon: "barbell", name: "Movement", description: "At your session time", enabled: true },
  { id: "wind-down", icon: "moon", name: "Wind-down", description: "10:00 pm, screens off", enabled: false },
];

const read = () => reminders;

export function useReminders(): Resource<Reminder[]> {
  return useLocalResource(RESOURCE_KEY, read);
}

export async function setReminderEnabled(id: string, enabled: boolean): Promise<void> {
  reminders = reminders.map((r) => (r.id === id ? { ...r, enabled } : r));
  invalidate(RESOURCE_KEY);
}
