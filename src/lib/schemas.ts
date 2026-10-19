import { z } from "zod";

// LLM JSON 응답 검증 스키마. 서버에서 구조를 검증한다.

export const RecommendSchema = z.object({
  specifications: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().default(""),
        sections: z.array(z.string()).default([]),
        reason: z.string().default(""),
        required: z.boolean().default(false),
      }),
    )
    .min(1),
});
export type RecommendResponse = z.infer<typeof RecommendSchema>;

export const ReviewSchema = z.object({
  reviews: z
    .array(
      z.object({
        targetTitle: z.string().nullable().default(null),
        title: z.string().min(1),
        status: z.enum(["adequate", "add", "modify", "delete"]),
        reason: z.string().default(""),
        suggestedSections: z.array(z.string()).optional(),
        suggestedDescription: z.string().optional(),
      }),
    )
    .default([]),
});
export type ReviewResponse = z.infer<typeof ReviewSchema>;

export const ProjectContextSchema = z.object({
  projectName: z.string().default(""),
  projectDescription: z.string().default(""),
  projectPurpose: z.string().default(""),
  mainUsers: z.string().default(""),
  coreFeatures: z.array(z.string()).default([]),
  technicalAssumptions: z.array(z.string()).default([]),
  specList: z.array(z.string()).default([]),
  glossary: z
    .array(z.object({ term: z.string(), definition: z.string() }))
    .default([]),
});
export type ProjectContextResponse = z.infer<typeof ProjectContextSchema>;
