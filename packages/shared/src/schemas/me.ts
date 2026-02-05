import { z } from "zod";

export const integrationStatusSchema = z.object({
  provider: z.enum(["google", "notion"]),
  connected: z.boolean(),
  expiresAt: z.string().datetime().nullable(),
  scopes: z.array(z.string())
});

export const meResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().nullable(),
    image: z.string().nullable()
  }),
  integrations: z.array(integrationStatusSchema),
  defaults: z.object({
    defaultCalendarId: z.string().nullable(),
    defaultDurationMinutes: z.number().int().positive(),
    notionTargetType: z.enum(["database", "page"]).nullable(),
    notionTargetId: z.string().nullable(),
    defaultSnippetEnabled: z.boolean(),
    timezone: z.string()
  })
});

export type IntegrationStatus = z.infer<typeof integrationStatusSchema>;
export type MeResponse = z.infer<typeof meResponseSchema>;
