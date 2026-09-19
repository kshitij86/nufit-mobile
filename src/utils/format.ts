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
