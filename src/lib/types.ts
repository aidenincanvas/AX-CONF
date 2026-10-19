// 공통 데이터 모델

export type SpecSource = "ai" | "user";

/** 명세서 1건 */
export interface Specification {
  id: string;
  title: string;
  description: string;
  sections: string[];
  reason: string;
  required: boolean;
  source: SpecSource;
}

/** LLM 검토 의견 상태 */
export type ReviewStatus = "adequate" | "add" | "modify" | "delete";

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  adequate: "적합",
  add: "추가 권장",
  modify: "수정 권장",
  delete: "삭제 권장",
};

/** LLM 검토 의견 1건. 기존 명세서를 직접 바꾸지 않고 별도로 관리한다. */
export interface ReviewItem {
  /** 기존 명세서 대상이면 해당 id, 신규 추가 제안이면 null */
  targetId: string | null;
  title: string;
  status: ReviewStatus;
  reason: string;
  /** add / modify 제안 시 제안하는 작성 항목 */
  suggestedSections?: string[];
  suggestedDescription?: string;
}

/** 프로젝트 공통 컨텍스트 */
export interface ProjectContext {
  projectName: string;
  projectDescription: string;
  projectPurpose: string;
  mainUsers: string;
  coreFeatures: string[];
  technicalAssumptions: string[];
  specList: string[];
  glossary: { term: string; definition: string }[];
}

/** 명세서별 생성 상태 */
export type GenerationStatus = "pending" | "generating" | "completed" | "failed";

export interface GenerationResult {
  status: GenerationStatus;
  markdown: string;
  error: string | null;
}
