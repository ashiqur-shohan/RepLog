import { describe, it, expect } from "vitest";
import { formatDuration, formatTimer, pluralize } from "@/lib/utils/format";

describe("formatDuration", () => {
  it("formats seconds-only (< 60s)", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(1)).toBe("1s");
    expect(formatDuration(59)).toBe("59s");
  });

  it("formats minutes without remainder seconds", () => {
    expect(formatDuration(60)).toBe("1m");
    expect(formatDuration(120)).toBe("2m");
    expect(formatDuration(3600)).toBe("1h");
  });

  it("formats minutes with remainder seconds", () => {
    expect(formatDuration(90)).toBe("1m 30s");
    expect(formatDuration(125)).toBe("2m 5s");
  });

  it("formats hours without remainder minutes", () => {
    // 3600 * 1 = 3600s -> 60m -> 1h
    expect(formatDuration(3600 * 1 + 60 * 60)).toBe("2h");
    expect(formatDuration(3600 * 2)).toBe("2h");
  });

  it("formats hours with remainder minutes", () => {
    expect(formatDuration(3600 + 1800)).toBe("1h 30m");
    expect(formatDuration(3600 * 2 + 60 * 15)).toBe("2h 15m");
  });

  it("ignores sub-minute remainder when in hour display", () => {
    // 1h 30m 45s -> the function only shows h and m at this scale
    expect(formatDuration(3600 + 1800 + 45)).toBe("1h 30m");
  });
});

describe("formatTimer", () => {
  it("formats 0 as '00:00'", () => {
    expect(formatTimer(0)).toBe("00:00");
  });

  it("pads single-digit minutes and seconds", () => {
    expect(formatTimer(65)).toBe("01:05");
  });

  it("formats 90 seconds as '01:30'", () => {
    expect(formatTimer(90)).toBe("01:30");
  });

  it("formats 3599 seconds as '59:59'", () => {
    expect(formatTimer(3599)).toBe("59:59");
  });

  it("formats 3600 seconds as '60:00'", () => {
    expect(formatTimer(3600)).toBe("60:00");
  });

  it("pads zero seconds correctly", () => {
    expect(formatTimer(60)).toBe("01:00");
    expect(formatTimer(120)).toBe("02:00");
  });
});

describe("pluralize", () => {
  it("uses singular for n = 1", () => {
    expect(pluralize(1, "set")).toBe("1 set");
    expect(pluralize(1, "rep")).toBe("1 rep");
  });

  it("appends 's' for n != 1 when no plural provided", () => {
    expect(pluralize(0, "set")).toBe("0 sets");
    expect(pluralize(2, "set")).toBe("2 sets");
    expect(pluralize(5, "rep")).toBe("5 reps");
  });

  it("uses provided plural form", () => {
    expect(pluralize(2, "person", "people")).toBe("2 people");
    expect(pluralize(1, "person", "people")).toBe("1 person");
  });

  it("handles large numbers", () => {
    expect(pluralize(100, "workout")).toBe("100 workouts");
  });

  it("uses singular for n = 1 with explicit plural", () => {
    expect(pluralize(1, "foot", "feet")).toBe("1 foot");
  });
});
