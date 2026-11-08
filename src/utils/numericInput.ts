// Filters for number fields, run on every change so letters never reach the field, whether typed
// on a hardware keyboard or pasted. Range checks still happen when the form is submitted.

/** Digits and one decimal point; a comma counts as the point ("31,5 in" → "31.5"). */
export function decimalInput(text: string): string {
  const cleaned = text.replace(/,/g, ".").replace(/[^\d.]/g, "");
  const point = cleaned.indexOf(".");
  return point < 0 ? cleaned : cleaned.slice(0, point + 1) + cleaned.slice(point + 1).replace(/\./g, "");
}

/** Digits only ("32 yrs" → "32"). */
export function wholeNumberInput(text: string): string {
  return text.replace(/\D/g, "");
}
