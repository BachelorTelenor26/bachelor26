import Link from 'next/link'
import { Search, LayoutGrid } from 'lucide-react'

export default function DashboardActions() {
  return (
    <div className="flex items-center gap-3 flex-col sm:flex-row">
      <Link
        href="/agent/session"
        className="flex items-center gap-2 px-4 py-2 border bg-white border-gray-400 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <LayoutGrid className="w-4 h-4" />
        Slå opp sesjons-ID
      </Link>
      <Link
        href="/agent/sok"
        className="flex items-center gap-2 px-4 py-2 bg-[#1F74BF] text-white! rounded-lg text-sm font-medium hover:bg-[#0055D4] transition-colors"
      >
        <Search className="w-4 h-4" />
        Søk i kunnskapsbasen
      </Link>
    </div>
  )
}