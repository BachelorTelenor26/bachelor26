import { Check } from 'lucide-react'

interface Answer {
  id: string
  step: { title: string }
  choice: { label: string } | null
  customText: string | null
}

interface SessionStepListProps {
  answers: Answer[]
  totalSteps: number
}

export default function SessionStepList({
  answers,
  totalSteps,
}: SessionStepListProps) {
  const answeredIds = new Set(answers.map((a) => a.id))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-900 mb-4">Hva kunden har forsøkt</h2>
      <div className="flex flex-col gap-3">
        {answers.map((answer, index) => (
          <div
            key={answer.id}
            className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0"
          >
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-900">
                {answer.step.title}
              </p>
              {answer.choice && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {answer.choice.label}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Ubesvarte steg */}
        {Array.from({ length: totalSteps - answers.length }).map((_, i) => (
          <div
            key={`unanswered-${i}`}
            className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0"
          >
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs text-gray-400">{answers.length + i + 1}</span>
            </div>
            <p className="text-sm text-gray-400">Ikke fullført</p>
          </div>
        ))}
      </div>
    </div>
  )
}