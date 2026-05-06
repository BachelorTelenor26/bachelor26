"use client";
import { useState } from "react";
import SessionLookup from "@/app/components/agent/SessionsLookup";
import SessionCard from "@/app/components/agent/SessionCard";
import SessionStepList from "@/app/components/agent/SessionStepList";
import Link from "next/link";

type SessionResult = {
  id: string
  sessionCode: string
  outcome: string
  createdAt: string
  routerModel: string | null
  article: {
    title: string
    category: { name: string }
    deviceType: { name: string }
  }
  answers: {
    id: string
    step: { title: string; imageUrl?: string | null }
    body?: { type: string; content?: { text: string }[]; items?: { text: string }[][] }[] | null
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
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionCode: code }),
      })

      if (res.status === 400) {
        setError('Ugyldig sesjonskode. Sjekk at koden er riktig.')
        return
      }

      if (res.status === 404) {
        setError('Fant ingen guide for denne koden.')
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
  <div className='mb-6 space-y-2'>
     <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Slå opp kundesesjon
      </h1>

      <p className='text-sm text-gray-600'>
        Skriv inn en sesjons-ID for å hente kundens aktive økt og feilsøke problemer.
      </p>
    </div>

      <SessionLookup
        onSubmit={handleSubmit}
        error={error}
        isLoading={isLoading}
      />

      {session && (
        <div className="mt-6 flex flex-col gap-6">
          <SessionCard
            sessionCode={session.sessionCode}
            outcome={session.outcome}
            createdAt={session.createdAt}
            categoryName={session.article.category.name}
            deviceName={session.article.deviceType.name}
          />

          {session.answers.length > 0 && (
            <SessionStepList
              answers={session.answers}
              totalSteps={session.answers.length}
            />
          )}
        </div>
      )}
    </div>
  )
}
