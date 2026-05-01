import { Check } from 'lucide-react'

interface Answer {
  id: string
  step: { id: string; title: string }
  choice: { label: string } | null
  customText: string | null
}

interface SessionStepListProps {
  answers: Answer[]
  nextStep: { id: string; title: string } | null
  outcome: string
}

export default function SessionStepList({
  answers,
  nextStep,
  outcome,
}: SessionStepListProps) {
  return (
    <div className="flex flex-col">
      <h2 className="font-semibold text-gray-900 mb-3">Hva kunden har forsøkt</h2>

      {answers.map((answer) => (
        <div
          key={answer.id}
          className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0"
        >
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
            <Check className="w-3.5 h-3.5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-400 line-through">
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

      {nextStep && outcome !== 'RESOLVED' && (
        <div className="flex items-start gap-3 py-3">
          <div className="w-6 h-6 rounded-full bg-[#0064FA] flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-xs font-medium text-white">
              {answers.length + 1}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {nextStep.title}
            </p>
            <p className="text-xs text-[#0064FA] mt-0.5">Neste steg</p>
          </div>
        </div>
      )}
    </div>
  )
}