import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    const session = await prisma.troubleshootingSession.findUnique({
      where: { id },
      include: {
        article: {
          include: { category: true, deviceType: true },
        },
        answers: {
          include: {
            step: true,
            choice: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Sesjon ikke funnet" },
        { status: 404 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Feil i GET /api/sessions/[id]:", error);

    return NextResponse.json(
      { error: "Kunne ikke hente sesjon" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { outcome, completed, escalationReason } = body;

    const session = await prisma.troubleshootingSession.update({
      where: { id },
      data: {
        ...(outcome && { outcome }),
        ...(completed !== undefined && { completed }),
        ...(escalationReason && { escalationReason }),
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error("Feil i PATCH /api/sessions/[id]:", error);

    return NextResponse.json(
      { error: "Kunne ikke oppdatere sesjon" },
      { status: 500 }
    );
  }
}