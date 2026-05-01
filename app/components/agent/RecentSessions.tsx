'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { formatCategoryName, formatDeviceName } from "../../lib/utils";

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

type Session = {
  id: string
  sessionCode: string
  outcome: string
  createdAt: string
  answers: unknown[]
  article: {
    category: { slug: string }
    deviceType: { slug: string }
    steps: unknown[]
  }
}

export default function RecentSessions() {
  const [sessions, setSessions] = useState<Session[]>([])

  useEffect(() => {
    const codes = JSON.parse(
      localStorage.getItem('recentSessions') ?? '[]'
    ) as string[]

    if (codes.length === 0) return

    Promise.all(
      codes.map((code) =>
        fetch(`/api/sessions/${encodeURIComponent(code)}`).then((r) =>
          r.ok ? r.json() : null
        )
      )
    ).then((results) => {
      setSessions(results.filter(Boolean))
    })
  }, [])

  if (sessions.length === 0) {
    return (
      <section>
        <h2 className="font-semibold text-gray-900 mb-3">Nylige kundesesjoner</h2>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-sm text-gray-400">
            Ingen sesjoner enda. Slå opp en sesjons-ID for å se den her.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <h2 className="font-semibold text-gray-900 mb-3">Nylige kundesesjoner</h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {sessions.map((session) => {
          const config = outcomeConfig[session.outcome] ?? outcomeConfig.IN_PROGRESS

          return (
            <Link
              key={session.id}
              href={`/agent/sesjoner/${session.sessionCode}`}
              className="flex items-center justify-between px-5 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
            >
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
                  {formatCategoryName(session.article.category.slug)}
                </p>
             <p className="text-xs text-gray-400 mt-0.5">
  {formatDeviceName(session.article.deviceType.slug)} · {session.answers.length} steg fullført · {timeAgo(session.createdAt)}
</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}