// Phone numbers for logging in with a code. Sign-up is India-only (see registration.ts), but members
// can type another country code here, so the number is kept as country code + national digits.
import { PHONE_COUNTRY_CODE, PHONE_DIGITS, phoneDigits } from "./registration";

/** India, without the "+". */
export const DEFAULT_COUNTRY_CODE = PHONE_COUNTRY_CODE.slice(1);
const COUNTRY_CODE_MAX_DIGITS = 3;
// E.164 allows at most 15 digits, country code included.
const E164_MAX_DIGITS = 15;
const NATIONAL_MIN_DIGITS = 4;

export function countryCodeDigits(text: string): string {
  return text.replace(/\D/g, "").slice(0, COUNTRY_CODE_MAX_DIGITS);
}

/** Keeps only digits; for India, also drops a pasted +91 or leading 0 like the sign-up form does. */
export function nationalDigits(countryCode: string, text: string): string {
  if (countryCode === DEFAULT_COUNTRY_CODE) return phoneDigits(text);
  return text.replace(/\D/g, "").slice(0, E164_MAX_DIGITS);
}

// A leading 0 is a domestic dialling prefix (as in 07700 900123), never part of the E.164 number.
const withoutTrunkPrefix = (national: string) => national.replace(/^0+/, "");

/** Why the number can't be sent yet, or null if it looks dialable. The server has the final say. */
export function phoneProblem(countryCode: string, national: string): string | null {
  if (!countryCode || countryCode.startsWith("0")) return "Enter a valid country code.";
  if (!national) return "Enter your mobile number.";
  if (countryCode === DEFAULT_COUNTRY_CODE) {
    if (national.length !== PHONE_DIGITS) return `Enter all ${PHONE_DIGITS} digits of your mobile number.`;
    if (!/^[6-9]/.test(national)) return "Enter a valid Indian mobile number.";
    return null;
  }
  const digits = withoutTrunkPrefix(national);
  if (digits.length < NATIONAL_MIN_DIGITS || countryCode.length + digits.length > E164_MAX_DIGITS) {
    return "Enter a valid mobile number.";
  }
  return null;
}

/** The number as the backend expects it, e.g. +919876543210. */
export function toE164(countryCode: string, national: string): string {
  return `+${countryCode}${withoutTrunkPrefix(national)}`;
}

/** The number for reading on screen, e.g. +91 98765 43210. */
export function formatPhone(countryCode: string, national: string): string {
  const digits = withoutTrunkPrefix(national);
  if (countryCode === DEFAULT_COUNTRY_CODE && digits.length === PHONE_DIGITS) {
    return `+${countryCode} ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return `+${countryCode} ${digits}`;
}
