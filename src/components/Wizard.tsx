"use client";

import { useWizard, TOTAL_STEPS } from "./WizardContext";
import Stepper from "./Stepper";
import { Button } from "./ui";
import Step1Input from "./steps/Step1Input";
import Step2Recommend from "./steps/Step2Recommend";
import Step3Edit from "./steps/Step3Edit";
import Step4Review from "./steps/Step4Review";
import Step5Finalize from "./steps/Step5Finalize";
import Step6Generate from "./steps/Step6Generate";

export default function Wizard() {
  const w = useWizard();

  // 다음 버튼 라벨 / 활성화 (step1은 자체 버튼으로 진행)
  const nextLabel =
    w.step === 2
      ? "명세서 수정하기"
      : w.step === 4
        ? "최종 확정하기"
        : w.step === 5
          ? "명세서 생성 시작"
          : "다음 단계";

  const nextDisabled =
    (w.step === 3 && w.specs.length === 0) ||
    (w.step === 5 && w.selectedIds.length === 0);

  const showNext = w.step > 1 && w.step < TOTAL_STEPS;
  const showPrev = w.step > 1;

  return (
    <div className="flex min-h-full flex-col">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
                明
              </span>
              <h1 className="text-lg font-bold text-slate-900">명세서 제조기</h1>
            </div>
            <span className="text-sm text-slate-500">
              STEP {w.step} / {TOTAL_STEPS}
            </span>
          </div>
          <Stepper />
        </div>
      </header>

      {/* 본문 */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {w.step === 1 && <Step1Input />}
        {w.step === 2 && <Step2Recommend />}
        {w.step === 3 && <Step3Edit />}
        {w.step === 4 && <Step4Review />}
        {w.step === 5 && <Step5Finalize />}
        {w.step === 6 && <Step6Generate />}
      </main>

      {/* 푸터 네비게이션 */}
      <footer className="sticky bottom-0 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            {showPrev && (
              <Button variant="ghost" onClick={w.prev}>
                이전 단계
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {w.step === TOTAL_STEPS && (
              <Button variant="ghost" onClick={w.reset}>
                처음부터
              </Button>
            )}
            {showNext && (
              <Button onClick={w.next} disabled={nextDisabled}>
                {nextLabel}
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
