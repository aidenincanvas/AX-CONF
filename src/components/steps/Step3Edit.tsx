"use client";

import { useWizard } from "../WizardContext";
import { uid } from "@/lib/client";
import type { Specification } from "@/lib/types";
import { Badge, Button } from "../ui";

export default function Step3Edit() {
  const { specs, setSpecs } = useWizard();

  function update(id: string, patch: Partial<Specification>) {
    setSpecs(specs.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  function remove(id: string) {
    setSpecs(specs.filter((s) => s.id !== id));
  }
  function add() {
    const s: Specification = {
      id: uid(),
      title: "새 명세서",
      description: "",
      sections: [],
      reason: "사용자 추가",
      required: false,
      source: "user",
    };
    setSpecs([...specs, s]);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            명세서 추가 / 수정
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            이름·설명·작성 항목을 직접 편집하거나 명세서를 추가·삭제하세요.
          </p>
        </div>
        <Button variant="ghost" onClick={add}>
          + 명세서 추가
        </Button>
      </div>

      <div className="space-y-4">
        {specs.map((s) => (
          <article
            key={s.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <input
                value={s.title}
                onChange={(e) => update(s.id, { title: e.target.value })}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500"
              />
              <label className="flex items-center gap-1.5 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={s.required}
                  onChange={(e) =>
                    update(s.id, { required: e.target.checked })
                  }
                />
                필수
              </label>
              <Badge color={s.source === "ai" ? "slate" : "green"}>
                {s.source === "ai" ? "AI" : "사용자"}
              </Badge>
              <Button variant="danger" onClick={() => remove(s.id)}>
                삭제
              </Button>
            </div>

            <textarea
              value={s.description}
              onChange={(e) => update(s.id, { description: e.target.value })}
              rows={2}
              placeholder="명세서 목적"
              className="mt-3 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
            />

            <label className="mt-3 block text-xs font-medium text-slate-500">
              주요 작성 항목 (줄바꿈으로 구분)
            </label>
            <textarea
              value={s.sections.join("\n")}
              onChange={(e) =>
                update(s.id, {
                  sections: e.target.value
                    .split("\n")
                    .map((v) => v.trim())
                    .filter(Boolean),
                })
              }
              rows={3}
              className="mt-1 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
            />
          </article>
        ))}
        {specs.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
            명세서가 없습니다. 추가하세요.
          </p>
        )}
      </div>
    </div>
  );
}
