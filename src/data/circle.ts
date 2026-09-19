import { CircleMessage } from "../types";
import { colors } from "../theme/colors";

export const circleMembers = [
  { initials: "MR", tint: colors.orangeTint },
  { initials: "AT", tint: colors.sky },
  { initials: "SK", tint: colors.lilac },
  { initials: "NV", tint: colors.sage },
  { initials: "RG", tint: colors.amberTint },
  { initials: "PS", tint: colors.coral },
];

export const initialCircleMessages: CircleMessage[] = [
  {
    id: "m1",
    name: "Meera R.",
    initials: "MR",
    tint: colors.orangeTint,
    time: "Yesterday",
    text: "Logged day 18. The 6 pm chana genuinely stopped the night snacking for me — took about a week to settle.",
  },
  {
    id: "m2",
    name: "Dr. Kanika",
    initials: "DK",
    tint: colors.sage,
    time: "Today 8:05 am",
    text: "Reminder for the group: measure on the same weekday, same time of day. Fortnight comparisons are meaningless otherwise.",
  },
  {
    id: "m3",
    name: "Anjali T.",
    initials: "AT",
    tint: colors.sky,
    time: "Today 9:20 am",
    text: "Travelling this week — swapped the strength session for the mobility flow in a hotel room. Still counts.",
  },
];
