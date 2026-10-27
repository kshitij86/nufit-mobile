import { USERS_BASE_URL } from "../config";
import { ApiError } from "./http";
import { authGet } from "./session";

export interface CurrentUser {
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

interface UserResponse {
  email?: unknown;
  first_name?: unknown;
  last_name?: unknown;
}

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const user = await authGet<UserResponse | null>(`${USERS_BASE_URL}/me`, {
    fallbackError: "Couldn't load your profile. Please try again.",
  });
  const firstName = text(user?.first_name);
  const lastName = text(user?.last_name);
  if (!firstName) throw new ApiError("Couldn't load your profile. Please try again.", 200);
  return { email: text(user?.email), firstName, lastName, fullName: [firstName, lastName].filter(Boolean).join(" ") };
}
