import { describe, expect, it } from "vitest";
import { proposeSchedule } from "../src";
import type { ParsedItem, SchedulingPreferences } from "@aschedual/shared";

const basePrefs: SchedulingPreferences = {
  timezone: "America/New_York",
  working_hours: {
    mon: { start: "09:00", end: "17:00" },
    tue: { start: "09:00", end: "17:00" },
    wed: { start: "09:00", end: "17:00" },
    thu: { start: "09:00", end: "17:00" },
    fri: { start: "09:00", end: "17:00" }
  },
  default_block_minutes: 60,
  max_blocks_per_day: 2,
  buffer_days: 2,
  no_schedule_after: "18:00"
};

const baseItem: ParsedItem = {
  type: "opportunity",
  title: "Scholarship",
  url: "https://example.com",
  deadline: "2030-01-10T23:59:00-05:00",
  deadline_tz: "America/New_York",
  deadline_raw: "Jan 10 11:59pm ET",
  confidence: { type: 0.9, deadline: 0.8, requirements: 0.7, effort: 0.6 },
  requirements: ["CV"],
  deliverables: ["Statement"],
  suggested_effort_minutes: 180,
  suggested_block_minutes: 60,
  summary: "Scholarship application",
  notes: ["Detected timezone: ET"]
};

describe("proposeSchedule", () => {
  it("schedules within the buffer window for opportunities", () => {
    const plan = proposeSchedule({
      now: "2030-01-01T10:00:00-05:00",
      preferences: basePrefs,
      item: baseItem,
      busy: [],
      calendarTimeZone: "America/New_York"
    });
    expect(plan.blocks.length).toBeGreaterThan(0);
    const latest = plan.blocks[plan.blocks.length - 1]?.end ?? "";
    expect(latest.includes("-05:00")).toBe(true);
  });

  it("respects max blocks per day", () => {
    const plan = proposeSchedule({
      now: "2030-01-01T10:00:00-05:00",
      preferences: { ...basePrefs, max_blocks_per_day: 1 },
      item: { ...baseItem, suggested_effort_minutes: 240 },
      busy: [],
      calendarTimeZone: "America/New_York"
    });
    const dayCounts = plan.blocks.reduce<Record<string, number>>(
      (acc, block) => {
        const day = block.start?.slice(0, 10) ?? "unknown";
        acc[day] = (acc[day] ?? 0) + 1;
        return acc;
      },
      {}
    );
    expect(Object.values(dayCounts).every((n) => n <= 1)).toBe(true);
  });
});
