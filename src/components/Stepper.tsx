"use client";

import { useWizard } from "./WizardContext";

const STEPS = [
  "프로젝트 설명",
  "명세서 추천",
  "추가 / 수정",
  "LLM 검토",
  "최종 확정",
  "명세서 생성",
];

export default function Stepper() {
  const { step } = useWizard();
  return (
    <ol className="flex items-center gap-1 overflow-x-auto">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <li key={label} className="flex items-center">
            <div className="flex items-center gap-2">
              <span
                className={[
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  active
                    ? "bg-blue-600 text-white"
                    : done
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-200 text-slate-500",
                ].join(" ")}
              >
                {done ? "✓" : n}
              </span>
              <span
                className={[
                  "hidden whitespace-nowrap text-sm md:inline",
                  active
                    ? "font-semibold text-slate-900"
                    : "text-slate-500",
                ].join(" ")}
              >
                {label}
              </span>
            </div>
            {n < STEPS.length && (
              <span className="mx-2 h-px w-4 bg-slate-300 md:w-8" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
