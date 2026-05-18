import { describe, it, expect } from "vitest";
import { toKg, fromKg, formatWeight, volumeKg } from "@/lib/utils/units";

const KG_PER_LB = 0.45359237;

describe("toKg", () => {
  it("returns value unchanged when unit is kg", () => {
    expect(toKg(100, "kg")).toBe(100);
  });

  it("converts lb to kg correctly", () => {
    expect(toKg(1, "lb")).toBeCloseTo(KG_PER_LB, 8);
  });

  it("converts 225 lb to kg correctly", () => {
    expect(toKg(225, "lb")).toBeCloseTo(225 * KG_PER_LB, 4);
  });

  it("handles zero", () => {
    expect(toKg(0, "kg")).toBe(0);
    expect(toKg(0, "lb")).toBe(0);
  });
});

describe("fromKg", () => {
  it("returns value unchanged when unit is kg", () => {
    expect(fromKg(100, "kg")).toBe(100);
  });

  it("converts kg to lb correctly", () => {
    expect(fromKg(KG_PER_LB, "lb")).toBeCloseTo(1, 6);
  });

  it("converts 100 kg to lb correctly", () => {
    expect(fromKg(100, "lb")).toBeCloseTo(100 / KG_PER_LB, 4);
  });

  it("handles zero", () => {
    expect(fromKg(0, "kg")).toBe(0);
    expect(fromKg(0, "lb")).toBe(0);
  });
});

describe("kg <-> lb round-trip", () => {
  it("toKg(fromKg(v, lb), lb) == v within floating-point tolerance", () => {
    const original = 185;
    const roundTripped = toKg(fromKg(original, "lb"), "lb");
    expect(roundTripped).toBeCloseTo(original, 8);
  });

  it("fromKg(toKg(v, lb), lb) == v within floating-point tolerance", () => {
    const original = 82.5;
    const roundTripped = fromKg(toKg(original, "lb"), "lb");
    expect(roundTripped).toBeCloseTo(original, 8);
  });

  it("kg identity round-trip is exact", () => {
    expect(toKg(fromKg(75, "kg"), "kg")).toBe(75);
  });
});

describe("formatWeight", () => {
  it("returns em-dash for null", () => {
    expect(formatWeight(null, "kg")).toBe("—");
  });

  it("formats kg without decimal when integer", () => {
    expect(formatWeight(100, "kg")).toBe("100 kg");
  });

  it("formats kg with one decimal when fractional", () => {
    expect(formatWeight(82.5, "kg")).toBe("82.5 kg");
  });

  it("strips trailing .0", () => {
    expect(formatWeight(60, "kg")).toBe("60 kg");
  });

  it("formats lb display (converted from kg)", () => {
    // 100 kg -> ~220.462 lb -> toFixed(1) -> 220.5 lb
    const result = formatWeight(100, "lb");
    expect(result).toMatch(/lb$/);
    const numPart = parseFloat(result);
    expect(numPart).toBeCloseTo(100 / KG_PER_LB, 0);
  });

  it("formats 0 kg as '0 kg'", () => {
    expect(formatWeight(0, "kg")).toBe("0 kg");
  });
});

describe("volumeKg", () => {
  it("returns weight * reps", () => {
    expect(volumeKg(100, 5)).toBe(500);
  });

  it("returns 0 when weightKg is null", () => {
    expect(volumeKg(null, 5)).toBe(0);
  });

  it("returns 0 when reps is null", () => {
    expect(volumeKg(100, null)).toBe(0);
  });

  it("returns 0 when both are null", () => {
    expect(volumeKg(null, null)).toBe(0);
  });

  it("handles fractional kg and reps", () => {
    expect(volumeKg(82.5, 8)).toBeCloseTo(660, 5);
  });
});
