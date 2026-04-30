interface SessionCardProps {
  sessionCode: string
  outcome: string
  createdAt: string
  articleTitle: string
  categoryName: string
  stepCount: number
}

const outcomeConfig: Record<string, { label: string; className: string }> = {
  RESOLVED: { label: 'Løst', className: 'bg-green-100 text-green-700' },
  ESCALATED: { label: 'Eskalert', className: 'bg-red-100 text-red-700' },
  ABANDONED: { label: 'Avbrutt', className: 'bg-gray-100 text-gray-600' },
  IN_PROGRESS: { label: 'Pågår', className: 'bg-yellow-100 text-yellow-700' },
}

export default function SessionCard({
  sessionCode,
  outcome,
  createdAt,
  articleTitle,
  categoryName,
  stepCount,
}: SessionCardProps) {
  const config = outcomeConfig[outcome] ?? outcomeConfig.IN_PROGRESS

  const timeAgo = () => {
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
    if (diff < 1) return 'akkurat nå'
    if (diff < 60) return `${diff} min siden`
    return `${Math.floor(diff / 60)} t siden`
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Sesjon</p>
          <p className="font-bold text-gray-900 font-mono">{sessionCode}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Opprettet {timeAgo()} · anonym
          </p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${config.className}`}>
          {config.label}
        </span>
      </div>

      <div>
        <p className="text-xs text-gray-400 mb-1">Guide kunden brukte</p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            {categoryName}
          </span>
          <p className="text-sm font-medium text-gray-900">{articleTitle}</p>
        </div>
        <p className="text-xs text-gray-400 mt-1">{stepCount} steg</p>
      </div>
    </div>
  )
}