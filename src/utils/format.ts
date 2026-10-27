export function formatInr(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString("en-IN");
  return `₹${formatted}`;
}

export function computeBmi(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function bmiLabel(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 23) return "Normal — Asian-Indian cut-off";
  if (bmi < 25) return "Overweight — Asian-Indian cut-off";
  return "Obese — Asian-Indian cut-off";
}

/** "12 Oct", or "12 Oct 2025" outside the current year. */
export function formatDay(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) });
}

/** A signed change to one decimal, e.g. "−1.2", "+0.4", "0.0". */
export function formatSignedChange(delta: number): string {
  const rounded = Math.round(delta * 10) / 10;
  if (rounded === 0) return "0.0";
  return `${rounded < 0 ? "−" : "+"}${Math.abs(rounded).toFixed(1)}`;
}

export function formatInchesChange(delta: number): string {
  return `${formatSignedChange(delta)} in`;
}

/** A YYYY-MM-DD date as "19 Jul 1992", read as a calendar date so no time zone can shift it. */
export function formatBirthDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** "+919876543210" as "+91 98765 43210". Other numbers are shown as given. */
export function formatPhone(e164: string): string {
  const match = /^\+91(\d{5})(\d{5})$/.exec(e164);
  return match ? `+91 ${match[1]} ${match[2]}` : e164;
}
