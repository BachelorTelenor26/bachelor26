"use client";
import { useState } from "react";
import SessionLookup from "@/app/components/agent/SessionsLookup";
import SessionDetailContent from "@/app/components/agent/SessionDetailContent";
import type { SessionDetailData } from "@/app/components/agent/SessionDetailContent";
import Link from "next/link";

export default function SesjonerPage() {
  const [session, setSession] = useState<SessionDetailData | null>(null)
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

      const data = (await res.json()) as SessionDetailData
      setSession(data)
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

        <div className="mb-6 space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Slå opp kundesesjon
          </h1>
          <p className="text-sm text-gray-600">
            Skriv inn en sesjons-ID for å hente kundens aktive økt og feilsøke problemer.
          </p>
        </div>

        <SessionLookup
          onSubmit={handleSubmit}
          error={error}
          isLoading={isLoading}
        />

        {session && (
          <div className="mt-6">
            <SessionDetailContent
              key={session.id}
              initialSession={session}
            />
          </div>
        )}
    </div>
  )
}
