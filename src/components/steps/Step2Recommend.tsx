"use client";

import { useWizard } from "../WizardContext";
import { Badge } from "../ui";

export default function Step2Recommend() {
  const { specs } = useWizard();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          추천 명세서 목록
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          프로젝트에 필요한 최소 명세서 {specs.length}개를 추천했습니다. 다음
          단계에서 직접 추가·수정할 수 있습니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {specs.map((s) => (
          <article
            key={s.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-slate-900">{s.title}</h3>
              <div className="flex shrink-0 gap-1">
                {s.required ? (
                  <Badge color="blue">필수</Badge>
                ) : (
                  <Badge>선택</Badge>
                )}
                <Badge color="slate">AI</Badge>
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-600">{s.description}</p>
            {s.sections.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {s.sections.map((sec, i) => (
                  <li
                    key={i}
                    className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                  >
                    {sec}
                  </li>
                ))}
              </ul>
            )}
            {s.reason && (
              <p className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-500">
                <span className="font-medium text-slate-600">추천 이유 </span>
                {s.reason}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
