interface SessionCardProps {
  sessionCode: string;
  outcome: string;
  createdAt: string;
  categoryName: string;
  deviceName: string;
  articleTitle?: string;
  stepCount?: number;
}

const outcomeConfig: Record<string, { label: string; className: string }> = {
  RESOLVED: { label: "Løst", className: "bg-green-100 text-green-700" },
  ESCALATED: { label: "Eskalert", className: "bg-red-100 text-red-700" },
  ABANDONED: { label: "Avbrutt", className: "bg-gray-100 text-gray-600" },
  IN_PROGRESS: { label: "Pågår", className: "bg-yellow-100 text-yellow-700" },
};

export default function SessionCard({
  sessionCode,
  outcome,
  createdAt,
  categoryName,
  deviceName,
  articleTitle,
  stepCount,
}: SessionCardProps) {
  const config = outcomeConfig[outcome] ?? outcomeConfig.IN_PROGRESS;

  const createdAtLabel = new Date(createdAt).toLocaleString("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Sesjon</p>
          <p className="font-bold text-gray-900 font-mono">{sessionCode}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Opprettet {createdAtLabel} · anonym
          </p>
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${config.className}`}
        >
          {config.label}
        </span>
      </div>

      <div>
        <div>
          <p className="text-xs text-gray-400 mb-2">Guide kunden brukte</p>
          {articleTitle && (
            <p className="text-sm font-semibold text-gray-900 mb-0.5">{articleTitle}</p>
          )}
          <p className="text-sm font-medium text-gray-900">{categoryName}</p>
          <p className="text-xs text-gray-500 mt-0.5">{deviceName}</p>
          {stepCount !== undefined && (
            <p className="text-xs text-gray-400 mt-1">{stepCount} steg fullført</p>
          )}
        </div>
      </div>
    </div>
  );
}
