export type WeightUnit = "kg" | "lb";

const KG_PER_LB = 0.45359237;

/** Convert a kg-stored weight to the user's preferred display unit. */
export function fromKg(valueKg: number, unit: WeightUnit): number {
  if (unit === "kg") return valueKg;
  return valueKg / KG_PER_LB;
}

/** Convert a user-entered weight (in their preferred unit) into canonical kg. */
export function toKg(value: number, unit: WeightUnit): number {
  if (unit === "kg") return value;
  return value * KG_PER_LB;
}

/** Format a kg-stored weight for display, rounded to 1 decimal. */
export function formatWeight(valueKg: number | null, unit: WeightUnit): string {
  if (valueKg === null || valueKg === undefined) return "—";
  const v = fromKg(valueKg, unit);
  return `${v.toFixed(1).replace(/\.0$/, "")} ${unit}`;
}

/** Compute volume in kg (weight × reps), ignoring null reps or weight. */
export function volumeKg(weightKg: number | null, reps: number | null): number {
  if (weightKg === null || reps === null) return 0;
  return weightKg * reps;
}
