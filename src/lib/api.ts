import { NextResponse } from "next/server";
import { LlmError } from "./llm";

/** API 라우트 공통 오류 응답 */
export function apiError(e: unknown) {
  if (e instanceof LlmError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  const message = e instanceof Error ? e.message : "알 수 없는 오류";
  return NextResponse.json({ error: message }, { status: 500 });
}
