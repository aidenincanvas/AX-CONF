import { NextResponse } from "next/server";
import { callJson, LlmError } from "@/lib/llm";
import { ProjectContextSchema } from "@/lib/schemas";
import { CONTEXT_SYSTEM, contextUser } from "@/lib/prompts";
import { apiError } from "@/lib/api";
import type { Specification } from "@/lib/types";

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
        { error: "확정된 명세서 목록이 필요합니다." },
        { status: 400 },
      );
    }
    const raw = await callJson(
      CONTEXT_SYSTEM,
      contextUser(projectDescription.trim(), specs as Specification[]),
    );
    const parsed = ProjectContextSchema.safeParse(raw);
    if (!parsed.success) {
      throw new LlmError("LLM 공통 컨텍스트 응답 구조가 올바르지 않습니다.");
    }
    return NextResponse.json({ context: parsed.data });
  } catch (e) {
    return apiError(e);
  }
}
