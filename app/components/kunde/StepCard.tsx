"use client";

import { CheckCircle2 } from "lucide-react";
import BodyRenderer, { LocaleBodyItem } from "./BodyRenderer";

const TELENOR_IMAGE_PREFIX = "https://www.telenor.no/_ipx/f_webp";

function resolveImageUrl(url: string): string {
  if (url.startsWith("http")) return url;
  return `${TELENOR_IMAGE_PREFIX}${url.startsWith("/") ? "" : "/"}${url}`;
}

export type LocaleData = {
  title: string;
  query?: string;
  body: LocaleBodyItem[];
  choices: { label: string; secondaryLabel?: string }[];
};

export type StepChoiceData = {
  id: string;
  nextStepId: string | null;
  sortOrder: number;
  isTerminal: boolean;
  terminalReason: string | null;
};

interface StepCardProps {
  stepIndex: number;
  locale: LocaleData;
  choices: StepChoiceData[];
  /** Index into choices[] of the chosen answer, or null if unanswered */
  chosenIndex: number | null;
  isActive: boolean;
  imageUrl?: string | null;
  onChoiceSelect: (choice: StepChoiceData, choiceIndex: number) => void;
  onEdit: () => void;
}

export default function StepCard({
  stepIndex,
  locale,
  choices,
  chosenIndex,
  isActive,
  imageUrl,
  onChoiceSelect,
  onEdit,
}: StepCardProps) {
  const chosenLabel =
    chosenIndex !== null ? locale.choices[chosenIndex]?.label : null;

  // Collapsed (answered) state
  if (!isActive && chosenIndex !== null) {
    return (
      <div
        className="flex items-start gap-3 py-4 border-b border-gray-100 cursor-pointer group"
        onClick={onEdit}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onEdit()}
      >
        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">
            {locale.title}
          </p>
          {chosenLabel && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {chosenLabel}
            </p>
          )}
        </div>
        <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pt-0.5">
          Endre
        </span>
      </div>
    );
  }

  // Active (current, unanswered) state
  return (
    <div className="py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 mt-0.5 shrink-0 rounded-full bg-blue-600 flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">{stepIndex + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{locale.title}</p>

          {locale.body && locale.body.length > 0 && (
            <div className="mt-2">
              <BodyRenderer body={locale.body} />
            </div>
          )}

          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveImageUrl(imageUrl)}
              alt=""
              className="mt-3 rounded-lg border border-gray-100 max-h-64 object-contain"
            />
          )}

          {locale.query && (
            <p className="mt-3 text-sm font-medium text-gray-700">
              {locale.query}
            </p>
          )}

          {choices.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {choices.map((choice, i) => {
                const label = locale.choices[choice.sortOrder]?.label ?? `Valg ${i + 1}`;
                const isPrimary = i === 0;
                return (
                  <button
                    key={choice.id}
                    onClick={() => onChoiceSelect(choice, choice.sortOrder)}
                    className={
                      isPrimary
                        ? "px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        : "px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
