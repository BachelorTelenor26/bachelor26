import { notFound } from 'next/navigation'
import Link from 'next/link'
import SessionCard from "@/app/components/agent/SessionCard"
import SessionStepList from "@/app/components/agent/SessionStepList"
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

  return (
    <div className="max-w-3xl">
      <Link
        href="/agent/dashboard"
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-6"
      >
        ← Dashbord
      </Link>

    
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Slå opp kundesesjon
      </h1>

      <p>Skriv inn en sesjons-ID for å hente kundens aktive økt og feilsøke problemer.</p>

      <div className="flex flex-col gap-4">
        <SessionCard
          sessionCode={session.sessionCode}
          outcome={session.outcome}
          createdAt={session.createdAt.toISOString()}
          categoryName={session.article.category.name}
          deviceName={session.article.deviceType.name}
          articleTitle={session.article.title}
          stepCount={displayAnswers.length}
        />

        {displayAnswers.length > 0 && (
          <SessionStepList
            answers={displayAnswers}
            totalSteps={displayAnswers.length}
          />
        )}
      </div>
    </div>
  )
}