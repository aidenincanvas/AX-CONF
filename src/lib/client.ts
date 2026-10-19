// 클라이언트 측 fetch 래퍼. 서버 오류 메시지를 throw 한다.

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }
  if (!res.ok) {
    const msg =
      (data as { error?: string })?.error || `요청 실패 (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

export const api = { post };

/** 간단한 고유 id 생성 */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}
