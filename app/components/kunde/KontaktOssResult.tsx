"use client";
import { useState } from "react";
import { Copy, Check, PhoneCall, Info } from "lucide-react";
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
    <div className="mt-6 rounded-xl border bg-[#ffffff] border-gray-200 overflow-hidden">
      {/* Header */}
      <div className=" bg-blue-100 px-5 py-4 flex items-center gap-3 border-b border-gray-200">
        <PhoneCall className="w-5 h-5 text-gray-500 shrink-0" />
        <h2 className="font-semibold text-gray-900 text-m">{locale.title}</h2>
      </div>

      <div className="px-5 py-5 space-y-4">
        {/* Body text */}
        {locale.body?.length > 0 && <BodyRenderer body={locale.body} />}

        {/* Session code card */}
        <div className="rounded-xl bg-blue-50 border border-blue-100 px-5 py-4 flex flex-col items-center text-center gap-2">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
            Din sesjons-ID
          </p>
          
          <span className="font-mono text-2xl font-bold tracking-widest text-blue-900">
            {sessionCode}
          </span>
          
          <button
            onClick={handleCopy}
            className="mt-1 flex items-center gap-1.5 px-4 py-1.5 text-sm border border-blue-200 bg-white rounded-lg hover:bg-blue-50 transition-colors text-blue-700 font-medium"
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
 {/* Info boxes */}
        <div className="rounded-lg border border-[#f5deb3] bg-[#fffbf0] px-4 py-3.5 flex gap-3">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="font-semibold text-gray-800 mb-1.5">
              Hva er en sesjons-ID
            </p>
            <p className="text-gray-600 leading-relaxed">
              Denne ID-en lagrer feilsøkingen du har gjort i denne guiden. 
              Oppgi ID-en til kundeservice hvis du trenger hjelp senere, så kan vi hjelpe deg raskere! 
            </p>
          </div>
        </div>
 
        {/* What the agent sees */}
        <div className="rounded-lg border border-[#f5deb3] bg-[#fffbf0] px-4 py-3.5 flex gap-3">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="font-semibold text-gray-800 mb-1.5">
              Hva agenten ser når du oppgir ID-en
            </p>
            <ul className="text-gray-600 leading-relaxed space-y-1">
              <li>Hvilken guide du fulgte</li>
              <li>Hvilke steg du gjennomførte</li>
              <li>Hvor i feilsøkingen du eskalerte</li>
            </ul>
          </div>
        </div>
 
        {/* Phone contact */}
        <div className="rounded-lg border border-[#b8d4e8] bg-[#e8f4f8] px-4 py-3.5 flex items-start gap-3">
          <PhoneCall className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <a 
              href="tel:91509000"
              className="font-semibold text-gray-900 hover:underline text-base"
            >
              91 50 90 00
            </a>
            <div className="text-sm text-gray-600 mt-1.5 space-y-0.5">
              <p>Hverdager 08–19</p>
              <p>Lørdag 09–16</p>
              <p>Søndag/Helligdag — stengt</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
 