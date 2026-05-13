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
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [showSpeedtestWidget, setShowSpeedtestWidget] = useState(false);

  const localeMap = article.localeMap as Record<string, LocaleData>;
  const activePath = buildActivePath(article.steps, history);
  const hasTerminalTail =
    activePath.length > 0 &&
    activePath[activePath.length - 1].choices.length === 0 &&
    history.length === activePath.length - 1;
  const stepsToRender = hasTerminalTail ? activePath.slice(0, -1) : activePath;
  const pointerFallback = history.length;
  const activeStepPointer = Math.max(
    0,
    Math.min(activeStepIndex ?? pointerFallback, stepsToRender.length)
  );
  const isReviewingPreviousStep = activeStepPointer < history.length;

  const handleChoiceSelect = useCallback(
    (stepIndex: number, choice: StepChoiceData, choiceIndex: number) => {
      if (choice.terminalReason === "SPEEDTEST") {
        setShowSpeedtestWidget(true);
        return;
      }

      setShowSpeedtestWidget(false);
      const entry: HistoryEntry = {
        stepId: activePath[stepIndex]?.id ?? "",
        choiceId: choice.id,
        choiceIndex,
      };
      setHistory((prev) => {
        const existing = prev[stepIndex];
        if (existing?.choiceId === choice.id) return prev;
        return [...prev.slice(0, stepIndex), entry];
      });
      setActiveStepIndex(stepIndex + 1);
    },
    [activePath]
  );

  const handleEdit = useCallback((stepIndex: number) => {
    setShowSpeedtestWidget(false);
    setActiveStepIndex(stepIndex);
  }, []);
  const updatedAt = new Date(article.updatedAt).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const activeStep = activePath[activePath.length - 1];
  const activeStepIsTerminal =
    activeStep !== undefined &&
    history.length === activePath.length - 1 &&
    activeStep.choices.length === 0 &&
    !isReviewingPreviousStep;
  const terminalLocale = activeStepIsTerminal ? (localeMap[activeStep.id] ?? null) : null;


  const handlePrevious = useCallback(() => {
    setShowSpeedtestWidget(false);
    setActiveStepIndex((prev) => {
      const current = prev ?? history.length;
      return Math.max(0, current - 1);
    });
  }, [history.length]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link
        href={`/feilsoking/${categorySlug}`}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-8"
      >
        ← Tilbake til Bytt enhet
      </Link>

      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
        <span className="inline-flex items-center font-medium bg-blue-50 text-blue-700  px-2.5 py-1 rounded-full">
          {categoryName}
        </span>
        <span className=" text-gray-500">Oppdatert {updatedAt}</span>
        <button
            onClick={() => router.push(`/feilsoking/${categorySlug}`)}
            className="text-blue-500 hover:bg-gray-50 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-gray-700 hover-bg-gray-50 transition-colors cursor-pointer"
          >
            <span className="text-blue-600 font-medium">
              Bytt
            </span>
            <span className="h-3 w-px bg-gray-200" />
            
               <span>
                  {DEVICE_DISPLAY[article.deviceType.slug]?.name ?? article.deviceType.name}
                </span>
        </button>
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
                    const isActive = idx === activeStepPointer;
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
                      disabled={activeStepPointer === 0}
                      className={`
                        text-sm font-medium transition cursor-pointer m-5
                        ${
                          activeStepPointer === 0
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

                {showSpeedtestWidget && (
                  <div
                    className="fixed inset-0 z-50 bg-black/50 px-4 py-8"
                    onClick={() => setShowSpeedtestWidget(false)}
                  >
                    <div
                      className="mx-auto max-w-3xl rounded-xl bg-white p-4 shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-base font-semibold text-gray-900">Hastighetstest</h2>
                        <button
                          onClick={() => setShowSpeedtestWidget(false)}
                          className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Lukk
                        </button>
                      </div>
                      <iframe
                        src="https://speedmeter.dev/widget.html"
                        title="SpeedMeter"
                        width="100%"
                        height="420"
                        allow="clipboard-write"
                        className="w-full rounded-lg border border-gray-200"
                      />
                    </div>
                  </div>
                )}
      
       </div>
   
  );
}
