"use client";

import { useEffect, useState } from "react";
import { useWizard } from "../WizardContext";
import { uid } from "@/lib/client";
import {
  REVIEW_STATUS_LABEL,
  type ReviewStatus,
  type Specification,
} from "@/lib/types";
import { Badge, Button } from "../ui";

const STATUS_COLOR: Record<ReviewStatus, "green" | "blue" | "amber" | "red"> = {
  adequate: "green",
  add: "blue",
  modify: "amber",
  delete: "red",
};

export default function Step5Finalize() {
  const { specs, setSpecs, reviews, selectedIds, setSelectedIds } = useWizard();
  const [applied, setApplied] = useState<Set<number>>(new Set());

  // 명세서 생성 대상: 기본 전체 선택. 목록 변동 시 유효 id만 유지.
  useEffect(() => {
    const ids = specs.map((s) => s.id);
    setSelectedIds(
      selectedIds.length === 0
        ? ids
        : selectedIds.filter((id) => ids.includes(id)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specs]);

  function toggleSelect(id: string) {
    setSelectedIds(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    );
  }

  const actionable = reviews
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => r.status !== "adequate");

  function accept(index: number) {
    const r = reviews[index];
    if (r.status === "add") {
      const s: Specification = {
        id: uid(),
        title: r.title,
        description: r.suggestedDescription || "",
        sections: r.suggestedSections || [],
        reason: "LLM 검토 수락(추가)",
        required: false,
        source: "ai",
      };
      setSpecs([...specs, s]);
    } else if (r.status === "modify" && r.targetId) {
      setSpecs(
        specs.map((s) =>
          s.id === r.targetId
            ? {
                ...s,
                description: r.suggestedDescription || s.description,
                sections:
                  r.suggestedSections && r.suggestedSections.length > 0
                    ? r.suggestedSections
                    : s.sections,
              }
            : s,
        ),
      );
    } else if (r.status === "delete" && r.targetId) {
      setSpecs(specs.filter((s) => s.id !== r.targetId));
    }
    setApplied(new Set(applied).add(index));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          최종 명세서 목록 확정
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          검토 의견을 수락/거절하고, 생성할 명세서를 선택한 뒤 확정하세요. 수락한
          의견만 목록에 반영됩니다.
        </p>
      </div>

      {actionable.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">
            LLM 검토 의견
          </h3>
          {actionable.map(({ r, i }) => (
            <div
              key={i}
              className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge color={STATUS_COLOR[r.status]}>
                    {REVIEW_STATUS_LABEL[r.status]}
                  </Badge>
                  <span className="truncate font-medium text-slate-900">
                    {r.title}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{r.reason}</p>
              </div>
              {applied.has(i) ? (
                <Badge color="green">반영됨</Badge>
              ) : (
                <Button variant="ghost" onClick={() => accept(i)}>
                  수락
                </Button>
              )}
            </div>
          ))}
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">
          생성 대상 선택 ({selectedIds.length}/{specs.length})
        </h3>
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {specs.map((s) => (
            <label
              key={s.id}
              className="flex cursor-pointer items-center gap-3 p-3 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(s.id)}
                onChange={() => toggleSelect(s.id)}
              />
              <span className="flex-1 text-sm font-medium text-slate-800">
                {s.title}
              </span>
              {s.required && <Badge color="blue">필수</Badge>}
              <Badge color={s.source === "ai" ? "slate" : "green"}>
                {s.source === "ai" ? "AI" : "사용자"}
              </Badge>
            </label>
          ))}
          {specs.length === 0 && (
            <p className="p-4 text-sm text-slate-400">명세서가 없습니다.</p>
          )}
        </div>
      </section>
    </div>
  );
}
