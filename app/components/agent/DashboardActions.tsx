"use client";

import Link from "next/link";
import { Search, LayoutGrid } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DeviceType = {
  id: string;
  name: string;
  slug: string;
};

export default function DashboardActions() {
  const router = useRouter();
  const [showBlankSessionModal, setShowBlankSessionModal] = useState(false);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [selectedDeviceTypeSlug, setSelectedDeviceTypeSlug] = useState<string>("");
  const [isLoadingDeviceTypes, setIsLoadingDeviceTypes] = useState(false);
  const [isStartingBlankSession, setIsStartingBlankSession] = useState(false);
  const [blankSessionError, setBlankSessionError] = useState<string | null>(null);

  useEffect(() => {
    if (!showBlankSessionModal || deviceTypes.length > 0) return;

    let isMounted = true;

    const loadDeviceTypes = async () => {
      setIsLoadingDeviceTypes(true);
      setBlankSessionError(null);
      try {
        const res = await fetch("/api/device-types");
        if (!res.ok) {
          if (isMounted) setBlankSessionError("Kunne ikke hente enheter.");
          return;
        }
        const data = (await res.json()) as DeviceType[];
        if (!isMounted) return;
        setDeviceTypes(data);
        if (data.length > 0) {
          setSelectedDeviceTypeSlug(data[0].slug);
        }
      } catch {
        if (isMounted) setBlankSessionError("Nettverksfeil ved henting av enheter.");
      } finally {
        if (isMounted) setIsLoadingDeviceTypes(false);
      }
    };

    loadDeviceTypes();

    return () => {
      isMounted = false;
    };
  }, [deviceTypes.length, showBlankSessionModal]);

  const handleStartBlankSession = async () => {
    if (!selectedDeviceTypeSlug) {
      setBlankSessionError("Velg en enhet først.");
      return;
    }

    setIsStartingBlankSession(true);
    setBlankSessionError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceTypeSlug: selectedDeviceTypeSlug }),
      });

      if (!res.ok) {
        setBlankSessionError("Kunne ikke opprette blank sesjon.");
        return;
      }

      const data = (await res.json()) as { id?: string };
      if (!data?.id) {
        setBlankSessionError("Sesjonen ble opprettet, men kunne ikke åpnes.");
        return;
      }

      setShowBlankSessionModal(false);
      router.push(`/agent/session/${data.id}`);
    } catch {
      setBlankSessionError("Nettverksfeil. Prøv igjen.");
    } finally {
      setIsStartingBlankSession(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 flex-col sm:flex-row">
        <button
          onClick={() => setShowBlankSessionModal(true)}
          className="flex items-center gap-2 px-4 py-2 border bg-white border-gray-400 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Start blank sesjon
        </button>
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

      {showBlankSessionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setShowBlankSessionModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900">Start blank sesjon</h2>
            <p className="mt-1 text-sm text-gray-600">Velg enhet for ny kundesesjon.</p>

            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
                Enhet
              </label>
              <select
                value={selectedDeviceTypeSlug}
                onChange={(event) => setSelectedDeviceTypeSlug(event.target.value)}
                disabled={isLoadingDeviceTypes || isStartingBlankSession}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0064FA] focus:ring-2 focus:ring-[#0064FA]/10 disabled:bg-gray-100"
              >
                {deviceTypes.map((deviceType) => (
                  <option key={deviceType.id} value={deviceType.slug}>
                    {deviceType.name}
                  </option>
                ))}
              </select>
            </div>

            {blankSessionError && <p className="mt-3 text-sm text-red-600">{blankSessionError}</p>}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowBlankSessionModal(false)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Avbryt
              </button>
              <button
                onClick={handleStartBlankSession}
                disabled={isLoadingDeviceTypes || isStartingBlankSession || deviceTypes.length === 0}
                className="rounded-lg bg-[#1F74BF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0055D4] disabled:cursor-not-allowed disabled:opacity-80"
              >
                {isStartingBlankSession ? "Starter..." : "Start sesjon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}