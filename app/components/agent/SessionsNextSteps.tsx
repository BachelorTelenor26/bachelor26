import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface SessionNextStepsProps {
  articleSlug: string
  nextStep: { id: string; title: string } | null
  nextStepNumber: number
}

export default function SessionNextSteps({
  articleSlug,
  nextStep,
  nextStepNumber,
}: SessionNextStepsProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-900 mb-1">Fortsett feilsøking</h2>
      <p className="text-xs text-gray-400 mb-4">
        Hopp direkte til siste steg kunden avbrøt på:
      </p>

      <div className="flex flex-col gap-2">
        {nextStep ? (
          <Link
            href={`/feilsoking/${articleSlug}`}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#1F74BF] !text-white rounded-lg text-sm font-medium hover:bg-[#0055D4] transition-colors"
          >
            Åpne steg {nextStepNumber}: {nextStep.title}
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Link>
        ) : (
          <p className="text-sm text-gray-400 text-center py-2">
            Ingen neste steg tilgjengelig
          </p>
        )}

        <Link
          href={`/feilsoking/${articleSlug}`}
          className="flex items-center justify-center w-full px-4 py-3 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Se hele guiden
        </Link>
      </div>
    </div>
  )
}