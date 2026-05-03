"use client";

import { useRouter } from "next/navigation";
import { Laptop } from "lucide-react";
import DeviceSelector from "./DeviceSelector";

const DEVICE_DISPLAY: Record<string, { name: string; description: string }> = {
  wifi_ruter_ii: { name: "WiFi Ruter II", description: "Mesh-system, to enheter" },
  wifi_ruter: { name: "WiFi Ruter", description: "Enkeltstående ruter" },
  zyxel_p8702n: { name: "Zyxel P8702N", description: "Flat, mørk fiberboks" },
  huawei_b818: { name: "Huawei B818", description: "Hvit, høy 4G-ruter" },
  jeg_har_en_annen_ruter: { name: "Annen ruter", description: "Jeg finner ikke min modell" },
};

interface ArticleSummary {
  slug: string;
  deviceType: { name: string; slug: string; description?: string | null };
}

interface DeviceSelectorPageProps {
  categoryName: string;
  categorySlug: string;
  articles: ArticleSummary[];
}

export default function DeviceSelectorPage({
  categoryName,
  categorySlug,
  articles,
}: DeviceSelectorPageProps) {
  const router = useRouter();

  const devices = articles.map((a) => {
    const display = DEVICE_DISPLAY[a.deviceType.slug] ?? {
      name: a.deviceType.name,
      description: a.deviceType.description ?? "",
    };
    return {
      id: a.slug,
      name: display.name,
      description: display.description,
      image: Laptop as React.FC<{ className?: string }>,
    };
  });

  return (
    <DeviceSelector
      title={categoryName}
      subtitle="Hvilken ruter har du hjemme? Vi tilpasser feilsøkingen til akkurat ditt utstyr."
      category={categoryName}
      devices={devices}
      onSelect={(articleSlug) =>
        router.push(`/feilsoking/${categorySlug}/${articleSlug}`)
      }
    />
  );
}
