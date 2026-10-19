"use client";

import { useState } from "react";
import { useWizard } from "../WizardContext";
import { api, uid } from "@/lib/client";
import type { Specification } from "@/lib/types";
import type { RecommendResponse } from "@/lib/schemas";
import { Button, ErrorBanner, Spinner } from "../ui";

export default function Step1Input() {
  const { projectDescription, setProjectDescription, setSpecs, next } =
    useWizard();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = projectDescription.trim().length >= 5;

  async function generate() {
    if (!valid) {
      setError("프로젝트 설명을 5자 이상 입력하세요.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await api.post<RecommendResponse>("/api/recommend", {
        projectDescription: projectDescription.trim(),
      });
      const specs: Specification[] = data.specifications.map((s) => ({
        id: uid(),
        title: s.title,
        description: s.description,
        sections: s.sections,
        reason: s.reason,
        required: s.required,
        source: "ai",
      }));
      setSpecs(specs);
      next();
    } catch (e) {
      setError(e instanceof Error ? e.message : "명세서 추천에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          어떤 서비스를 만드시나요?
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          한 줄로 프로젝트를 설명하면 개발에 필요한 명세서 목록을 추천해
          드립니다.
        </p>
      </div>

      <textarea
        value={projectDescription}
        onChange={(e) => setProjectDescription(e.target.value)}
        rows={4}
        placeholder="예) 반려동물 산책 메이트를 매칭해 주는 모바일 웹 서비스"
        className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />

      {error && <ErrorBanner message={error} />}

      <div className="flex items-center gap-3">
        <Button onClick={generate} disabled={loading || !valid}>
          {loading ? <Spinner label="추천 생성 중…" /> : "명세서 목록 생성"}
        </Button>
        {!valid && (
          <span className="text-xs text-slate-400">5자 이상 입력</span>
        )}
      </div>
    </div>
  );
}
