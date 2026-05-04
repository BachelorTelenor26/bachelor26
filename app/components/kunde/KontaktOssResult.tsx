"use client";

import { useState } from "react";
import { Copy, Check, PhoneCall } from "lucide-react";
import BodyRenderer from "./BodyRenderer";
import { LocaleData } from "./StepCard";
import { encodeHandoverCode } from "@/app/lib/sessionCode";

interface KontaktOssResultProps {
  locale: LocaleData;
  articleSlug: string;
  choiceIndices: number[];
}

export default function KontaktOssResult({
  locale,
  articleSlug,
  choiceIndices,
}: KontaktOssResultProps) {
  const [copied, setCopied] = useState(false);

  const sessionCode = encodeHandoverCode(articleSlug, choiceIndices);

  function handleCopy() {
    navigator.clipboard.writeText(sessionCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="mt-6 rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-5 py-4 flex items-center gap-3 border-b border-gray-200">
        <PhoneCall className="w-5 h-5 text-gray-500 shrink-0" />
        <h2 className="font-semibold text-gray-900 text-sm">{locale.title}</h2>
      </div>

      <div className="px-5 py-4 space-y-4">
        {locale.body?.length > 0 && <BodyRenderer body={locale.body} />}

        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">
            Referansekode — oppgi til kundeservice
          </p>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xl font-semibold tracking-widest text-gray-900 bg-gray-100 px-4 py-2 rounded-lg select-all">
              {sessionCode}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  Kopiert
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Kopier
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
