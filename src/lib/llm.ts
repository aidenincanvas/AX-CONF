import "server-only";
import OpenAI from "openai";

// 서버 전용 OpenAI 클라이언트. API Key는 환경변수로만 관리하며 브라우저에 노출하지 않는다.

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!apiKey) {
    throw new LlmError(
      "OPENAI_API_KEY가 설정되지 않았습니다. .env.local에 키를 추가하세요.",
      500,
    );
  }
  if (!client) {
    client = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });
  }
  return client;
}

export class LlmError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "LlmError";
    this.status = status;
  }
}

/** JSON 모드 호출. 파싱된 객체를 반환한다. */
export async function callJson(
  system: string,
  user: string,
): Promise<unknown> {
  const openai = getClient();
  let content: string | null;
  try {
    const res = await openai.chat.completions.create({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    content = res.choices[0]?.message?.content ?? null;
  } catch (e) {
    throw new LlmError(`LLM 호출 실패: ${errMsg(e)}`);
  }
  if (!content) throw new LlmError("LLM이 빈 응답을 반환했습니다.");
  try {
    return JSON.parse(content);
  } catch {
    throw new LlmError("LLM JSON 응답을 파싱할 수 없습니다.");
  }
}

/** Markdown 본문 생성 호출. 문자열을 반환한다. */
export async function callMarkdown(
  system: string,
  user: string,
): Promise<string> {
  const openai = getClient();
  try {
    const res = await openai.chat.completions.create({
      model,
      temperature: 0.5,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const content = res.choices[0]?.message?.content ?? "";
    if (!content.trim()) throw new LlmError("LLM이 빈 명세서를 반환했습니다.");
    return content;
  } catch (e) {
    if (e instanceof LlmError) throw e;
    throw new LlmError(`LLM 호출 실패: ${errMsg(e)}`);
  }
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
