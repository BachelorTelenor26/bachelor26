import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

type Session = {
  id: string
  sessionCode: string
  outcome: string
  createdAt: string
  routerModel: string | null
  article: {
    title: string
    category: { name: string }
    steps: unknown[]
  }
  answers: unknown[]
}

const outcomeConfig: Record<string, { label: string; className: string }> = {
  RESOLVED: { label: 'Løst', className: 'bg-green-100 text-green-700' },
  ESCALATED: { label: 'Eskalert', className: 'bg-red-100 text-red-700' },
  ABANDONED: { label: 'Avbrutt', className: 'bg-gray-100 text-gray-600' },
  IN_PROGRESS: { label: 'Åpen', className: 'bg-yellow-100 text-yellow-700' },
}

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (diff < 1) return 'akkurat nå'
  if (diff < 60) return `${diff} min siden`
  return `${Math.floor(diff / 60)} t siden`
}

interface RecentSessionsProps {
  sessions: Session[]
}

export default function RecentSessions({ sessions }: RecentSessionsProps) {
  return (
    <section>
      <h2 className="font-semibold text-gray-900 mb-3">Nylige kundesesjoner</h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {sessions.map((session) => {
          const config = outcomeConfig[session.outcome] ?? outcomeConfig.IN_PROGRESS
          const currentStep = session.answers.length
          const totalSteps = session.article.steps.length

          return (
            <Link
              key={session.id}
              href={`/agent/session/${session.id}`}
              className="flex items-center justify-between px-5 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-gray-500">
                      {session.sessionCode}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.className}`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {session.article.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {session.article.category.name} · steg {currentStep}/{totalSteps} · {timeAgo(session.createdAt)}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}