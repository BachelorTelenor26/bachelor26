import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const deviceTypes = await prisma.deviceType.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(deviceTypes);
  } catch (error) {
    console.error("Feil i GET /api/device-types:", error);

    return NextResponse.json(
      { error: "Kunne ikke hente rutermodeller" },
      { status: 500 }
    );
  }
}