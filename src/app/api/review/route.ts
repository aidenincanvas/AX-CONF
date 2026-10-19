import { NextResponse } from "next/server";
import { callJson, LlmError } from "@/lib/llm";
import { ReviewSchema } from "@/lib/schemas";
import { REVIEW_SYSTEM, reviewUser } from "@/lib/prompts";
import { apiError } from "@/lib/api";
import type { ReviewItem, Specification } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { projectDescription, specs } = await req.json();
    if (typeof projectDescription !== "string" || !projectDescription.trim()) {
      return NextResponse.json(
        { error: "프로젝트 설명이 필요합니다." },
        { status: 400 },
      );
    }
    if (!Array.isArray(specs) || specs.length === 0) {
      return NextResponse.json(
        { error: "검토할 명세서 목록이 필요합니다." },
        { status: 400 },
      );
    }
    const specList = specs as Specification[];
    const raw = await callJson(
      REVIEW_SYSTEM,
      reviewUser(projectDescription.trim(), specList),
    );
    const parsed = ReviewSchema.safeParse(raw);
    if (!parsed.success) {
      throw new LlmError("LLM 검토 응답 구조가 올바르지 않습니다.");
    }
    // targetTitle -> 기존 명세서 id 매핑
    const byTitle = new Map(specList.map((s) => [s.title.trim(), s.id]));
    const reviews: ReviewItem[] = parsed.data.reviews.map((r) => ({
      targetId: r.targetTitle ? (byTitle.get(r.targetTitle.trim()) ?? null) : null,
      title: r.title,
      status: r.status,
      reason: r.reason,
      suggestedSections: r.suggestedSections,
      suggestedDescription: r.suggestedDescription,
    }));
    return NextResponse.json({ reviews });
  } catch (e) {
    return apiError(e);
  }
}
