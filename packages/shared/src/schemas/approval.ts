import { z } from "zod";
import { proposalEditSchema } from "./proposal";

export const approveRequestSchema = z
  .object({
    proposalId: z.string().uuid(),
    sendToNotion: z.boolean().default(false),
    calendarId: z.string().min(1).optional()
  })
  .merge(proposalEditSchema);

export const notionStatusSchema = z.enum(["skipped", "success", "failed"]);

export const approveResponseSchema = z.object({
  approval: z.object({
    id: z.string().uuid(),
    proposalId: z.string().uuid(),
    gcalEventId: z.string().nullable(),
    notionPageId: z.string().nullable(),
    notionStatus: notionStatusSchema,
    notionError: z.string().nullable(),
    approvedAt: z.string().datetime()
  })
});

export type ApproveRequest = z.infer<typeof approveRequestSchema>;
export type ApproveResponse = z.infer<typeof approveResponseSchema>;
export type NotionStatus = z.infer<typeof notionStatusSchema>;
