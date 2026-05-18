import { describe, it, expect } from "vitest";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
} from "@/lib/validators/auth";
import {
  planCreateSchema,
  planDaySchema,
  planDayExerciseSchema,
  reorderExercisesSchema,
} from "@/lib/validators/plan";

// ---------------------------------------------------------------------------
// Auth validators
// ---------------------------------------------------------------------------

describe("signupSchema", () => {
  it("accepts valid email and password", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "securepass123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing email", () => {
    const result = signupSchema.safeParse({ email: "", password: "securepass123" });
    expect(result.success).toBe(false);
    const issues = result.error!.issues.map((i) => i.path[0]);
    expect(issues).toContain("email");
  });

  it("rejects malformed email", () => {
    const result = signupSchema.safeParse({
      email: "not-an-email",
      password: "securepass123",
    });
    expect(result.success).toBe(false);
    const issue = result.error!.issues.find((i) => i.path[0] === "email");
    expect(issue?.message).toMatch(/valid email/i);
  });

  it("rejects password shorter than 8 chars", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
    const issue = result.error!.issues.find((i) => i.path[0] === "password");
    expect(issue?.message).toMatch(/8 characters/i);
  });

  it("rejects password longer than 72 chars", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "a".repeat(73),
    });
    expect(result.success).toBe(false);
    const issue = result.error!.issues.find((i) => i.path[0] === "password");
    expect(issue?.message).toMatch(/too long/i);
  });

  it("accepts password at exactly 8 chars", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "12345678",
    });
    expect(result.success).toBe(true);
  });

  it("accepts password at exactly 72 chars", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "a".repeat(72),
    });
    expect(result.success).toBe(true);
  });
});

describe("loginSchema", () => {
  it("accepts valid email and any non-empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "x",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
    const issue = result.error!.issues.find((i) => i.path[0] === "password");
    expect(issue?.message).toMatch(/required/i);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "bad@@email",
      password: "password",
    });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts a valid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "notanemail" });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Plan validators
// ---------------------------------------------------------------------------

describe("planCreateSchema", () => {
  it("accepts valid name", () => {
    const result = planCreateSchema.safeParse({ name: "Push / Pull / Legs" });
    expect(result.success).toBe(true);
  });

  it("accepts valid name and description", () => {
    const result = planCreateSchema.safeParse({
      name: "My Plan",
      description: "A great plan for building strength.",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty string description", () => {
    const result = planCreateSchema.safeParse({ name: "My Plan", description: "" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = planCreateSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 120 chars", () => {
    const result = planCreateSchema.safeParse({ name: "a".repeat(121) });
    expect(result.success).toBe(false);
  });

  it("rejects description longer than 1000 chars", () => {
    const result = planCreateSchema.safeParse({
      name: "My Plan",
      description: "a".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("trims whitespace from name", () => {
    const result = planCreateSchema.safeParse({ name: "  My Plan  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("My Plan");
    }
  });
});

describe("planDaySchema", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";

  it("accepts a valid plan day", () => {
    const result = planDaySchema.safeParse({
      plan_id: validUuid,
      name: "Day 1 — Push",
      day_number: 1,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid uuid for plan_id", () => {
    const result = planDaySchema.safeParse({
      plan_id: "not-a-uuid",
      name: "Day 1",
      day_number: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects day_number = 0", () => {
    const result = planDaySchema.safeParse({
      plan_id: validUuid,
      name: "Day 0",
      day_number: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects day_number > 31", () => {
    const result = planDaySchema.safeParse({
      plan_id: validUuid,
      name: "Day 32",
      day_number: 32,
    });
    expect(result.success).toBe(false);
  });

  it("accepts day_number = 31", () => {
    const result = planDaySchema.safeParse({
      plan_id: validUuid,
      name: "Day 31",
      day_number: 31,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = planDaySchema.safeParse({
      plan_id: validUuid,
      name: "",
      day_number: 1,
    });
    expect(result.success).toBe(false);
  });
});

describe("planDayExerciseSchema", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";
  const exerciseUuid = "660e8400-e29b-41d4-a716-446655440001";

  const base = {
    plan_day_id: validUuid,
    exercise_id: exerciseUuid,
    position: 1,
  };

  it("accepts minimal valid input", () => {
    const result = planDayExerciseSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("accepts full valid input", () => {
    const result = planDayExerciseSchema.safeParse({
      ...base,
      target_sets: 4,
      target_reps_min: 8,
      target_reps_max: 12,
      target_weight_kg: 80,
      rest_seconds: 90,
      notes: "Keep back flat",
    });
    expect(result.success).toBe(true);
  });

  it("rejects position < 1", () => {
    const result = planDayExerciseSchema.safeParse({ ...base, position: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects target_sets > 20", () => {
    const result = planDayExerciseSchema.safeParse({ ...base, target_sets: 21 });
    expect(result.success).toBe(false);
  });

  it("rejects notes longer than 500 chars", () => {
    const result = planDayExerciseSchema.safeParse({ ...base, notes: "a".repeat(501) });
    expect(result.success).toBe(false);
  });

  it("accepts empty string notes", () => {
    const result = planDayExerciseSchema.safeParse({ ...base, notes: "" });
    expect(result.success).toBe(true);
  });

  it("rejects target_weight_kg > 1000", () => {
    const result = planDayExerciseSchema.safeParse({
      ...base,
      target_weight_kg: 1001,
    });
    expect(result.success).toBe(false);
  });
});

describe("reorderExercisesSchema", () => {
  const validUuid1 = "550e8400-e29b-41d4-a716-446655440000";
  const validUuid2 = "660e8400-e29b-41d4-a716-446655440001";
  const dayUuid = "770e8400-e29b-41d4-a716-446655440002";

  it("accepts valid reorder input", () => {
    const result = reorderExercisesSchema.safeParse({
      plan_day_id: dayUuid,
      ordered_ids: [validUuid1, validUuid2],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty ordered_ids array", () => {
    const result = reorderExercisesSchema.safeParse({
      plan_day_id: dayUuid,
      ordered_ids: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-uuid values in ordered_ids", () => {
    const result = reorderExercisesSchema.safeParse({
      plan_day_id: dayUuid,
      ordered_ids: ["not-a-uuid"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid plan_day_id uuid", () => {
    const result = reorderExercisesSchema.safeParse({
      plan_day_id: "bad-id",
      ordered_ids: [validUuid1],
    });
    expect(result.success).toBe(false);
  });
});
