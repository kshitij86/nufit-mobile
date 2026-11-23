// Phone numbers for sign-up and logging in with a code. The country comes from CountryPicker, so a
// number is kept as the country's dial code (digits, no "+") plus the national digits the member typed.
import { countryByIso, DEFAULT_COUNTRY_ISO } from "../data/countries";

/** India's dial code, without the "+". */
export const DEFAULT_COUNTRY_CODE = countryByIso(DEFAULT_COUNTRY_ISO).dial;
/** An Indian mobile number is 10 digits. */
export const PHONE_DIGITS = 10;
// E.164 allows at most 15 digits, country code included.
const E164_MAX_DIGITS = 15;
const NATIONAL_MIN_DIGITS = 4;

// Keeps only digits, so pasted "98765-43210" or "+91 98765 43210" still works.
export function phoneDigits(text: string): string {
  let digits = text.replace(/\D/g, "");
  // Only strip a prefix when the length says it's there, so typing past 10 digits never shifts the number.
  if (digits.length === PHONE_DIGITS + 2 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === PHONE_DIGITS + 1 && digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, PHONE_DIGITS);
}

/** Keeps only digits; for India, also drops a pasted +91 or leading 0. */
export function nationalDigits(countryCode: string, text: string): string {
  if (countryCode === DEFAULT_COUNTRY_CODE) return phoneDigits(text);
  return text.replace(/\D/g, "").slice(0, E164_MAX_DIGITS);
}

// A leading 0 is a domestic dialling prefix (as in 07700 900123), never part of the E.164 number.
const withoutTrunkPrefix = (national: string) => national.replace(/^0+/, "");

/** Why the number can't be sent yet, or null if it looks dialable. The server has the final say. */
export function phoneProblem(countryCode: string, national: string): string | null {
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

/** The placeholder for the number field: an example for India, a plain prompt elsewhere. */
export function phonePlaceholder(countryCode: string): string {
  return countryCode === DEFAULT_COUNTRY_CODE ? "98765 43210" : "Mobile number";
}
