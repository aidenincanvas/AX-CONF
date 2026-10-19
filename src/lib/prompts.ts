import type { ProjectContext, Specification, ReviewItem } from "./types";
import { REVIEW_STATUS_LABEL } from "./types";

// LLM 작업별 프롬프트 빌더.

export const RECOMMEND_SYSTEM = `당신은 숙련된 소프트웨어 아키텍트입니다.
주어진 프로젝트 설명을 분석하여, 개발에 꼭 필요한 '최소' 명세서 목록을 추천합니다.

규칙:
1. 프로젝트 규모와 특성을 고려합니다.
2. 실제 개발에 필요한 명세서만 추천합니다. 불필요한 문서는 제외합니다.
3. 명세서 간 역할이 중복되지 않게 합니다.
4. MVP 수준에 적합한 구성을 우선합니다.
5. 4~7개 범위로 추천합니다.

반드시 아래 JSON 스키마로만 응답합니다:
{
  "specifications": [
    {
      "title": "명세서 이름",
      "description": "명세서 목적 한두 문장",
      "sections": ["주요 작성 항목1", "항목2"],
      "reason": "이 명세서를 추천한 이유",
      "required": true
    }
  ]
}`;

export function recommendUser(projectDescription: string): string {
  return `프로젝트 설명:\n"""${projectDescription}"""\n\n위 프로젝트에 필요한 최소 명세서 목록을 JSON으로 추천하세요.`;
}

export const REVIEW_SYSTEM = `당신은 숙련된 소프트웨어 아키텍트입니다.
사용자가 수정한 명세서 목록을 검토합니다.

검토 항목:
1. 필수 명세서 누락 여부
2. 명세서 간 중복 여부
3. 프로젝트 목적과의 적합성
4. 불필요한 명세서 존재 여부
5. 추가하면 좋은 명세서
6. 명세서별 작성 항목의 적절성

중요:
- 기존 명세서 목록을 직접 변경하지 마세요. 의견만 제시합니다.
- 각 의견에는 구체적 이유를 포함합니다.
- status 값: adequate(적합), add(추가 권장), modify(수정 권장), delete(삭제 권장)
- 기존 명세서에 대한 의견이면 targetTitle에 해당 제목을, 신규 추가 제안이면 targetTitle은 null.

반드시 아래 JSON 스키마로만 응답합니다:
{
  "reviews": [
    {
      "targetTitle": "대상 명세서 제목 또는 null",
      "title": "의견 제목(신규 제안 시 제안 명세서 이름)",
      "status": "adequate | add | modify | delete",
      "reason": "구체적 이유",
      "suggestedSections": ["(add/modify 시) 제안 작성 항목"],
      "suggestedDescription": "(add/modify 시) 제안 설명"
    }
  ]
}`;

export function reviewUser(
  projectDescription: string,
  specs: Specification[],
): string {
  const list = specs
    .map(
      (s, i) =>
        `${i + 1}. [${s.required ? "필수" : "선택"}] ${s.title}\n   설명: ${s.description}\n   작성항목: ${s.sections.join(", ") || "(없음)"}`,
    )
    .join("\n");
  return `프로젝트 설명:\n"""${projectDescription}"""\n\n현재 명세서 목록:\n${list}\n\n위 구성을 검토하고 JSON으로 의견을 제시하세요.`;
}

export const CONTEXT_SYSTEM = `당신은 숙련된 소프트웨어 아키텍트입니다.
프로젝트 설명과 확정된 명세서 목록을 기반으로, 모든 명세서 생성에 공통으로 사용할 '프로젝트 공통 컨텍스트'를 구성합니다.

규칙:
- 정보가 부족한 항목은 임의로 확정하지 말고 값 앞에 "(가정) " 또는 "(확인 필요) "를 붙입니다.
- 명세서 간 일관성의 기준이 되므로 명확하고 간결하게 작성합니다.

반드시 아래 JSON 스키마로만 응답합니다:
{
  "projectName": "프로젝트 이름",
  "projectDescription": "프로젝트 설명",
  "projectPurpose": "프로젝트 목적",
  "mainUsers": "주요 사용자",
  "coreFeatures": ["핵심 기능1", "기능2"],
  "technicalAssumptions": ["주요 기술적 가정1"],
  "specList": ["명세서 제목1", "제목2"],
  "glossary": [{ "term": "공통 용어", "definition": "정의" }]
}`;

export function contextUser(
  projectDescription: string,
  specs: Specification[],
): string {
  const titles = specs.map((s) => `- ${s.title}: ${s.description}`).join("\n");
  return `프로젝트 설명:\n"""${projectDescription}"""\n\n확정된 명세서 목록:\n${titles}\n\n위 정보로 프로젝트 공통 컨텍스트를 JSON으로 구성하세요.`;
}

export const SPEC_SYSTEM = `당신은 숙련된 소프트웨어 아키텍트입니다.
프로젝트 공통 컨텍스트에 맞춰 하나의 명세서를 실제 개발에 쓸 수 있는 수준의 Markdown 문서로 작성합니다.

규칙:
- 공통 컨텍스트(목적/사용자/기능 명칭/데이터 엔티티/용어/기술 가정)와 일관되게 작성합니다.
- 공통 컨텍스트와 충돌하는 내용을 임의로 확정하지 말고 "(확인 필요)"로 표시합니다.
- 해당 명세서의 '주요 작성 항목'을 모두 섹션으로 포함합니다.
- 순수 Markdown 본문만 출력합니다. 코드펜스(\`\`\`markdown)로 전체를 감싸지 마세요.`;

export function specUser(context: ProjectContext, spec: Specification): string {
  const ctx = JSON.stringify(context, null, 2);
  return `[프로젝트 공통 컨텍스트]\n${ctx}\n\n[작성할 명세서]\n제목: ${spec.title}\n목적: ${spec.description}\n주요 작성 항목: ${spec.sections.join(", ") || "(자유 구성)"}\n\n위 명세서를 Markdown 문서로 작성하세요. 문서 최상단은 "# ${spec.title}" 로 시작합니다.`;
}

/** 검토 의견을 사람이 읽는 한 줄로 */
export function reviewLine(r: ReviewItem): string {
  return `[${REVIEW_STATUS_LABEL[r.status]}] ${r.title}`;
}
