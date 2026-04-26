import Link from "next/link"
import { ChevronRight } from "lucide-react"
import type { Article } from "../../lib/mockData"

interface ArticleListItemProps {
  article: Article
}

export default function ArticleListItem({ article }: ArticleListItemProps) {
  return (
    <Link
      href={`/feilsoking/${article.slug}`}
      className="flex items-center justify-between px-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
    >
      <div>
        <p className="text-sm font-medium text-gray-900">{article.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {article.category} · oppdatert {article.updatedAt}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
    </Link>
  )
}