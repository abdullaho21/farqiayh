import { z } from "zod";
export const mediaUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (!value || /^\/api\/media\/[a-z0-9]+$/.test(value)) return true;
    try {
      const u = new URL(value);
      return u.protocol === "https:" && !u.username && !u.password;
    } catch {
      return false;
    }
  }, "Use an HTTPS image URL or upload a file.")
  .nullable()
  .optional();
export const optionInput = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(1, "Every option needs a label.").max(200),
  mediaUrl,
  isText: z.boolean().default(false),
});
export const questionInput = z
  .object({
    id: z.string().optional(),
    title: z.string().trim().min(1, "Every question needs a title.").max(300),
    mediaUrl,
    type: z.enum(["SINGLE", "MULTIPLE"]),
    maxSelections: z.number().int().min(1).max(50),
    options: z.array(optionInput).min(2, "Add at least two options.").max(50),
  })
  .superRefine((q, ctx) => {
    if (q.type === "SINGLE" && q.maxSelections !== 1)
      ctx.addIssue({
        code: "custom",
        message: "Single-choice questions allow one selection.",
      });
    if (q.maxSelections > q.options.length)
      ctx.addIssue({
        code: "custom",
        message: "The selection limit cannot exceed the option count.",
      });
    if (q.options.filter((o) => o.isText).length > 1)
      ctx.addIssue({
        code: "custom",
        message: "Only one text-answer option is allowed per question.",
      });
    const ids = q.options.flatMap((o) => (o.id ? [o.id] : []));
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({ code: "custom", message: "Duplicate option IDs." });
  });
export const pollInput = z
  .object({
    title: z.string().trim().min(1, "Give your poll a title.").max(160),
    description: z.string().trim().max(2000).default(""),
    questions: z.array(questionInput).min(1).max(30),
  })
  .superRefine((p, ctx) => {
    const ids = p.questions.flatMap((q) => (q.id ? [q.id] : []));
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({ code: "custom", message: "Duplicate question IDs." });
  });
export const voteInput = z.object({
  pollId: z.string().min(1),
  questionId: z.string().min(1),
  optionIds: z.array(z.string()).min(1, "Choose an option.").max(50),
  text: z.string().trim().max(1000).optional(),
  displayName: z.string().trim().max(60).optional(),
});
export type PollInput = z.infer<typeof pollInput>;
