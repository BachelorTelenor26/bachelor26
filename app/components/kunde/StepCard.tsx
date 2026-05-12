"use client";

import { useState } from "react";
import Image from "next/image";
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
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
  const chosenLabel =
    chosenIndex !== null ? locale.choices[chosenIndex]?.label : null;

  const imageModal = expandedImageUrl && (
    <div
      className="fixed inset-0 z-50 bg-black/50 px-4 py-8 flex items-center justify-center"
      onClick={() => setExpandedImageUrl(null)}
    >
      <div
        className="rounded-xl bg-white p-4 shadow-2xl flex flex-col h-[70vh] w-[50vw] max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Bilde</h2>
          <button
            onClick={() => setExpandedImageUrl(null)}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
          >
            Lukk
          </button>
        </div>
        <div className="relative flex-1 w-auto h-full">
          <Image
            src={expandedImageUrl}
            alt=""
            fill
            sizes="auto"
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );

  if (!isActive && chosenIndex !== null) {
    return (
      <>
        {imageModal}
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
      </>
    );
  }

  return (
    <>
      {imageModal}
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
            <div className="relative mt-3 h-96 w-full rounded-lg border border-gray-100 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setExpandedImageUrl(resolveImageUrl(imageUrl))}>
              <Image
                src={resolveImageUrl(imageUrl)}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                className="object-contain"
              />
            </div>
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
                const isSelected = chosenIndex !== null && chosenIndex === choice.sortOrder;
                return (
                  <button
                    key={choice.id}
                    onClick={() => onChoiceSelect(choice, choice.sortOrder)}
                    className={
                      isSelected
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
    </>
  );
}
