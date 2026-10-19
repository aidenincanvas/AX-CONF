import { NextResponse } from "next/server";
import { callMarkdown } from "@/lib/llm";
import { ProjectContextSchema } from "@/lib/schemas";
import { SPEC_SYSTEM, specUser } from "@/lib/prompts";
import { apiError } from "@/lib/api";
import type { Specification } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { context, spec } = await req.json();
    const ctx = ProjectContextSchema.safeParse(context);
    if (!ctx.success) {
      return NextResponse.json(
        { error: "프로젝트 공통 컨텍스트가 필요합니다." },
        { status: 400 },
      );
    }
    const s = spec as Specification;
    if (!s?.title) {
      return NextResponse.json(
        { error: "생성할 명세서 정보가 필요합니다." },
        { status: 400 },
      );
    }
    const markdown = await callMarkdown(SPEC_SYSTEM, specUser(ctx.data, s));
    return NextResponse.json({ markdown });
  } catch (e) {
    return apiError(e);
  }
}
