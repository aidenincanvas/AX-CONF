"use client";

import { useState } from "react";
import { useWizard } from "../WizardContext";
import { api } from "@/lib/client";
import { REVIEW_STATUS_LABEL, type ReviewItem, type ReviewStatus } from "@/lib/types";
import { Badge, Button, ErrorBanner, Spinner } from "../ui";

const STATUS_COLOR: Record<ReviewStatus, "green" | "blue" | "amber" | "red"> = {
  adequate: "green",
  add: "blue",
  modify: "amber",
  delete: "red",
};

export default function Step4Review() {
  const { projectDescription, specs, reviews, setReviews } = useWizard();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ran, setRan] = useState(reviews.length > 0);

  async function runReview() {
    setError(null);
    setLoading(true);
    try {
      const data = await api.post<{ reviews: ReviewItem[] }>("/api/review", {
        projectDescription,
        specs,
      });
      setReviews(data.reviews);
      setRan(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "검토에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            LLM 명세서 구성 검토
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            현재 {specs.length}개 명세서 구성을 검토합니다. 검토 결과는 의견일
            뿐이며, 수락 여부는 다음 단계에서 결정합니다.
          </p>
        </div>
        <Button onClick={runReview} disabled={loading}>
          {loading ? (
            <Spinner label="검토 중…" />
          ) : ran ? (
            "다시 검토"
          ) : (
            "검토 실행"
          )}
        </Button>
      </div>

      {error && <ErrorBanner message={error} />}

      {ran && reviews.length === 0 && !loading && (
        <p className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          특별한 지적 사항이 없습니다. 구성이 적절합니다.
        </p>
      )}

      <div className="space-y-3">
        {reviews.map((r, i) => (
          <article
            key={i}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Badge color={STATUS_COLOR[r.status]}>
                {REVIEW_STATUS_LABEL[r.status]}
              </Badge>
              <h3 className="font-medium text-slate-900">{r.title}</h3>
              {r.targetId === null && r.status === "add" && (
                <Badge color="slate">신규 제안</Badge>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-600">{r.reason}</p>
            {r.suggestedSections && r.suggestedSections.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {r.suggestedSections.map((sec, j) => (
                  <li
                    key={j}
                    className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                  >
                    {sec}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>

      {!ran && !loading && (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
          검토 실행 버튼을 눌러 LLM 검토를 시작하세요.
        </p>
      )}
    </div>
  );
}
