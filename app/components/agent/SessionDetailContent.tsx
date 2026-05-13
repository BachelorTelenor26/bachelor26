'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import SessionCard from '@/app/components/agent/SessionCard'
import SessionStepList from '@/app/components/agent/SessionStepList'
import AiAssistPanel from '@/app/components/agent/AiAssistPanel'

const outcomeOptions = [
  { value: 'IN_PROGRESS', label: 'Pågår' },
  { value: 'RESOLVED', label: 'Løst' },
  { value: 'ESCALATED', label: 'Eskalert' },
  { value: 'ABANDONED', label: 'Avbrutt' },
] as const

type SessionAnswer = {
  id: string
  step: { title: string; imageUrl?: string | null }
  body?: { type: string; content?: { text: string }[]; items?: { text: string }[][] }[] | null
  choice: { label: string } | null
  customText: string | null
}

export type SessionDetailData = {
  id: string
  sessionCode: string | null
  outcome: string
  escalationReason: string | null
  customerServiceNotes?: string | null
  createdAt: string
  routerModel: string | null
  customer: {
    id: string
    email: string | null
    phoneNumber: string | null
    firstName: string
    lastName: string
  } | null
  article: {
    title: string
    category: { name: string }
    deviceType: { name: string }
  }
  answers: SessionAnswer[]
}

type AiHistoryMessage = {
  role: 'agent' | 'ai'
  content: string
}

interface SessionDetailContentProps {
  initialSession: SessionDetailData
  initialHistory?: AiHistoryMessage[]
}

export default function SessionDetailContent({
  initialSession,
  initialHistory = [],
}: SessionDetailContentProps) {
  const [session, setSession] = useState<SessionDetailData>(initialSession)
  const [customerContact, setCustomerContact] = useState(initialSession.customer?.email ?? '')
  const [outcome, setOutcome] = useState(initialSession.outcome)
  const [escalationReason, setEscalationReason] = useState(initialSession.escalationReason ?? '')
  const [customerServiceNotes, setCustomerServiceNotes] = useState(initialSession.customerServiceNotes ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  const handleSessionUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setSaveError(null)
    setSaveSuccess(null)
    setIsSaving(true)

    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerContact,
          outcome,
          escalationReason: outcome === 'ESCALATED' ? escalationReason : '',
          customerServiceNotes,
        }),
      })

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null
        setSaveError(payload?.error ?? 'Kunne ikke oppdatere sesjonen')
        return
      }

      const updated = (await res.json()) as SessionDetailData
      setSession((prev) => ({
        ...prev,
        outcome: updated.outcome,
        escalationReason: updated.escalationReason,
        customerServiceNotes: updated.customerServiceNotes,
        customer: updated.customer,
      }))
      setSaveSuccess('Sesjonen er oppdatert')
    } catch {
      setSaveError('Nettverksfeil. Prøv igjen.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-[1fr_460px] gap-8 items-start">
      <div className="flex flex-col gap-6">
        <form
          onSubmit={handleSessionUpdate}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="customerContact" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Kontaktinfo
              </label>
              <input
                id="customerContact"
                type="text"
                value={customerContact}
                onChange={(e) => setCustomerContact(e.target.value)}
                placeholder="kunde@epost.no eller 12345678"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0064FA] focus:ring-2 focus:ring-[#0064FA]/10"
              />
            </div>

            <div>
              <label htmlFor="sessionOutcome" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Status
              </label>
              <select
                id="sessionOutcome"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0064FA] focus:ring-2 focus:ring-[#0064FA]/10"
              >
                {outcomeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
                <label htmlFor="customerServiceNotes" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Notater
                </label>
                <textarea
                  id="customerServiceNotes"
                  value={customerServiceNotes}
                  onChange={(e) => setCustomerServiceNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0064FA] focus:ring-2 focus:ring-[#0064FA]/10"
                />
              </div>

            {outcome === 'ESCALATED' && (
              <div className="md:col-span-2">
                <label htmlFor="escalationReason" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Begrunnelse for eskalering
                </label>
                <textarea
                  id="escalationReason"
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  required
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0064FA] focus:ring-2 focus:ring-[#0064FA]/10"
                />
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-sm">
              {saveError && <p className="text-red-600">{saveError}</p>}
              {!saveError && saveSuccess && <p className="text-green-600">{saveSuccess}</p>}
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-[#1F74BF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0055D4] disabled:cursor-not-allowed disabled:opacity-80"
            >
              {isSaving ? 'Lagrer...' : 'Oppdater sesjon'}
            </button>
          </div>
        </form>

        <SessionCard
          sessionCode={session.sessionCode}
          outcome={session.outcome}
          createdAt={session.createdAt}
          categoryName={session.article.category.name}
          deviceName={session.article.deviceType.name}
          articleTitle={session.article.title}
          stepCount={session.answers.length}
        />

        {session.answers.length > 0 && (
          <SessionStepList
            answers={session.answers}
            totalSteps={session.answers.length}
          />
        )}
      </div>

      <div className="sticky top-8 self-start">
        <AiAssistPanel
          sessionId={session.id}
          initialHistory={initialHistory}
        />
      </div>
    </div>
  )
}