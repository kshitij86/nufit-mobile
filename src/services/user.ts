import { USERS_BASE_URL } from "../config";
import { ApiError } from "./http";
import { authGet } from "./session";

export interface CurrentUser {
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  /** E.164, e.g. +919876543210. */
  phoneNumber: string;
  /** YYYY-MM-DD. */
  dateOfBirth: string;
  /** ISO timestamp of when the account was created. */
  createdAt: string;
}

interface UserResponse {
  email?: unknown;
  first_name?: unknown;
  last_name?: unknown;
  phone_number?: unknown;
  date_of_birth?: unknown;
  created_at?: unknown;
}

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const user = await authGet<UserResponse | null>(`${USERS_BASE_URL}/me`, {
    fallbackError: "Couldn't load your profile. Please try again.",
  });
  const firstName = text(user?.first_name);
  const lastName = text(user?.last_name);
  if (!firstName) throw new ApiError("Couldn't load your profile. Please try again.", 200);
  return {
    email: text(user?.email),
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(" "),
    phoneNumber: text(user?.phone_number),
    dateOfBirth: text(user?.date_of_birth),
    createdAt: text(user?.created_at),
  };
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
