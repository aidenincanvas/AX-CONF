import { NextResponse } from "next/server";
import { callJson, LlmError } from "@/lib/llm";
import { RecommendSchema } from "@/lib/schemas";
import { RECOMMEND_SYSTEM, recommendUser } from "@/lib/prompts";
import { apiError } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const { projectDescription } = await req.json();
    if (typeof projectDescription !== "string" || !projectDescription.trim()) {
      return NextResponse.json(
        { error: "프로젝트 설명이 필요합니다." },
        { status: 400 },
      );
    }
    const raw = await callJson(
      RECOMMEND_SYSTEM,
      recommendUser(projectDescription.trim()),
    );
    const parsed = RecommendSchema.safeParse(raw);
    if (!parsed.success) {
      throw new LlmError("LLM 추천 응답 구조가 올바르지 않습니다.");
    }
    return NextResponse.json({ specifications: parsed.data.specifications });
  } catch (e) {
    return apiError(e);
  }
}
