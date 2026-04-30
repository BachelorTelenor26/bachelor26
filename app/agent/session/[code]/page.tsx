import { notFound } from 'next/navigation'
import Link from 'next/link'
import SessionCard from "@/app/components/agent/SessionCard"
import SessionStepList from "@/app/components/agent/SessionStepList"

async function getSession(code: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/sessions/${code}`,
    { cache: 'no-store' }
  )
  if (!res.ok) return null
  return res.json()
}

export default async function SessionDetailPage({
  params,
}: {
  params: { code: string }
}) {
  const session = await getSession(params.code)
  if (!session) notFound()

  return (
    <div className="max-w-3xl">
      <Link
        href="/agent/session"
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-6"
      >
        ← Dashbord
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Slå opp kundesesjon
      </h1>

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
    </div>
  )
}