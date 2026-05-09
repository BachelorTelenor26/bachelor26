"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StepCard, { LocaleData, StepChoiceData } from "./StepCard";
import KontaktOssResult from "./KontaktOssResult";

// ── Types ─────────────────────────────────────────────────────────────────────

type StepChoice = {
  id: string;
  nextStepId: string | null;
  sortOrder: number;
  isTerminal: boolean;
  terminalReason: string | null;
};

type Step = {
  id: string;
  localeKey: string;
  imageUrl: string | null;
  choices: StepChoice[];
};

type ArticleBase = {
  id: string;
  slug: string;
  title: string;
  updatedAt: string | Date;
  category: { name: string; slug: string };
  deviceType: { name: string; slug: string; description?: string | null };
  steps: Step[];
};

export type ArticleWithLocales = ArticleBase & {
  localeMap: Record<string, unknown>;
};

// ── History entry ─────────────────────────────────────────────────────────────

type HistoryEntry = {
  stepId: string;
  choiceId: string;
  choiceIndex: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function findRootStep(steps: Step[]): Step | undefined {
  const referencedIds = new Set(
    steps.flatMap((s) => s.choices.map((c) => c.nextStepId).filter(Boolean))
  );
  return steps.find((s) => !referencedIds.has(s.id));
}

function autoFollowSingle(step: Step, steps: Step[]): Step {
  let current = step;
  const visited = new Set<string>();
  while (true) {
    if (visited.has(current.id)) break;
    visited.add(current.id);
    const sorted = [...current.choices].sort((a, b) => a.sortOrder - b.sortOrder);
    if (sorted.length !== 1 || sorted[0].isTerminal || !sorted[0].nextStepId) break;
    const next = steps.find((s) => s.id === sorted[0].nextStepId);
    if (!next) break;
    current = next;
  }
  return current;
}

function buildActivePath(steps: Step[], history: HistoryEntry[]): Step[] {
  const raw = findRootStep(steps);
  if (!raw) return [];
  const root = autoFollowSingle(raw, steps);
  const activePath: Step[] = [root];
  for (const entry of history) {
    const current = activePath[activePath.length - 1];
    if (!current) break;
    const choice = current.choices.find((c) => c.id === entry.choiceId);
    if (!choice || choice.isTerminal || !choice.nextStepId) break;
    const rawNext = steps.find((s) => s.id === choice.nextStepId);
    if (!rawNext) break;
    activePath.push(autoFollowSingle(rawNext, steps));
  }
  return activePath;
}

const DEVICE_DISPLAY: Record<string, { name: string }> = {
  wifi_ruter_ii: { name: "WiFi Ruter II" },
  wifi_ruter: { name: "WiFi Ruter" },
  zyxel_p8702n: { name: "Zyxel P8702N" },
  huawei_b818: { name: "Huawei B818" },
  jeg_har_en_annen_ruter: { name: "Annen ruter" },
};

// ── Component ─────────────────────────────────────────────────────────────────

interface TroubleshootingFlowProps {
  article: ArticleWithLocales;
  categoryName: string;
  categorySlug: string;
}

export default function TroubleshootingFlow({
  article,
  categoryName,
  categorySlug,
}: TroubleshootingFlowProps) {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const handleChoiceSelect = useCallback(
    (stepIndex: number, choice: StepChoiceData, choiceIndex: number) => {
      const entry: HistoryEntry = {
        stepId: article.steps[stepIndex]?.id ?? "",
        choiceId: choice.id,
        choiceIndex,
      };
      setHistory((prev) => [...prev.slice(0, stepIndex), entry]);
    },
    [article]
  );

  const handleEdit = useCallback((stepIndex: number) => {
    setHistory((prev) => prev.slice(0, stepIndex));
  }, []);

  const localeMap = article.localeMap as Record<string, LocaleData>;
  const activePath = buildActivePath(article.steps, history);
  const updatedAt = new Date(article.updatedAt).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const activeStep = activePath[activePath.length - 1];
  const activeStepIsTerminal =
    activeStep !== undefined &&
    history.length === activePath.length - 1 &&
    activeStep.choices.length === 0;

  const stepsToRender = activeStepIsTerminal ? activePath.slice(0, -1) : activePath;
  const terminalLocale = activeStepIsTerminal ? (localeMap[activeStep.id] ?? null) : null;


  //  handle forrige knapp
  const handlePrevious = useCallback(() => {
    setHistory((prev) => prev.slice(0, -1));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link
        href={`/feilsoking/${categorySlug}`}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-8"
      >
        ← Tilbake til Bytt enhet
      </Link>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="inline-block text-xs font-medium bg-blue-50 text-blue-600  py-1 rounded-full">
          {categoryName}
        </span>
        <span className="text-xs text-gray-700">Oppdatert {updatedAt}</span>
        <div className="ml-auto flex items-center gap-1.5 bg-[#ffffff] text-xs text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1">
          <span>
            {DEVICE_DISPLAY[article.deviceType.slug]?.name ?? article.deviceType.name}
          </span>
          <button
            onClick={() => router.push(`/feilsoking/${categorySlug}`)}
            className="text-blue-500 hover:underline"
          >
            Bytt
          </button>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">{categoryName}</h1>
      <p className="text-sm text-gray-500 mb-6">
        Start router på nytt, sjekk kabler og fiberboks steg for steg
      </p>


      <div className="bg-white border border-gray-200 rounded-xl px-7">
                  <div className="py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">Feilsøking</p>
                  </div>

                  {stepsToRender.map((step, idx) => {
                    const locale = localeMap[step.id];
                    if (!locale) return null;

                    const isAnswered = idx < history.length;
                    const isActive = idx === history.length;
                    const sortedChoices = [...step.choices].sort((a, b) => a.sortOrder - b.sortOrder);

                    return (
                      <StepCard
                        key={step.id}
                        stepIndex={idx}
                        locale={locale}
                        choices={sortedChoices as StepChoiceData[]}
                        chosenIndex={isAnswered ? history[idx].choiceIndex : null}
                        isActive={isActive}
                        imageUrl={step.imageUrl}
                        onChoiceSelect={(choice, choiceIndex) =>
                          handleChoiceSelect(idx, choice, choiceIndex)
                        }
                        onEdit={() => handleEdit(idx)}
                      />
                    );
                  })}

                  <button
                      onClick={handlePrevious} 
                      disabled={history.length === 0}
                      className={`
                        text-sm font-medium transition cursor-pointer m-5
                        ${
                          history.length === 0
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-blue-600 hover:text-blue-500"
                        }
                        `} 
                    >
                      ← Forrige
                    </button>
                </div>

                {activeStepIsTerminal && terminalLocale && (
                  <KontaktOssResult
                    locale={terminalLocale}
                    articleSlug={article.slug}
                    choiceIndices={history.map((h) => h.choiceIndex)}
                  />
                )}
      
       </div>
   
  );
}
