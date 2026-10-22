import { z } from "zod";

export const providerSchema = z.enum(["kakao", "naver", "google"]);
export const sortSchema = z.enum(["latest", "popular", "rating", "balance"]);
export const suggestionStatusSchema = z.enum(["pending", "approved", "rejected"]);
export const questionSourceSchema = z.enum(["seed", "user", "ai"]);
export const suggestionOriginSchema = z.enum(["user", "ai"]);
export const cadenceSchema = z.enum(["manual", "daily", "weekly"]);

const halfStep = (value: number) => Math.abs(value * 2 - Math.round(value * 2)) < 1e-6;

export const choiceInputSchema = z.object({
  content: z.string().trim().min(1).max(255),
  imageUrl: z.string().url().optional(),
});

export const socialLoginSchema = z.object({
  provider: providerSchema,
  token: z.string().min(1),
});

export const devLoginSchema = z.object({
  provider: providerSchema,
  providerId: z.string().trim().min(1).max(255),
  nickname: z.string().trim().min(1).max(50).optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const answerSchema = z.object({
  choiceIndex: z.number().int().min(0).max(3),
});

export const commentSchema = z.object({
  content: z.string().trim().min(1).max(500),
  choiceIndex: z.number().int().min(0).max(3).optional(),
});

export const ratingSchema = z.object({
  rating: z.number().min(0.5).max(5).refine(halfStep, "별점은 0.5 단위입니다."),
});

export const suggestionSchema = z.object({
  title: z.string().trim().min(1).max(500),
  categoryId: z.string().uuid(),
  choices: z.array(choiceInputSchema).min(2).max(4),
});

export const rejectSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});

export const adultSchema = z.object({
  confirmed: z.literal(true),
});

export const reportSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});

export const aiSettingSchema = z.object({
  enabled: z.boolean(),
  cadence: cadenceSchema,
  prompt: z.string().trim().min(1).max(4000),
});

export const listQuerySchema = z.object({
  cursor: z.string().optional(),
  category: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((value) => value || undefined),
  sort: sortSchema.optional().default("latest"),
  q: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => value || undefined),
  limit: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? 20 : Number(value)))
    .pipe(z.number().int().min(1).max(50)),
});

export const userSchema = z.object({
  id: z.string().uuid(),
  provider: providerSchema,
  isAdmin: z.boolean(),
  isAdult: z.boolean(),
});

export const authResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: userSchema,
});

export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  requiresAdult: z.boolean(),
});

export const questionCardSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  source: questionSourceSchema,
  publishedAt: z.string().nullable(),
  participantCount: z.number(),
  averageRating: z.number().nullable(),
  ratingCount: z.number(),
  categories: z.array(categorySchema),
  answered: z.boolean(),
});

export const pageSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });

export type Provider = z.infer<typeof providerSchema>;
export type Sort = z.infer<typeof sortSchema>;
export type SocialLoginInput = z.infer<typeof socialLoginSchema>;
export type DevLoginInput = z.infer<typeof devLoginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type AnswerInput = z.infer<typeof answerSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type RatingInput = z.infer<typeof ratingSchema>;
export type SuggestionInput = z.infer<typeof suggestionSchema>;
export type RejectInput = z.infer<typeof rejectSchema>;
export type AdultInput = z.infer<typeof adultSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type AiSettingInput = z.infer<typeof aiSettingSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
export type PublicUser = z.infer<typeof userSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type ChoiceInput = z.infer<typeof choiceInputSchema>;
export type QuestionCard = z.infer<typeof questionCardSchema>;
