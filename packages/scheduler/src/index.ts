import { DateTime, Interval } from "luxon";
import type {
  ParsedItem,
  SchedulingPreferences,
  ProposedBlock,
  ProposedPlan
} from "@aschedual/shared";

export type BusyInterval = { start: string; end: string };

const weekdayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

function dayKeyFor(dt: DateTime) {
  return weekdayKeys[dt.weekday - 1];
}

function setTime(dt: DateTime, hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return dt.set({ hour: h, minute: m, second: 0, millisecond: 0 });
}

function overlapsBusy(
  start: DateTime,
  end: DateTime,
  busyIntervals: Interval[]
) {
  const slot = Interval.fromDateTimes(start, end);
  return busyIntervals.some((interval) => interval.overlaps(slot));
}

function clampBlockMinutes(minutes: number) {
  if (minutes < 20) return 20;
  if (minutes > 45) return 45;
  return minutes;
}

function buildBusyIntervals(
  busy: BusyInterval[],
  tz: string
): Interval[] {
  return busy.map((b) =>
    Interval.fromDateTimes(
      DateTime.fromISO(b.start).setZone(tz),
      DateTime.fromISO(b.end).setZone(tz)
    )
  );
}

export function proposeSchedule(args: {
  now: string;
  preferences: SchedulingPreferences;
  item: ParsedItem;
  busy: BusyInterval[];
  calendarTimeZone: string;
  deadlineEventEnabled?: boolean;
}): ProposedPlan {
  const { preferences, item, busy, calendarTimeZone } = args;
  const now = DateTime.fromISO(args.now).setZone(calendarTimeZone);
  const busyIntervals = buildBusyIntervals(busy, calendarTimeZone);

  const blockMinutes =
    item.suggested_block_minutes ?? preferences.default_block_minutes;
  const totalEffort =
    item.suggested_effort_minutes ?? preferences.default_block_minutes;
  const blocksNeeded = Math.max(1, Math.ceil(totalEffort / blockMinutes));
  const blocks: ProposedBlock[] = [];

  let windowEnd = now.plus({ days: 14 });
  if (item.type === "opportunity" && item.deadline) {
    const deadline = DateTime.fromISO(item.deadline).setZone(calendarTimeZone);
    windowEnd = deadline.minus({ days: preferences.buffer_days });
  }
  if (item.type === "paper") {
    windowEnd = now.plus({ days: 10 });
  }

  const startDate = now.startOf("day");
  const endDate = windowEnd.startOf("day");

  let day = startDate;
  while (day <= endDate && blocks.length < blocksNeeded) {
    const dayKey = dayKeyFor(day);
    const hours = preferences.working_hours[dayKey];
    if (!hours) {
      day = day.plus({ days: 1 });
      continue;
    }

    let dayStart = setTime(day, hours.start);
    let dayEnd = setTime(day, hours.end);
    if (preferences.no_schedule_after) {
      const clampEnd = setTime(day, preferences.no_schedule_after);
      if (clampEnd < dayEnd) {
        dayEnd = clampEnd;
      }
    }

    let blocksToday = 0;
    let slotStart = dayStart;
    while (
      slotStart.plus({ minutes: blockMinutes }) <= dayEnd &&
      blocksToday < preferences.max_blocks_per_day &&
      blocks.length < blocksNeeded
    ) {
      const slotEnd = slotStart.plus({ minutes: blockMinutes });
      if (slotEnd > now && !overlapsBusy(slotStart, slotEnd, busyIntervals)) {
        const index = blocks.length + 1;
        blocks.push({
          start: slotStart.toISO(),
          end: slotEnd.toISO(),
          label: `Work: ${item.title} (Block ${index}/${blocksNeeded})`,
          kind: "workblock"
        });
        blocksToday += 1;
      }
      slotStart = slotStart.plus({ minutes: blockMinutes });
    }
    day = day.plus({ days: 1 });
  }

  if (item.type === "outreach") {
    const followUpMinutes = clampBlockMinutes(blockMinutes);
    const followUpWindowStart = now.plus({ days: 3 }).startOf("day");
    const followUpWindowEnd = now.plus({ days: 7 }).startOf("day");
    let followDay = followUpWindowStart;
    while (followDay <= followUpWindowEnd) {
      const dayKey = dayKeyFor(followDay);
      const hours = preferences.working_hours[dayKey];
      if (!hours) {
        followDay = followDay.plus({ days: 1 });
        continue;
      }
      let slotStart = setTime(followDay, hours.start);
      let dayEnd = setTime(followDay, hours.end);
      if (preferences.no_schedule_after) {
        const clampEnd = setTime(followDay, preferences.no_schedule_after);
        if (clampEnd < dayEnd) {
          dayEnd = clampEnd;
        }
      }
      if (
        slotStart.plus({ minutes: followUpMinutes }) <= dayEnd &&
        !overlapsBusy(
          slotStart,
          slotStart.plus({ minutes: followUpMinutes }),
          busyIntervals
        )
      ) {
        const index = blocks.length + 1;
        blocks.push({
          start: slotStart.toISO(),
          end: slotStart.plus({ minutes: followUpMinutes }).toISO(),
          label: `Work: ${item.title} (Block ${index}/${index})`,
          kind: "workblock"
        });
        break;
      }
      followDay = followDay.plus({ days: 1 });
    }
  }

  return {
    blocks,
    timezone: calendarTimeZone,
    total_effort_minutes: totalEffort,
    block_minutes: blockMinutes,
    deadline_event_enabled: args.deadlineEventEnabled
  };
}
