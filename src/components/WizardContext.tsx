"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  GenerationResult,
  ProjectContext,
  ReviewItem,
  Specification,
} from "@/lib/types";

export const TOTAL_STEPS = 6;

interface WizardState {
  step: number;
  projectDescription: string;
  specs: Specification[];
  reviews: ReviewItem[];
  /** 생성 대상으로 선택된 명세서 id */
  selectedIds: string[];
  projectContext: ProjectContext | null;
  /** specId -> 생성 결과 */
  generations: Record<string, GenerationResult>;
}

interface WizardApi extends WizardState {
  goTo: (step: number) => void;
  next: () => void;
  prev: () => void;
  setProjectDescription: (v: string) => void;
  setSpecs: (v: Specification[]) => void;
  setReviews: (v: ReviewItem[]) => void;
  setSelectedIds: (v: string[]) => void;
  setProjectContext: (v: ProjectContext | null) => void;
  setGenerations: (
    updater: (prev: Record<string, GenerationResult>) => Record<string, GenerationResult>,
  ) => void;
  reset: () => void;
}

const Ctx = createContext<WizardApi | null>(null);

const INITIAL: WizardState = {
  step: 1,
  projectDescription: "",
  specs: [],
  reviews: [],
  selectedIds: [],
  projectContext: null,
  generations: {},
};

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WizardState>(INITIAL);

  const api = useMemo<WizardApi>(() => {
    const patch = (p: Partial<WizardState>) =>
      setState((s) => ({ ...s, ...p }));
    return {
      ...state,
      goTo: (step) => patch({ step: Math.min(Math.max(step, 1), TOTAL_STEPS) }),
      next: () =>
        setState((s) => ({ ...s, step: Math.min(s.step + 1, TOTAL_STEPS) })),
      prev: () => setState((s) => ({ ...s, step: Math.max(s.step - 1, 1) })),
      setProjectDescription: (projectDescription) =>
        patch({ projectDescription }),
      setSpecs: (specs) => patch({ specs }),
      setReviews: (reviews) => patch({ reviews }),
      setSelectedIds: (selectedIds) => patch({ selectedIds }),
      setProjectContext: (projectContext) => patch({ projectContext }),
      setGenerations: (updater) =>
        setState((s) => ({ ...s, generations: updater(s.generations) })),
      reset: () => setState(INITIAL),
    };
  }, [state]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useWizard(): WizardApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWizard must be used within WizardProvider");
  return ctx;
}
