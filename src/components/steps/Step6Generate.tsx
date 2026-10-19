"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useWizard } from "../WizardContext";
import { api } from "@/lib/client";
import type {
  GenerationResult,
  ProjectContext,
  Specification,
} from "@/lib/types";
import MarkdownView from "../MarkdownView";
import { Badge, Button, ErrorBanner, Spinner } from "../ui";

type ContextState = "idle" | "loading" | "ready" | "error";

const STATUS_META: Record<
  GenerationResult["status"],
  { label: string; color: "slate" | "blue" | "green" | "red" }
> = {
  pending: { label: "대기", color: "slate" },
  generating: { label: "생성 중", color: "blue" },
  completed: { label: "완료", color: "green" },
  failed: { label: "실패", color: "red" },
};

function safeFileName(title: string, i: number): string {
  const base = title.replace(/[\\/:*?"<>|]/g, "").trim() || "spec";
  return `${String(i + 1).padStart(2, "0")}-${base}.md`;
}

export default function Step6Generate() {
  const {
    projectDescription,
    specs,
    selectedIds,
    projectContext,
    setProjectContext,
    generations,
    setGenerations,
  } = useWizard();

  const targets = useMemo<Specification[]>(
    () => specs.filter((s) => selectedIds.includes(s.id)),
    [specs, selectedIds],
  );

  const [ctxState, setCtxState] = useState<ContextState>(
    projectContext ? "ready" : "idle",
  );
  const [ctxError, setCtxError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(
    targets[0]?.id ?? null,
  );
  const startedRef = useRef(false);

  // 진입 시 1회: 공통 컨텍스트 구성 → 순차 생성
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function boot() {
    let context = projectContext;
    if (!context) {
      setCtxState("loading");
      setCtxError(null);
      try {
        const data = await api.post<{ context: ProjectContext }>(
          "/api/context",
          { projectDescription, specs: targets },
        );
        context = data.context;
        setProjectContext(context);
        setCtxState("ready");
      } catch (e) {
        setCtxState("error");
        setCtxError(
          e instanceof Error ? e.message : "공통 컨텍스트 생성 실패",
        );
        return;
      }
    } else {
      setCtxState("ready");
    }
    // 전체 pending 초기화 후 순차 생성
    setGenerations((prev) => {
      const next = { ...prev };
      for (const t of targets) {
        if (!next[t.id] || next[t.id].status !== "completed") {
          next[t.id] = { status: "pending", markdown: "", error: null };
        }
      }
      return next;
    });
    for (const t of targets) {
      await generateOne(t, context);
    }
  }

  async function generateOne(spec: Specification, context: ProjectContext) {
    setGenerations((prev) => ({
      ...prev,
      [spec.id]: { status: "generating", markdown: prev[spec.id]?.markdown ?? "", error: null },
    }));
    try {
      const data = await api.post<{ markdown: string }>("/api/generate", {
        context,
        spec,
      });
      setGenerations((prev) => ({
        ...prev,
        [spec.id]: { status: "completed", markdown: data.markdown, error: null },
      }));
      setActiveId((cur) => cur ?? spec.id);
    } catch (e) {
      setGenerations((prev) => ({
        ...prev,
        [spec.id]: {
          status: "failed",
          markdown: prev[spec.id]?.markdown ?? "",
          error: e instanceof Error ? e.message : "생성 실패",
        },
      }));
    }
  }

  async function retry(spec: Specification) {
    if (!projectContext) return;
    await generateOne(spec, projectContext);
  }

  async function retryContext() {
    startedRef.current = false;
    await boot();
  }

  // 진행률: 완료 수 / 전체 대상 수. 실패는 완료에 포함하지 않음.
  const completed = targets.filter(
    (t) => generations[t.id]?.status === "completed",
  ).length;
  const progress = targets.length
    ? Math.round((completed / targets.length) * 100)
    : 0;
  const generatingSpec = targets.find(
    (t) => generations[t.id]?.status === "generating",
  );

  const active = targets.find((t) => t.id === activeId) ?? null;
  const activeGen = active ? generations[active.id] : null;

  function downloadOne(spec: Specification, i: number) {
    const md = generations[spec.id]?.markdown;
    if (!md) return;
    triggerDownload(new Blob([md], { type: "text/markdown" }), safeFileName(spec.title, i));
  }

  async function downloadAll() {
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    targets.forEach((t, i) => {
      const md = generations[t.id]?.markdown;
      if (md) zip.file(safeFileName(t.title, i), md);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    triggerDownload(blob, "specifications.zip");
  }

  if (ctxState === "loading") {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <Spinner label="프로젝트 공통 컨텍스트 구성 중…" />
        <p className="text-xs text-slate-400">
          모든 명세서가 공유할 기준 정보를 만들고 있습니다.
        </p>
      </div>
    );
  }

  if (ctxState === "error") {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
        <ErrorBanner message={ctxError || "공통 컨텍스트 생성 실패"} />
        <Button onClick={retryContext}>다시 시도</Button>
      </div>
    );
  }

  const anyCompleted = completed > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">명세서 생성</h2>
          <p className="mt-1 text-sm text-slate-500">
            {generatingSpec
              ? `생성 중: ${generatingSpec.title}`
              : progress === 100
                ? "모든 명세서 생성이 완료되었습니다."
                : "명세서를 순차 생성합니다."}
          </p>
        </div>
        <Button onClick={downloadAll} disabled={!anyCompleted}>
          전체 ZIP 다운로드
        </Button>
      </div>

      {/* 전체 진행률 */}
      <div>
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>
            {completed}/{targets.length} 완료
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* 좌: 명세서 목록 + 상태 */}
        <aside className="space-y-2">
          {targets.map((t) => {
            const g = generations[t.id] ?? {
              status: "pending" as const,
              markdown: "",
              error: null,
            };
            const meta = STATUS_META[g.status];
            const isActive = t.id === activeId;
            return (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={[
                  "w-full rounded-lg border p-3 text-left transition-colors",
                  isActive
                    ? "border-blue-400 bg-blue-50"
                    : "border-slate-200 bg-white hover:bg-slate-50",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-slate-800">
                    {t.title}
                  </span>
                  {g.status === "generating" ? (
                    <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                  ) : (
                    <Badge color={meta.color}>{meta.label}</Badge>
                  )}
                </div>
                {g.status === "failed" && g.error && (
                  <p className="mt-1 truncate text-xs text-red-600">{g.error}</p>
                )}
              </button>
            );
          })}
        </aside>

        {/* 우: 미리보기 */}
        <section className="min-h-[300px] rounded-xl border border-slate-200 bg-white p-6">
          {!active ? (
            <p className="text-sm text-slate-400">
              왼쪽에서 명세서를 선택하세요.
            </p>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <h3 className="font-semibold text-slate-900">{active.title}</h3>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => retry(active)}
                    disabled={activeGen?.status === "generating"}
                  >
                    {activeGen?.status === "failed" ? "재생성" : "다시 생성"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      downloadOne(
                        active,
                        targets.findIndex((t) => t.id === active.id),
                      )
                    }
                    disabled={activeGen?.status !== "completed"}
                  >
                    .md 다운로드
                  </Button>
                </div>
              </div>

              {activeGen?.status === "generating" && (
                <Spinner label="생성 중…" />
              )}
              {activeGen?.status === "pending" && (
                <p className="text-sm text-slate-400">생성 대기 중입니다.</p>
              )}
              {activeGen?.status === "failed" && (
                <ErrorBanner message={activeGen.error || "생성 실패"} />
              )}
              {activeGen?.status === "completed" && (
                <MarkdownView content={activeGen.markdown} />
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
