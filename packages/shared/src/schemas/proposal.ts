import { z } from "zod";

export const proposalStatusSchema = z.enum(["proposed", "approved", "failed"]);

export const proposalSchema = z.object({
  id: z.string().uuid(),
  captureId: z.string().uuid(),
  userId: z.string().uuid(),
  parsedTitle: z.string().min(1).max(500),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  location: z.string().max(500).nullable(),
  notes: z.string().max(5000).nullable(),
  status: proposalStatusSchema,
  failureReason: z.string().max(2000).nullable(),
  timezone: z.string().min(1),
  createdAt: z.string().datetime()
});

export const proposeRequestSchema = z.object({
  captureId: z.string().uuid()
});

export const proposeResponseSchema = z.object({
  proposal: proposalSchema
});

export const proposalEditSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  location: z.string().max(500).nullable().optional(),
  notes: z.string().max(5000).nullable().optional()
});

export type Proposal = z.infer<typeof proposalSchema>;
export type ProposeRequest = z.infer<typeof proposeRequestSchema>;
export type ProposeResponse = z.infer<typeof proposeResponseSchema>;
export type ProposalEdit = z.infer<typeof proposalEditSchema>;
export type ProposalStatus = z.infer<typeof proposalStatusSchema>;
