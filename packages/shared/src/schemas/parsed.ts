import { z } from "zod";

export const parsedItemSchema = z.object({
  type: z.enum(["paper", "opportunity", "outreach"]),
  title: z.string().min(1),
  url: z.string().url(),
  deadline: z.string().nullable(),
  deadline_tz: z.string().nullable(),
  deadline_raw: z.string().nullable(),
  confidence: z.object({
    type: z.number().min(0).max(1),
    deadline: z.number().min(0).max(1),
    requirements: z.number().min(0).max(1),
    effort: z.number().min(0).max(1)
  }),
  requirements: z.array(z.string()),
  deliverables: z.array(z.string()),
  suggested_effort_minutes: z.number().int().positive().nullable(),
  suggested_block_minutes: z.number().int().positive().nullable(),
  summary: z.string().max(400),
  notes: z.array(z.string())
});

export type ParsedItem = z.infer<typeof parsedItemSchema>;
