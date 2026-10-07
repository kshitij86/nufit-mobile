// Mirrors the backend's UserCreate rules so most mistakes are caught before a round trip.

export type Gender = "female" | "male" | "non_binary" | "other" | "prefer_not_to_say";

export const genderOptions: { id: Gender; label: string }[] = [
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
  { id: "non_binary", label: "Non-binary" },
  { id: "other", label: "Other" },
  { id: "prefer_not_to_say", label: "Prefer not to say" },
];

export interface RegistrationForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string; // 10-digit Indian mobile number, without +91
  dateOfBirth: string; // DD/MM/YYYY as typed
  gender: Gender | null;
  password: string;
  passwordConfirm: string;
}

export interface RegisterRequest {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
  gender: Gender | null;
  password: string;
  password_confirm: string;
}

export type RegistrationField = keyof RegistrationForm;
export type RegistrationErrors = Partial<Record<RegistrationField, string>>;

// Top-to-bottom order on the sign-up screen, so the first error found is the first one on screen.
export const fieldOrder: RegistrationField[] = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "dateOfBirth",
  "gender",
  "password",
  "passwordConfirm",
];

// Server field name → form field, for mapping 422 validation errors back onto inputs.
export const serverFieldMap: Record<keyof RegisterRequest, RegistrationField> = {
  email: "email",
  first_name: "firstName",
  last_name: "lastName",
  phone_number: "phone",
  date_of_birth: "dateOfBirth",
  gender: "gender",
  password: "password",
  password_confirm: "passwordConfirm",
};

export const NAME_MAX_LENGTH = 50;
// Sign-up is India-only for now: the country code is fixed and the number is a 10-digit mobile.
export const PHONE_COUNTRY_CODE = "+91";
export const PHONE_DIGITS = 10;

// Keeps only digits, so pasted "98765-43210" or "+91 98765 43210" still works.
export function phoneDigits(text: string): string {
  let digits = text.replace(/\D/g, "");
  // Only strip a prefix when the length says it's there, so typing past 10 digits never shifts the number.
  if (digits.length === PHONE_DIGITS + 2 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === PHONE_DIGITS + 1 && digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, PHONE_DIGITS);
}

// Inserts slashes while typing: "01011990" → "01/01/1990".
export function formatDateInput(text: string): string {
  const digits = text.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join("/");
}

/** DD/MM/YYYY → YYYY-MM-DD, or null if it isn't a real calendar date. */
export function parseDateOfBirth(text: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim());
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const date = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
  if (date.getUTCDate() !== Number(dd) || date.getUTCMonth() !== Number(mm) - 1) return null;
  return `${yyyy}-${mm}-${dd}`;
}

export function passwordProblem(password: string): string | null {
  if (password.length < 8) return "Use at least 8 characters.";
  if (password.length > 128) return "Use 128 characters or fewer.";
  if (!/[A-Z]/.test(password)) return "Add an uppercase letter.";
  if (!/[a-z]/.test(password)) return "Add a lowercase letter.";
  if (!/\d/.test(password)) return "Add a number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Add a special character, like ! or @.";
  return null;
}

export function validateRegistration(form: RegistrationForm, today = new Date()): RegistrationErrors {
  const errors: RegistrationErrors = {};
  if (!form.firstName.trim()) errors.firstName = "Enter your first name.";
  else if (form.firstName.trim().length > NAME_MAX_LENGTH) errors.firstName = `Use ${NAME_MAX_LENGTH} characters or fewer.`;
  if (!form.lastName.trim()) errors.lastName = "Enter your last name.";
  else if (form.lastName.trim().length > NAME_MAX_LENGTH) errors.lastName = `Use ${NAME_MAX_LENGTH} characters or fewer.`;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Enter a valid email address.";
  const phone = phoneDigits(form.phone);
  if (!phone) errors.phone = "Enter your mobile number.";
  else if (phone.length !== PHONE_DIGITS) errors.phone = `Enter all ${PHONE_DIGITS} digits of your mobile number.`;
  else if (!/^[6-9]/.test(phone)) errors.phone = "Enter a valid Indian mobile number.";
  const dob = parseDateOfBirth(form.dateOfBirth);
  if (!dob) errors.dateOfBirth = "Enter a date as DD/MM/YYYY.";
  else if (dob > today.toISOString().slice(0, 10)) errors.dateOfBirth = "Date of birth can't be in the future.";
  const problem = passwordProblem(form.password);
  if (problem) errors.password = problem;
  if (!form.passwordConfirm) errors.passwordConfirm = "Re-enter your password.";
  else if (form.passwordConfirm !== form.password) errors.passwordConfirm = "Passwords don't match.";
  return errors;
}

export function toRegisterRequest(form: RegistrationForm): RegisterRequest {
  return {
    email: form.email.trim(),
    first_name: form.firstName.trim(),
    last_name: form.lastName.trim(),
    phone_number: PHONE_COUNTRY_CODE + phoneDigits(form.phone),
    date_of_birth: parseDateOfBirth(form.dateOfBirth) ?? form.dateOfBirth,
    gender: form.gender,
    password: form.password,
    password_confirm: form.passwordConfirm,
  };
}
