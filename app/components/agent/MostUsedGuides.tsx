import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

type Article = {
  slug: string
  title: string
  category: { name: string }
  updatedAt: string
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

async function getArticles() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/articles`, {
    cache: 'no-store'
  })
  return res.json()
}

export default async function MostUsedGuides() {
  const articles: Article[] = await getArticles()

  return (
    <section>
      <h2 className="font-semibold text-gray-900 mb-3">
        Mest brukte guider denne uken
      </h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {articles.slice(0, 5).map((article, index) => (
          <Link
            key={article.slug}
            href={`/feilsoking/${article.slug}`}
            className="flex items-center justify-between px-5 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">
                {article.title}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {article.category.name} · oppdatert {formatDate(article.updatedAt)}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                {(5 - index) * 24} visn.
              </span>
              <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}