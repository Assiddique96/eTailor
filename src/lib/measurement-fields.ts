/**
 * Gender-aware measurement field definitions.
 *
 * This is the single source of truth used by:
 *  - The in-app measurement form (customer detail page)
 *  - The public remote measurement form (/measure/[token])
 *  - The API schema validation
 *  - The measurement record display
 *
 * Each field has a label, the DB column name (camelCase), and whether
 * it applies to male, female, or both.
 */

export type MeasurementField = {
  name: string;       // matches MeasurementRecord prisma field
  label: string;
  hint?: string;      // short guide for the customer-facing form
  male: boolean;
  female: boolean;
};

export const MEASUREMENT_FIELDS: MeasurementField[] = [
  // ─── Shared (both genders) ────────────────────────────────────────
  {
    name: "chestCm",
    label: "Chest / Bust",
    hint: "Measure around the fullest part of your chest.",
    male: true, female: true,
  },
  {
    name: "waistCm",
    label: "Waist",
    hint: "Measure around your natural waistline.",
    male: true, female: true,
  },
  {
    name: "shoulderCm",
    label: "Shoulder Width",
    hint: "Measure from shoulder seam to shoulder seam across your back.",
    male: true, female: true,
  },
  {
    name: "sleeveCm",
    label: "Sleeve Length",
    hint: "From shoulder seam to wrist with arm slightly bent.",
    male: true, female: true,
  },
  {
    name: "neckCm",
    label: "Neck",
    hint: "Around the base of your neck with a finger's gap.",
    male: true, female: true,
  },

  // ─── Male-specific ────────────────────────────────────────────────
  {
    name: "inseamCm",
    label: "Inseam",
    hint: "From crotch to ankle along the inner leg.",
    male: true, female: false,
  },
  {
    name: "outseamCm",
    label: "Outseam",
    hint: "From waistband to ankle along the outer leg.",
    male: true, female: false,
  },

  // ─── Female-specific ─────────────────────────────────────────────
  {
    name: "hipCm",
    label: "Hip",
    hint: "Around the fullest part of your hips, about 20 cm below your waist.",
    male: false, female: true,
  },
];

export type Gender = "MALE" | "FEMALE" | "OTHER";

/**
 * Returns the measurement fields appropriate for the given gender.
 * "OTHER" returns all fields so nothing is excluded.
 */
export function getFieldsForGender(gender: Gender): MeasurementField[] {
  if (gender === "MALE")   return MEASUREMENT_FIELDS.filter((f) => f.male);
  if (gender === "FEMALE") return MEASUREMENT_FIELDS.filter((f) => f.female);
  return MEASUREMENT_FIELDS; // OTHER — show everything
}

/** All unique field names (for API schema validation). */
export const ALL_FIELD_NAMES = MEASUREMENT_FIELDS.map((f) => f.name);
