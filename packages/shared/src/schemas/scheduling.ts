import { z } from "zod";

const timeString = z.string().regex(/^\d{2}:\d{2}$/, "Use HH:mm format");

export const workingHoursSchema = z.object({
  start: timeString,
  end: timeString
});

export const schedulingPreferencesSchema = z.object({
  timezone: z.string().min(1),
  working_hours: z.object({
    mon: workingHoursSchema.optional(),
    tue: workingHoursSchema.optional(),
    wed: workingHoursSchema.optional(),
    thu: workingHoursSchema.optional(),
    fri: workingHoursSchema.optional(),
    sat: workingHoursSchema.optional(),
    sun: workingHoursSchema.optional()
  }),
  default_block_minutes: z.number().int().positive(),
  max_blocks_per_day: z.number().int().positive(),
  buffer_days: z.number().int().nonnegative(),
  no_schedule_after: timeString.optional().nullable()
});

export const proposedBlockSchema = z.object({
  start: z.string(),
  end: z.string(),
  label: z.string(),
  kind: z.enum(["workblock", "deadline"])
});

export const proposedPlanSchema = z.object({
  blocks: z.array(proposedBlockSchema),
  timezone: z.string(),
  total_effort_minutes: z.number().int().nonnegative(),
  block_minutes: z.number().int().positive(),
  deadline_event_enabled: z.boolean().optional()
});

export type SchedulingPreferences = z.infer<typeof schedulingPreferencesSchema>;
export type ProposedBlock = z.infer<typeof proposedBlockSchema>;
export type ProposedPlan = z.infer<typeof proposedPlanSchema>;
