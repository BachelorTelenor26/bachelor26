'use client'
import { useState } from 'react'
import SessionLookup from '@/app/components/agent/SessionsLookup'
import SessionCard from '@/app/components/agent/SessionCard'
import SessionStepList from '@/app/components/agent/SessionStepList'
import Link from 'next/link'

type SessionResult = {
  sessionCode: string
  outcome: string
  createdAt: string
  routerModel: string | null
  article: {
    title: string
    steps: unknown[]
    category: { name: string }
    deviceType: { name: string }
  }
  answers: {
    id: string
    step: { title: string }
    choice: { label: string } | null
    customText: string | null
  }[]
}

export default function SesjonerPage() {
  const [session, setSession] = useState<SessionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (code: string) => {
    setError(null)
    setIsLoading(true)

    try {
      const res = await fetch(`/api/sessions/${encodeURIComponent(code)}`)

      if (res.status === 404) {
        setError('Fant ingen sesjon med denne koden. Sjekk at koden er riktig.')
        return
      }

      if (!res.ok) {
        setError('En feil oppstod. Prøv igjen senere.')
        return
      }

      setSession(await res.json())
    } catch {
      setError('Nettverksfeil. Sjekk internettilkoblingen din.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Link
        href="/agent/dashboard"
        className="mb-6 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        ← Dashbord
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Slå opp kundesesjon
      </h1>

      <SessionLookup
        onSubmit={handleSubmit}
        error={error}
        isLoading={isLoading}
      />

      {session && (
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <SessionCard
              sessionCode={session.sessionCode}
              outcome={session.outcome}
              createdAt={session.createdAt}
              articleTitle={session.article.title}
              categoryName={session.article.category.name}
              stepCount={session.article.steps?.length ?? 0}
            />
            {session.answers.length > 0 && (
              <SessionStepList
                answers={session.answers}
                totalSteps={session.article.steps?.length ?? session.answers.length}
              />
            )}
          </div>
          <div>
            {/* SessionNextSteps og SessionSuggestions kommer her */}
          </div>
        </div>
      )}
    </div>
  )
}