import { notFound } from 'next/navigation'
import Link from 'next/link'
import SessionDetailContent from "@/app/components/agent/SessionDetailContent"
import type { SessionDetailData } from "@/app/components/agent/SessionDetailContent"
import { prisma } from "@/lib/prisma"
import { readFile } from "node:fs/promises"
import path from "node:path"

async function readLocale(localeKey: string): Promise<{
  title?: string
  query?: string
  body?: { type: string; content?: { text: string }[]; items?: { text: string }[][] }[]
  choices?: { label: string }[]
} | null> {
  try {
    const file = path.join(process.cwd(), "public", "locales", `${localeKey}.json`)
    return JSON.parse(await readFile(file, "utf-8"))
  } catch { return null }
}

async function getSession(id: string) {
  return prisma.troubleshootingSession.findUnique({
    where: { id },
    include: {
      article: {
        include: { category: true, deviceType: true },
      },
      answers: {
        include: { step: true, choice: true },
        orderBy: { createdAt: 'asc' },
      },
      aiInteractions: {
        select: {
          agentNotes: true,
          aiResponse: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession(id)
  if (!session) notFound()

  const customer = session.customerId
    ? await prisma.user.findUnique({
        where: { id: session.customerId },
        select: {
          id: true,
          email: true,
          phoneNumber: true,
          firstName: true,
          lastName: true,
        },
      })
    : null

  const displayAnswers = await Promise.all(
    session.answers.map(async (a) => {
      const locale = await readLocale(a.step.localeKey)
      const stepTitle = locale?.title ?? a.step.title
      const choiceLabel = a.choice
        ? (locale?.choices?.[a.choice.sortOrder]?.label ?? a.choice.label)
        : null
      return {
        id: a.id,
        step: { title: stepTitle, imageUrl: a.step.imageUrl },
        body: locale?.body ?? null,
        choice: choiceLabel ? { label: choiceLabel } : null,
        customText: a.customText,
      }
    })
  )

  const aiHistory = session.aiInteractions.flatMap((interaction) => {
    const messages: Array<{ role: 'agent' | 'ai'; content: string }> = []
    if (interaction.agentNotes?.trim()) {
      messages.push({ role: 'agent', content: interaction.agentNotes.trim() })
    }
    if (interaction.aiResponse?.trim()) {
      messages.push({ role: 'ai', content: interaction.aiResponse.trim() })
    }
    return messages
  })

  const initialSession: SessionDetailData = {
    id: session.id,
    sessionCode: session.sessionCode,
    outcome: session.outcome,
    escalationReason: session.escalationReason,
    customerServiceNotes: session.customerServiceNotes,
    createdAt: session.createdAt.toISOString(),
    routerModel: session.routerModel,
    customer,
    article: session.article,
    answers: displayAnswers,
  }

  return (
    <div>
      <Link
        href="/agent/dashboard"
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-6"
      >
        ← Dashbord
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Kundesesjon
      </h1>

      <p>Skriv inn en sesjons-ID for å hente kundens aktive økt og feilsøke problemer.</p>

      <div className="mt-6">
        <SessionDetailContent
          initialSession={initialSession}
          initialHistory={aiHistory}
        />
      </div>
    </div>
  )
}