import { z } from "zod";

export const captureInputSchema = z
  .object({
    url: z.string().url(),
    title: z.string().min(1),
    selected_text: z.string().optional().nullable(),
    context_snippet: z.string().optional().nullable(),
    use_page_context: z.boolean()
  })
  .superRefine((val, ctx) => {
    if (val.use_page_context && !val.context_snippet) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "context_snippet is required when use_page_context is true",
        path: ["context_snippet"]
      });
    }
  });

export type CaptureInput = z.infer<typeof captureInputSchema>;
