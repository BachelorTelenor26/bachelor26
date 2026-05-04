import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { stepId, choiceId, customText } = await request.json();

    if (!stepId) {
      return NextResponse.json(
        { error: "stepId er påkrevd" },
        { status: 400 }
      );
    }

    const session = await prisma.troubleshootingSession.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Sesjon ikke funnet" },
        { status: 404 }
      );
    }

    const answer = await prisma.sessionStepAnswer.upsert({
      where: {
        sessionId_stepId: {
          sessionId: session.id,
          stepId,
        },
      },
      update: {
        choiceId: choiceId ?? null,
        customText: customText ?? null,
      },
      create: {
        sessionId: session.id,
        stepId,
        choiceId: choiceId ?? null,
        customText: customText ?? null,
      },
    });

    return NextResponse.json(answer, { status: 201 });
  } catch (error) {
    console.error("Feil i POST /api/sessions/[code]/answers:", error);

    return NextResponse.json(
      { error: "Kunne ikke logge svar" },
      { status: 500 }
    );
  }
}