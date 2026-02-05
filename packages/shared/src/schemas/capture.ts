import { z } from "zod";

export const capturePayloadSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1).max(500),
  selectedText: z.string().min(1).max(20000),
  snippet: z.string().min(1).max(5000).optional().nullable()
});

export const captureResponseSchema = z.object({
  capture: z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    url: z.string().url(),
    title: z.string(),
    selectedText: z.string(),
    snippet: z.string().nullable(),
    createdAt: z.string().datetime()
  })
});

export const clipRequestSchema = z.object({
  capture: capturePayloadSchema
});

export type CapturePayload = z.infer<typeof capturePayloadSchema>;
export type CaptureResponse = z.infer<typeof captureResponseSchema>;
export type ClipRequest = z.infer<typeof clipRequestSchema>;
