"use client";
import { useState, useEffect } from "react";

interface SessionCardProps {
  sessionCode: string;
  outcome: string;
  createdAt: string;
  categoryName: string;
  deviceName: string;
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
}: SessionCardProps) {
  const config = outcomeConfig[outcome] ?? outcomeConfig.IN_PROGRESS;
 const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const timeAgo = () => {
    const diff = Math.floor(
      (now - new Date(createdAt).getTime()) / 60000
    );

    if (diff < 1) return "akkurat nå";
    if (diff < 60) return `${diff} min siden`;

    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours} t siden`;

    const days = Math.floor(hours / 24);
    return `${days} d siden`;
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Sesjon</p>
          <p className="font-bold text-gray-900 font-mono">{sessionCode}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Opprettet {timeAgo()} · anonym
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
          <p className="text-sm font-medium text-gray-900">{categoryName}</p>
          <p className="text-xs text-gray-500 mt-0.5">{deviceName}</p>
        </div>
      </div>
    </div>
  );
}
